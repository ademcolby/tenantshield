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
import { computeDates, renderComputedDatesBlock, formatLongDate } from './dates';
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
  specialCircumstances: string[];
  leaseDesignation: string;
  isRentStabilized: string;
  leaseStartDate: string;
  buildingUnitCount: string;
  gaveWrittenNotice: string;
  leaseType: string;
  // ---- Project I: authoritative scenario + dispute grounds ----
  // Exactly one scenario (single-select in the form); disputes are the
  // multi-select "why the deductions are wrong / procedural violations" axis.
  scenario?: string;
  disputes?: string[];
  // Present (and required by the form) for partial-return scenarios.
  amountReturned?: string;
  // Optional: the date the deposit was originally paid.
  depositPaidDate?: string;
  // ---- Case facts (Project I: required in the form; also drive case_strength) ----
  unitCondition?: string;        // 'good' | 'minor' | 'damage'
  damageEstimate?: string;       // required by the form when unitCondition === 'damage'
  unpaidRent?: string;           // 'no' | 'yes'
  unpaidRentAmount?: string;     // required by the form when unpaidRent === 'yes'
  properNotice?: string;         // 'yes' | 'not_required' | 'no'
  noticeGiven?: string;          // 'partial' | 'none' (required when properNotice === 'no')
  conditionDocumentation?: string; // 'yes' | 'partial' | 'no'
  // ---- LEGACY fields (pre-overhaul orders; admin regeneration only) ----
  subtypes?: string[];
  itemizationProvided?: string;
}

// The shape returned to callers. Mirrors what the routes hand back as JSON.
export type GenerateResult =
  | { kind: 'letter'; letter: string; refNumber: string; cached: boolean; email: string }
  | { kind: 'missing_info'; message: string }
  | { kind: 'out_of_scope'; message: string }
  | { kind: 'error'; status: number; message: string };

// Project D v2 — result shape for admin-triggered regeneration (no session,
// no caching, no persistence side effects; the caller decides what to do).
export type RegenerateResult =
  | { kind: 'letter'; letter: string }
  | { kind: 'missing_info'; message: string }
  | { kind: 'out_of_scope'; message: string }
  | { kind: 'error'; message: string };

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

// Scenarios in which the landlord provided an itemized list the tenant
// disputes — the successor to the old itemizationProvided === 'yes_disputed'
// moderate trigger (the itemization question was absorbed into the scenario).
const ITEMIZED_DISPUTE_SCENARIOS = ['full_withholding_itemized', 'partial_return_itemized'];

function deriveCaseStrength(f: FormData): string | undefined {
  // Legacy payloads (pre-overhaul) carry itemizationProvided instead of a
  // scenario. The old tier logic is preserved for them so a re-persisted or
  // late-completing old order classifies exactly as it would have.
  const isLegacy = !f.scenario && !!f.itemizationProvided;

  const answered =
    (isLegacy ? f.itemizationProvided : f.scenario) &&
    f.unitCondition &&
    f.unpaidRent &&
    f.properNotice &&
    f.conditionDocumentation;
  if (!answered) return undefined;

  const depositVal = parseMoney(f.depositAmount);
  const unpaidVal = parseMoney(f.unpaidRentAmount);
  const damageVal = parseMoney(f.damageEstimate);

  // Weak: offsets meet or exceed the deposit, or the tenant abandoned.
  // (The form now blocks combined-offsets >= deposit before payment; these
  // remain as classification for anything that reaches persistence anyway.)
  if (f.noticeGiven === 'none') return 'weak';
  if (f.unpaidRent === 'yes' && depositVal > 0 && unpaidVal >= depositVal) return 'weak';
  if (f.unitCondition === 'damage' && depositVal > 0 && damageVal >= depositVal) return 'weak';

  const itemizedDispute = isLegacy
    ? f.itemizationProvided === 'yes_disputed'
    : ITEMIZED_DISPUTE_SCENARIOS.includes(f.scenario || '');

  const moderate =
    itemizedDispute ||
    f.unitCondition === 'minor' ||
    f.unitCondition === 'damage' ||
    f.unpaidRent === 'yes' ||
    f.properNotice === 'no' ||
    f.conditionDocumentation === 'no';
  if (moderate) return 'moderate';

  return 'strong';
}

// --- Prompt assembly (Project I: scenario + case facts injection) -----------

