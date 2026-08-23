// app/api/create-checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { randomUUID } from 'crypto';
import { redis, formKey, FORM_TTL_SECONDS } from '../../../lib/redis';
import { generateRefNumber } from '../../../lib/refNumber';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Server-side validation mirror.
 *
 * The intake form (SecurityDepositForm.tsx) enforces these same BLOCK rules
 * client-side for instant, friendly feedback. We re-check them here so a bad
 * payload can NEVER reach Stripe — even if a client bypasses the browser
 * (curl, disabled JS, a replayed/edited request). If anything fails we return
 * 400 and never write to Redis or create a session, which makes the
 * "pay first, fail after" failure mode structurally impossible.
 *
 * Only BLOCK-tier rules live here. Warn-tier checks (low/high deposit, very old
 * move-out, ZIP format, etc.) are client-only by design — they inform the user
 * but never gate checkout, so the server doesn't enforce them.
 *
 * Keep these rules byte-for-byte equivalent to the client's validateForm()
 * BLOCK branches so the two layers can't drift.
 */

const UNIT_COUNT_STATES = ['Illinois', 'Arkansas', 'New York'];
const LEASE_TYPE_STATES = ['Maine'];
// Mirror of ADDRESS_GATE_STATES in SecurityDepositForm.tsx. Threshold
// condition (68 P.S. § 250.512(e)), not a clock input — keep the two in sync.
const ADDRESS_GATE_STATES = ['Pennsylvania'];
const ADDRESS_GATE_VALUES = ['yes', 'no', 'unsure'];
const NOTICE_STATES = ['Alaska'];
const SITUATION_MAX = 4000;

// Project I — the authoritative single-select scenario. Must stay in sync with
// the SCENARIOS list in SecurityDepositForm.tsx.
const SCENARIO_IDS = [
  'no_response',
  'full_withholding_no_itemization',
  'full_withholding_itemized',
  'partial_return_no_itemization',
  'partial_return_itemized',
  'deposit_applied_to_rent',
];
const PARTIAL_SCENARIOS = ['partial_return_no_itemization', 'partial_return_itemized'];

type DepositResult =
  | { ok: true; value: number; reason: '' }
  | { ok: false; value: 0; reason: 'blank' | 'invalid' | 'nonpositive' };

// Strip a leading $ and commas, then require digits with optional cents
// (no letters, no exponent, no symbols, no 3+ decimals) and a value > 0.
function parseDeposit(raw: string): DepositResult {
  const cleaned = (raw || '').replace(/[$,\s]/g, '');
  if (cleaned === '') return { ok: false, value: 0, reason: 'blank' };
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return { ok: false, value: 0, reason: 'invalid' };
  const num = parseFloat(cleaned);
  if (!(num > 0)) return { ok: false, value: 0, reason: 'nonpositive' };
  return { ok: true, value: num, reason: '' };
}

