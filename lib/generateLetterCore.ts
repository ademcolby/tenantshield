// lib/generateLetterCore.ts  — SERVER ONLY
//
// The single source of truth for the post-payment letter pipeline. Both entry
// points call this:
//   - app/api/generate-letter/route.ts  (browser-driven, success page)
//   - app/api/webhooks/stripe/route.ts  (browser-independent, Stripe webhook)
//
// Extracting this here (Project C) means the Anthropic call, the
// MISSING_INFORMATION / SCOPE_LIMITATION classification, letter caching, order
// persistence, and the receipt email all live in ONE place and can never drift
// between the two routes.
//
// The function is given an already-verified-paid Stripe session. It does NOT
// verify payment itself — each caller is responsible for confirming
// payment_status === 'paid' before calling, because the two callers verify
// payment differently (the route retrieves the session; the webhook trusts the
// signed checkout.session.completed event).
import type Stripe from 'stripe';
import { SYSTEM_PROMPT } from './systemPrompt';
import { redis, formKey, letterKey, LETTER_TTL_SECONDS } from './redis';
import { computeDates, renderComputedDatesBlock } from './dates';
import { sendLetterEmail } from './email';
import { saveOrder } from './db';
import { generateRefNumber } from './refNumber';

export interface FormData {
  state: string;
  city: string;
  tenantName: string;
  email: string;
  tenantAddress: string;
  landlordName: string;
  landlordAddress: string;
  rentalPropertyAddress: string;
  depositAmount: string;
  vacatedDate: string;
  forwardingAddressDate: string;
  situation: string;
  subtypes: string[];
  specialCircumstances: string[];
  leaseDesignation: string;
  isRentStabilized: string;
  leaseStartDate: string;
  buildingUnitCount: string;
  gaveWrittenNotice: string;
  leaseType: string;
  // ---- Quick Case Check fields (used to derive case_strength for the DB) ----
  itemizationProvided?: string;
  unitCondition?: string;
  damageEstimate?: string;
  unpaidRent?: string;
  unpaidRentAmount?: string;
  properNotice?: string;
  noticeGiven?: string;
  conditionDocumentation?: string;
}

// The shape returned to callers. Mirrors what the routes hand back as JSON.
export type GenerateResult =
  | { kind: 'letter'; letter: string; refNumber: string; cached: boolean }
  | { kind: 'missing_info'; message: string }
  | { kind: 'out_of_scope'; message: string }
  | { kind: 'error'; status: number; message: string };