// Human-readable labels sent alongside the scenario id so the model never has
// to guess what an id means. Must stay in sync with the form's SCENARIOS list.
const SCENARIO_LABELS: Record<string, string> = {
  no_response:
    'The landlord has returned nothing and made no claim at all (total silence past the deadline)',
  full_withholding_no_itemization:
    'The landlord kept the entire deposit with only a vague reason or no written itemization',
  full_withholding_itemized:
    'The landlord kept the entire deposit with an itemized list the tenant disputes',
  partial_return_no_itemization:
    'The landlord returned part of the deposit with no written breakdown of what was kept or why',
  partial_return_itemized:
    'The landlord returned part of the deposit with an itemized list the tenant disputes',
  deposit_applied_to_rent:
    'The landlord applied the deposit to the final month\u2019s rent without the tenant\u2019s agreement',
};

// Parse a yyyy-mm-dd input to a UTC date for formatting (mirrors dates.ts's
// internal parser; kept tiny and local since dates.ts doesn't export it).
function parseYmdUTC(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((value || '').trim());
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

function caseFactLines(data: FormData): string[] {
  const lines: string[] = [];

  if (data.unitCondition) {
    const map: Record<string, string> = {
      good: 'Tenant left the unit in good condition (normal wear and tear only)',
      minor: 'Tenant left the unit with minor issues, nothing major',
      damage: 'Tenant admits some damage occurred',
    };
    lines.push(`- Condition at move-out: ${map[data.unitCondition] || data.unitCondition}`);
    if (data.unitCondition === 'damage' && data.damageEstimate) {
      lines.push(`- Tenant's estimated repair cost for the admitted damage: $${data.damageEstimate}`);
    }
  }

  if (data.unpaidRent === 'no') {
    lines.push('- Unpaid rent or fees owed to the landlord: none');
  } else if (data.unpaidRent === 'yes') {
    lines.push(
      `- Unpaid rent or fees the tenant admits owing: ${
        data.unpaidRentAmount ? '$' + data.unpaidRentAmount : 'yes (amount not stated)'
      }`,
    );
  }

  if (data.properNotice === 'yes') {
    lines.push('- Move-out notice: tenant gave proper written notice per the lease');
  } else if (data.properNotice === 'not_required') {
    lines.push('- Move-out notice: the lease did not require notice');
  } else if (data.properNotice === 'no') {
    lines.push(
      data.noticeGiven === 'partial'
        ? '- Move-out notice: tenant gave some notice, but less than the lease required'
        : data.noticeGiven === 'none'
        ? '- Move-out notice: tenant moved out without giving any notice'
        : '- Move-out notice: tenant did not give the required notice',
    );
  }

  if (data.conditionDocumentation) {
    const map: Record<string, string> = {
      yes: 'Tenant has photos and/or a checklist documenting the unit\u2019s condition',
      partial: 'Tenant has some (partial) documentation of the unit\u2019s condition',
      no: 'Tenant has no documentation of the unit\u2019s condition',
    };
    lines.push(`- Condition documentation: ${map[data.conditionDocumentation] || data.conditionDocumentation}`);
  }

  return lines;
}

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

  // Optional: the date the deposit was originally paid (Project I). Formatted
  // through the same UTC-safe formatter as every other date in the letter.
  if (data.depositPaidDate) {
    const paid = parseYmdUTC(data.depositPaidDate);
    if (paid) {
      message += `\n- Date deposit paid: ${formatLongDate(paid)}`;
    }
  }

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

  // --- Authoritative scenario (Project I) — exactly one; controls the letter type.
  if (data.scenario) {
    const label = SCENARIO_LABELS[data.scenario] || data.scenario;
    message += `\n\nWHAT THE LANDLORD DID (authoritative scenario \u2014 controls the letter type; if the description below conflicts, THIS wins):\n- ${data.scenario} \u2014 ${label}`;
    if (
      (data.scenario === 'partial_return_no_itemization' ||
        data.scenario === 'partial_return_itemized') &&
      data.amountReturned
    ) {
      message += `\n- Amount returned so far: $${data.amountReturned} (the withheld portion is the deposit minus this figure \u2014 demand that withheld portion)`;
    }
  } else if (data.subtypes && data.subtypes.length > 0) {
    // LEGACY (pre-overhaul orders regenerated from admin): old multi-select ids.
    message += `\n\nSUB-TYPES SELECTED: ${data.subtypes.join(', ')}`;
  }

  // --- Disputed deduction grounds + landlord procedural violations (Project I).
  if (data.disputes && data.disputes.length > 0) {
    message += `\n\nDISPUTED DEDUCTION GROUNDS (confirmed facts \u2014 weave each matching argument in): ${data.disputes.join(', ')}`;
  }

  if (data.specialCircumstances && data.specialCircumstances.length > 0) {
    message += `\n\nSPECIAL CIRCUMSTANCES: ${data.specialCircumstances.join(', ')}`;
  }

  if (data.leaseDesignation) {
    message += `\n\nlease_designation (non-refundable fee designation): ${data.leaseDesignation}`;
  }

  // --- Case facts (Project I) — authoritative; drive tone calibration.
  const facts = caseFactLines(data);
  if (facts.length > 0) {
    message += `\n\nTENANT'S CASE FACTS (authoritative \u2014 the tenant's own answers; calibrate the letter to these per the CASE FACTS AND TONE CALIBRATION rules; if the description below conflicts, THESE win):\n${facts.join('\n')}`;
  }

  // --- Free-text description (Project I: optional, supporting detail only).
  const situation = (data.situation || '').trim();
  if (situation) {
    message += `

ADDITIONAL CONTEXT FROM TENANT (supporting detail ONLY \u2014 use for specifics, names, dates, and TIER-2 circumstance detection; it can ADD arguments but NEVER overrides the scenario, case facts, or any structured field above):
${situation}`;
  } else {
    message += `

ADDITIONAL CONTEXT FROM TENANT: none provided. The structured inputs above are the complete factual record \u2014 do NOT treat the absence of a description as missing information.`;
  }

  message += `

${renderComputedDatesBlock(computed)}

Generate the complete demand letter following all the rules in the system prompt. Use the pre-calculated dates above for every date in the letter. Output only the letter itself.`;

  return message;
}