// Lenient money parse for the case-fact amounts — mirrors the client's
// parseMoney byte-for-byte (returns 0 when unparseable or non-positive).
function parseMoney(raw: string): number {
  const cleaned = (raw || '').replace(/[$,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return 0;
  const n = parseFloat(cleaned);
  return n > 0 ? n : 0;
}

// Parse yyyy-mm-dd into a UTC-midnight Date.
function parseDateOnly(s: string): Date | null {
  if (!s) return null;
  const parts = s.split('-').map(Number);
  if (parts.length !== 3 || parts.some(n => Number.isNaN(n))) return null;
  const [y, m, d] = parts;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt;
}

function validatePayload(p: Record<string, unknown>): { field: string; message: string }[] {
  const errs: { field: string; message: string }[] = [];
  const str = (v: unknown) => (typeof v === 'string' ? v : '');
  const state = str(p.state);

  // --- Presence (BLOCK) ---
  if (!state) errs.push({ field: 'state', message: 'State is required.' });
  if (!str(p.city)) errs.push({ field: 'city', message: 'City is required.' });

  // --- C0 (correction batch, July 2026): Evanston, IL coverage block (BLOCK) ---
  // Evanston's city overlay is unverified, so the client blocks the letter
  // path pre-payment with a "we don't cover this city yet" screen. Re-checked
  // here so a bypassed client can never create a checkout session for an
  // Evanston letter. Keep this predicate byte-for-byte equivalent to the
  // client's isUncoveredCity() (state-gated on Illinois; normalized so a typed
  // "evanston" via the Other-city write-in is caught too).
  if (state === 'Illinois' && str(p.city).trim().toLowerCase() === 'evanston') {
    errs.push({
      field: 'city',
      message:
        'We don\u2019t cover Evanston yet \u2014 Evanston has its own security deposit ordinance and our verification of it isn\u2019t complete. No charge has been made.',
    });
  }
  if (!str(p.tenantName)) errs.push({ field: 'tenantName', message: 'Your name is required.' });

  // --- Email required + valid format (BLOCK) — mirrors the client EMAIL_RE
  // rule byte-for-byte. This is the address we email the finished letter to. ---
  const email = str(p.email).trim();
  if (!email) {
    errs.push({ field: 'email', message: 'Your email address is required — we send your letter here.' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errs.push({ field: 'email', message: 'Enter a valid email address (for example, you@example.com).' });
  }

  if (!str(p.landlordName)) errs.push({ field: 'landlordName', message: 'Landlord name is required.' });
  // Mandatory yes/no — mirrors the client. Drives successor-owner handling.
  if (!['yes', 'no'].includes(str(p.propertySold))) {
    errs.push({ field: 'propertySold', message: 'Answer whether the property was sold while you lived there.' });
  }
  if (!str(p.rentalPropertyAddress)) {
    errs.push({ field: 'rentalPropertyAddress', message: 'Rental property address is required.' });
  }
  // Tenant mailing address is the return address the letter demands payment to.
  // (The client requires street+city+state+zip; here we backstop a usable,
  // non-empty composed address.)
  if (!str(p.tenantAddress)) {
    errs.push({ field: 'tenantAddress', message: 'Your mailing address is required.' });
  }
  if (!str(p.vacatedDate)) {
    errs.push({ field: 'vacatedDate', message: 'Move-out date is required.' });
  }

  // --- Deposit must resolve to a clean positive dollar value (BLOCK) ---
  const dep = parseDeposit(str(p.depositAmount));
  if (!dep.ok) {
    errs.push({
      field: 'depositAmount',
      message:
        dep.reason === 'blank'
          ? 'Security deposit amount is required.'
          : dep.reason === 'nonpositive'
          ? 'The deposit must be greater than $0.'
          : 'The deposit must be a valid dollar amount.',
    });
  }

  // --- Move-out date cannot be in the future (BLOCK) ---
  // 1-day cushion so a legitimate same-day move-out is never rejected by a
  // server(UTC)-vs-user(local) timezone difference; still blocks real future
  // dates (e.g., a move-out months ahead).
  const vac = parseDateOnly(str(p.vacatedDate));
  if (vac) {
    const cutoff = new Date();
    cutoff.setUTCHours(0, 0, 0, 0);
    cutoff.setUTCDate(cutoff.getUTCDate() + 1); // today + 1 day, UTC
    if (vac.getTime() > cutoff.getTime()) {
      errs.push({ field: 'vacatedDate', message: 'The move-out date cannot be in the future.' });
    }
  }

  // --- Conditional drivers required when applicable (BLOCK) ---
  if (LEASE_TYPE_STATES.includes(state) && !str(p.leaseType)) {
    errs.push({ field: 'leaseType', message: 'Tenancy type is required for this state.' });
  }
  if (NOTICE_STATES.includes(state) && !str(p.gaveWrittenNotice)) {
    errs.push({ field: 'gaveWrittenNotice', message: 'Written-notice answer is required for this state.' });
  }
  // ADDRESS GATE (PA): an unanswered or forged value would let the letter
  // assert § 250.512 remedies that may already be extinguished.
  if (ADDRESS_GATE_STATES.includes(state)) {
    const gate = str(p.forwardingAddressGiven);
    if (!gate || !ADDRESS_GATE_VALUES.includes(gate)) {
      errs.push({
        field: 'forwardingAddressGiven',
        message: 'Written forwarding-address answer is required for this state.',
      });
    }
  }

  // --- Unit-count sanity when shown (BLOCK only if a bad value was supplied;
  // blank or "unknown" is allowed and handled conditionally by the letter) ---
  const unit = str(p.buildingUnitCount);
  if (UNIT_COUNT_STATES.includes(state) && unit !== '' && unit !== 'unknown') {
    if (!/^\d+$/.test(unit) || parseInt(unit, 10) < 1) {
      errs.push({ field: 'buildingUnitCount', message: 'Unit count must be a whole number of 1 or more.' });
    }
  }

  // --- Situation length bound (BLOCK) — Project I: the description is now
  // OPTIONAL supporting detail (the structured scenario + case facts are the
  // authoritative record), so there is no minimum; only the ceiling remains. ---
  const situation = str(p.situation);
  if (situation.length > SITUATION_MAX) {
    errs.push({ field: 'situation', message: `Description must be ${SITUATION_MAX} characters or fewer.` });
  }

  // --- Project I: authoritative scenario (BLOCK) ---
  const scenario = str(p.scenario);
  if (!scenario || !SCENARIO_IDS.includes(scenario)) {
    errs.push({ field: 'scenario', message: 'Select what your landlord did with your deposit.' });
  }

  // Partial-return scenarios must state how much came back, and it must be a
  // valid amount strictly below the deposit (otherwise nothing was withheld).
  if (PARTIAL_SCENARIOS.includes(scenario)) {
    const returned = parseMoney(str(p.amountReturned));
    if (returned <= 0) {
      errs.push({ field: 'amountReturned', message: 'Enter how much of the deposit was returned.' });
    } else if (dep.ok && returned >= dep.value) {
      errs.push({
        field: 'amountReturned',
        message: 'The amount returned must be less than the deposit — otherwise nothing was withheld.',
      });
    }
  }

  // --- Project I: case facts (all BLOCK; conditional amounts required) ---
  const unitCondition = str(p.unitCondition);
  if (!['good', 'minor', 'damage'].includes(unitCondition)) {
    errs.push({ field: 'unitCondition', message: 'Select the condition you left the unit in.' });
  }
  const damageVal = parseMoney(str(p.damageEstimate));
  if (unitCondition === 'damage' && damageVal <= 0) {
    errs.push({ field: 'damageEstimate', message: 'Enter your best estimate of the repair cost.' });
  }

  const unpaidRent = str(p.unpaidRent);
  if (!['no', 'yes'].includes(unpaidRent)) {
    errs.push({ field: 'unpaidRent', message: 'Answer whether you owe any unpaid rent or fees.' });
  }
  const unpaidVal = parseMoney(str(p.unpaidRentAmount));
  if (unpaidRent === 'yes' && unpaidVal <= 0) {
    errs.push({ field: 'unpaidRentAmount', message: 'Enter approximately how much you owe.' });
  }

  const properNotice = str(p.properNotice);
  if (!['yes', 'not_required', 'no'].includes(properNotice)) {
    errs.push({ field: 'properNotice', message: 'Answer whether you gave proper written notice.' });
  }
  if (properNotice === 'no' && !['partial', 'none'].includes(str(p.noticeGiven))) {
    errs.push({ field: 'noticeGiven', message: 'Let us know whether you gave any notice at all.' });
  }

  if (!['yes', 'partial', 'no'].includes(str(p.conditionDocumentation))) {
    errs.push({ field: 'conditionDocumentation', message: 'Answer whether you documented the unit\u2019s condition.' });
  }

  // --- Project I: scope block (BLOCK) — the tenant's own admitted offsets
  // (admitted damage + admitted unpaid rent/fees) meet or exceed the deposit.
  // The client shows a soft-redirect screen for this; the server re-checks so
  // a bypassed client can never pay for a letter the pipeline would refuse. ---
  if (dep.ok) {
    const offsets =
      (unitCondition === 'damage' ? damageVal : 0) + (unpaidRent === 'yes' ? unpaidVal : 0);
    if (offsets >= dep.value) {
      errs.push({
        field: 'scope',
        message:
          'Your admitted damage and unpaid rent together meet or exceed your deposit, so a demand letter cannot recover anything. No charge has been made.',
      });
    }
  }

  return errs;
}

/**
 * Creates a Stripe Checkout session.
 *
 * AUDIT FIX (P3/P8/P9): the intake form now POSTs the full form payload here.
 * We persist it server-side in Redis under a one-time formId and embed that
 * formId in the Stripe session metadata. After payment, the success page hands
 * us the session_id; the generate-letter route verifies the payment, reads the
 * formId back out of metadata, and loads the payload from Redis. The form data
 * therefore never depends on browser localStorage surviving the Stripe
 * redirect (which fails in many mobile in-app browsers), and generation only
 * happens for a genuinely paid session.
 *
 * PROJECT C: we also generate the customer-facing reference number here, at
 * checkout, and store it in the session metadata alongside formId. Putting it in
 * metadata means it survives the Redis TTL and is available to BOTH the success
 * page and the Stripe webhook when they persist the order and email the receipt.
 * No DB write happens yet at this point — payment isn't confirmed, so we keep
 * the orders table clean until generation runs post-payment.
 */
export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    // The intake form sends the composed payload as JSON.
    let payload: unknown = null;
    try {
      payload = await request.json();
    } catch {
      payload = null;
    }

    if (!payload || typeof payload !== 'object') {
      return NextResponse.json(
        { error: 'Missing form data.' },
        { status: 400 }
      );
    }

    // Server-side BLOCK validation BEFORE any Redis write or Stripe call.
    // A failure here means no session is created and no charge is possible.
    const fieldErrors = validatePayload(payload as Record<string, unknown>);
    if (fieldErrors.length > 0) {
      return NextResponse.json(
        { error: 'Some details need attention before checkout.', fields: fieldErrors },
        { status: 400 }
      );
    }

    // Persist the payload server-side under a one-time id with a TTL.
    const formId = randomUUID();
    await redis.set(formKey(formId), JSON.stringify(payload), {
      ex: FORM_TTL_SECONDS,
    });

    // Project C: generate the order reference number now and carry it in the
    // session metadata so it survives the Redis TTL and is identical across the
    // success page and the webhook.
    const refNumber = generateRefNumber();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      // Pre-fills Stripe's email field and records the address on
      // session.customer_details.email. Already validated above, so it's a
      // clean, present, well-formed address.
      customer_email: String((payload as Record<string, unknown>).email).trim(),
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Security Deposit Demand Letter',
              description: 'State-specific, professionally written demand letter — TenantShield',
            },
            unit_amount: 3900,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // formId + refNumber travel with the session; both are short strings well
      // within Stripe's metadata size limits. The actual payload stays in Redis.
      metadata: { formId, refNumber },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe session error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