// --- Case-strength derivation (server mirror of the form's computeTier) -----
//
// Stored on the order purely for admin/analytics (Project D dashboards). It is
// best-effort: if the case-check fields are absent we store undefined. This
// must stay consistent with computeTier() in SecurityDepositForm.tsx; when the
// tiering rules change in the form, update them here too.
function parseMoney(raw: string | undefined): number {
  const cleaned = (raw || '').replace(/[$,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return 0;
  const n = parseFloat(cleaned);
  return n > 0 ? n : 0;
}

function deriveCaseStrength(f: FormData): string | undefined {
  const answered =
    f.itemizationProvided &&
    f.unitCondition &&
    f.unpaidRent &&
    f.properNotice &&
    f.conditionDocumentation;
  if (!answered) return undefined;

  const depositVal = parseMoney(f.depositAmount);
  const unpaidVal = parseMoney(f.unpaidRentAmount);
  const damageVal = parseMoney(f.damageEstimate);

  // Weak: offsets meet or exceed the deposit, or the tenant abandoned.
  if (f.noticeGiven === 'none') return 'weak';
  if (f.unpaidRent === 'yes' && depositVal > 0 && unpaidVal >= depositVal) return 'weak';
  if (f.unitCondition === 'damage' && depositVal > 0 && damageVal >= depositVal) return 'weak';

  const moderate =
    f.itemizationProvided === 'yes_disputed' ||
    f.unitCondition === 'minor' ||
    f.unitCondition === 'damage' ||
    f.unpaidRent === 'yes' ||
    f.properNotice === 'no' ||
    f.conditionDocumentation === 'no';
  if (moderate) return 'moderate';

  return 'strong';
}

// --- Prompt assembly (unchanged from the original route) --------------------
function buildUserMessage(data: FormData): string {
  const computed = computeDates(data.vacatedDate, data.forwardingAddressDate);

  let message = `Generate a security deposit demand letter for the following situation:

LOCATION:
- State: ${data.state}
- City: ${data.city}`;

  if (data.isRentStabilized) {
    message += `\n- Rent-stabilized status: ${data.isRentStabilized}`;
  }
  if (data.leaseStartDate) {
    message += `\n- Lease/renewal start date: ${data.leaseStartDate}`;
  }
  if (data.buildingUnitCount) {
    message += `\n- Number of rental units in the building: ${data.buildingUnitCount}`;
  }

  message += `

TENANT:
- Name: ${data.tenantName}
- Current address: ${data.tenantAddress || 'not provided'}

LANDLORD:
- Name: ${data.landlordName}
- Address: ${data.landlordAddress || 'not provided'}

RENTAL PROPERTY:
- Address: ${data.rentalPropertyAddress}
- Security deposit amount: ${data.depositAmount ? '$' + data.depositAmount : 'not provided'}
- Date tenant vacated: ${computed.vacatedDateFormatted || 'not provided'}`;

  if (data.forwardingAddressDate) {
    message += `\n- Date tenant provided forwarding address: ${computed.forwardingAddressDateFormatted}`;
  }
  if (data.gaveWrittenNotice) {
    message += `\n- Tenant gave proper written notice of termination: ${data.gaveWrittenNotice}`;
  }
  if (data.leaseType) {
    message += `\n- Lease type: ${data.leaseType}`;
  }

  message += `\n\nDISPUTE TYPE: Security Deposit`;

  if (data.subtypes && data.subtypes.length > 0) {
    message += `\n\nSUB-TYPES SELECTED: ${data.subtypes.join(', ')}`;
  }

  if (data.specialCircumstances && data.specialCircumstances.length > 0) {
    message += `\n\nSPECIAL CIRCUMSTANCES: ${data.specialCircumstances.join(', ')}`;
  }

  if (data.leaseDesignation) {
    message += `\n\nlease_designation (non-refundable fee designation): ${data.leaseDesignation}`;
  }

  message += `

TENANT'S DESCRIPTION OF WHAT HAPPENED:
${data.situation}

${renderComputedDatesBlock(computed)}

Generate the complete demand letter following all the rules in the system prompt. Use the pre-calculated dates above for every date in the letter. Output only the letter itself.`;

  return message;
}

async function callAnthropic(apiKey: string, userMessage: string): Promise<string | null> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-8',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Anthropic API error:', response.status, errorData);
    return null;
  }

  const data = await response.json();
  return data.content?.[0]?.text ?? null;
}

// --- Receipt email (idempotent, best-effort) --------------------------------
async function sendReceiptIfNeeded(
  sessionId: string,
  formData: FormData,
  session: Stripe.Checkout.Session,
  letterText: string,
  refNumber: string,
): Promise<void> {
  try {
    const emailSentKey = `email_sent:${sessionId}`;
    const alreadySent = await redis.get(emailSentKey);
    if (alreadySent) return;

    const recipient =
      (formData.email && formData.email.trim()) ||
      session.customer_details?.email ||
      '';
    if (!recipient) return;

    const sent = await sendLetterEmail({
      to: recipient,
      tenantName: formData.tenantName,
      letterText,
      refNumber,
    });
    if (sent) {
      await redis.set(emailSentKey, '1', { ex: LETTER_TTL_SECONDS });
    }
  } catch (e) {
    console.error('Receipt email step failed (non-fatal):', e);
  }
}