// Classifies structured non-letter signals from the model (strips BOM /
// leading whitespace / a leading markdown code fence before matching).
// Returns null when the output is an actual letter. Shared by the paid
// pipeline and the admin regeneration path so the rules can't drift.
function classifyModelOutput(
  letterText: string,
): { kind: 'missing_info' | 'out_of_scope'; message: string } | null {
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
  return null;
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
    // formData isn't loaded on the cached path (this returns before the Redis
    // form lookup), so fall back to the email Stripe captured at checkout. It's
    // the same address the form collected — it's passed to Stripe as
    // customer_email when the Checkout Session is created.
    return {
      kind: 'letter',
      letter: cached,
      refNumber,
      cached: true,
      email: session.customer_details?.email || '',
    };
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

  // Classify structured non-letter signals via the shared helper.
  const signal = classifyModelOutput(letterText);
  if (signal) {
    return signal;
  }

  // Cache the successful letter against the paid session for retry-safety.
  await redis.set(letterKey(sessionId), letterText, { ex: LETTER_TTL_SECONDS });

  // Persist + email. Both idempotent and best-effort — neither can break
  // delivery of the on-screen letter. Persist before email so the order exists
  // even if email send is slow.
  await persistOrderIfNeeded(formData, session, letterText, refNumber);
  await sendReceiptIfNeeded(sessionId, formData, session, letterText, refNumber);

  return {
    kind: 'letter',
    letter: letterText,
    refNumber,
    cached: false,
    email:
      (formData.email && formData.email.trim()) ||
      session.customer_details?.email ||
      '',
  };
}

/**
 * Project D v2 — admin-triggered regeneration.
 *
 * Re-runs ONLY the prompt-build + Anthropic call + classification on an
 * order's stored form payload. Deliberately has NONE of the paid-pipeline
 * side effects: no payment check (the order was already paid), no Redis
 * caching, no DB persistence, no receipt email. The admin action that calls
 * this decides whether/how to store the result — and on a non-letter signal
 * (missing_info / out_of_scope / error) it must NOT overwrite anything.
 */
export async function regenerateLetterFromForm(
  formData: FormData,
  apiKey: string,
): Promise<RegenerateResult> {
  const userMessage = buildUserMessage(formData);
  const letterText = await callAnthropic(apiKey, userMessage);

  if (!letterText) {
    return { kind: 'error', message: 'Anthropic call failed — see server logs.' };
  }

  const signal = classifyModelOutput(letterText);
  if (signal) return signal;

  return { kind: 'letter', letter: letterText };
}