// --- Order persistence (idempotent, best-effort) ----------------------------
async function persistOrderIfNeeded(
  formData: FormData,
  session: Stripe.Checkout.Session,
  letterText: string,
  refNumber: string,
): Promise<void> {
  try {
    const depositVal = parseMoney(formData.depositAmount);
    await saveOrder({
      refNumber,
      stripeSessionId: session.id,
      email:
        (formData.email && formData.email.trim()) ||
        session.customer_details?.email ||
        '',
      tenantName: formData.tenantName,
      state: formData.state,
      city: formData.city,
      depositAmount: depositVal,
      vacatedDate: formData.vacatedDate,
      formPayload: formData as unknown as Record<string, unknown>,
      letterText,
      caseStrength: deriveCaseStrength(formData),
      // Project D: actual amount paid, in cents, straight off the verified-paid
      // Checkout Session. Null only in exotic cases (e.g. 100%-off promo codes
      // may report 0, which is stored as 0, not null); metrics fall back to the
      // flat $39 for rows persisted before this column existed.
      amountPaidCents: session.amount_total ?? undefined,
    });
  } catch (e) {
    // saveOrder already swallows/loggs internally and returns null, but guard
    // here too so persistence can never break delivery of the paid product.
    console.error('Order persistence step failed (non-fatal):', e);
  }
}

/**
 * Runs the full generation pipeline for an already-PAID session.
 *
 * Caller contract: `session` must be a Stripe Checkout Session whose payment is
 * confirmed. This function does not re-verify payment.
 *
 * Behaviour:
 *  - returns the cached letter if one already exists for this session (the
 *    refNumber is recovered from session.metadata so the success page can still
 *    display it on a reload);
 *  - otherwise loads the form payload from Redis, calls Anthropic, classifies
 *    the response, and on success caches the letter, persists the order, and
 *    fires the receipt email (the last two are idempotent + best-effort);
 *  - the refNumber comes from session.metadata.refNumber (written at checkout).
 *    If it is somehow absent — e.g. a session created before this deploy — a new
 *    one is generated so downstream never sees an empty reference.
 */
export async function generateLetterForSession(
  session: Stripe.Checkout.Session,
  apiKey: string,
): Promise<GenerateResult> {
  const sessionId = session.id;
  const refNumber = session.metadata?.refNumber || generateRefNumber();

  // Retry-safe: return the cached letter without regenerating or re-charging.
  const cached = await redis.get<string>(letterKey(sessionId));
  if (cached) {
    return { kind: 'letter', letter: cached, refNumber, cached: true };
  }

  const formId = session.metadata?.formId;
  if (!formId) {
    console.error('No formId in session metadata:', sessionId);
    return {
      kind: 'error',
      status: 404,
      message:
        'We could not find your form data for this session. Please contact support with your payment confirmation.',
    };
  }

  const stored = await redis.get<string | Record<string, unknown>>(formKey(formId));
  if (!stored) {
    return {
      kind: 'error',
      status: 404,
      message:
        'Your form data has expired or could not be found. Please contact support with your payment confirmation.',
    };
  }

  const formData: FormData =
    typeof stored === 'string' ? JSON.parse(stored) : (stored as unknown as FormData);

  const userMessage = buildUserMessage(formData);
  const letterText = await callAnthropic(apiKey, userMessage);

  if (!letterText) {
    return { kind: 'error', status: 500, message: 'Failed to generate letter. Please try again.' };
  }

  // Classify structured non-letter signals (strip BOM / leading whitespace /
  // a leading markdown code fence before matching).
  const normalizedSignal = letterText
    .replace(/^\uFEFF/, '')
    .replace(/^\s+/, '')
    .replace(/^```[a-zA-Z]*\s*/, '')
    .toUpperCase();

  if (
    normalizedSignal.startsWith('MISSING_INFORMATION') ||
    normalizedSignal.startsWith('SCOPE_LIMITATION')
  ) {
    const isMissing = normalizedSignal.startsWith('MISSING_INFORMATION');
    const cleanMessage = letterText.replace(/```/g, '').trim();
    return {
      kind: isMissing ? 'missing_info' : 'out_of_scope',
      message: cleanMessage,
    };
  }

  // Cache the successful letter against the paid session for retry-safety.
  await redis.set(letterKey(sessionId), letterText, { ex: LETTER_TTL_SECONDS });

  // Persist + email. Both idempotent and best-effort — neither can break
  // delivery of the on-screen letter. Persist before email so the order exists
  // even if email send is slow.
  await persistOrderIfNeeded(formData, session, letterText, refNumber);
  await sendReceiptIfNeeded(sessionId, formData, session, letterText, refNumber);

  return { kind: 'letter', letter: letterText, refNumber, cached: false };
}
