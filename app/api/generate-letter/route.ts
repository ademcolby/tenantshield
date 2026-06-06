import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { SYSTEM_PROMPT } from '../../../lib/systemPrompt';
import { redis, formKey, letterKey, LETTER_TTL_SECONDS } from '../../../lib/redis';
import { computeDates, renderComputedDatesBlock } from '../../../lib/dates';

export const maxDuration = 60;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface FormData {
  state: string;
  city: string;
  tenantName: string;
  tenantAddress: string;
  landlordName: string;
  landlordAddress: string;
  rentalPropertyAddress: string;
  depositAmount: string;
  vacatedDate: string;
  forwardingAddressDate: string; // P10: was previously dropped before reaching the model
  situation: string;
  subtypes: string[];
  specialCircumstances: string[];
  leaseDesignation: string;
  isRentStabilized: string;
  buildingUnitCount: string;      // P5: scope thresholds (IL 5+, AR 6+, NY 6+, Cook County ≤6)
  gaveWrittenNotice: string;      // P4: Alaska 14-vs-30-day branch
  leaseType: string;              // P4: Maine 21-vs-30-day (tenancy-at-will vs written lease)
}

// Format the form data into a clear user message for Claude.
function buildUserMessage(data: FormData): string {
  // P1: all dates are pre-computed by the app and injected; the model never
  // does calendar arithmetic.
  const computed = computeDates(data.vacatedDate, data.forwardingAddressDate);

  let message = `Generate a security deposit demand letter for the following situation:

LOCATION:
- State: ${data.state}
- City: ${data.city}`;

  if (data.isRentStabilized) {
    message += `\n- Rent-stabilized status: ${data.isRentStabilized}`;
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
    // Pass both names so it matches the prompt regardless of casing convention.
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
      // P13: upgraded from Sonnet 4.5 to Opus 4.8 for maximum instruction-
      // following reliability on statute-cited legal output. The letter is a
      // one-shot, post-payment generation, so the extra latency is irrelevant,
      // and the cost delta (~2 cents/letter) is immaterial at $39/letter.
      model: 'claude-opus-4-8',
      max_tokens: 4000, // P12: raised from 2000 to avoid truncating complex multi-overlay letters
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const sessionId: string | undefined = body?.sessionId;

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session id.' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not set');
      return NextResponse.json(
        { error: 'Server configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    // P8: verify the payment with Stripe before doing anything that costs money.
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch {
      return NextResponse.json({ error: 'Invalid session.' }, { status: 400 });
    }

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not confirmed for this session.' },
        { status: 402 }
      );
    }

    // P9: if we've already generated a letter for this paid session, return the
    // cached copy instead of regenerating (retry-safe, and avoids a second
    // Anthropic charge if the user reloads the success page).
    const cached = await redis.get<string>(letterKey(sessionId));
    if (cached) {
      return NextResponse.json({
        type: 'letter',
        letter: cached,
        generatedAt: new Date().toISOString(),
        cached: true,
      });
    }

    const formId = session.metadata?.formId;
    if (!formId) {
      console.error('No formId in session metadata:', sessionId);
      return NextResponse.json(
        { error: 'We could not find your form data for this session. Please contact support with your payment confirmation.' },
        { status: 404 }
      );
    }

    const stored = await redis.get<string | Record<string, unknown>>(formKey(formId));
    if (!stored) {
      return NextResponse.json(
        { error: 'Your form data has expired or could not be found. Please contact support with your payment confirmation.' },
        { status: 404 }
      );
    }

    // Upstash may return a parsed object or a JSON string depending on how it
    // was stored/serialized; handle both.
    const formData: FormData =
      typeof stored === 'string' ? JSON.parse(stored) : (stored as unknown as FormData);

    const userMessage = buildUserMessage(formData);
    const letterText = await callAnthropic(apiKey, userMessage);

    if (!letterText) {
      return NextResponse.json(
        { error: 'Failed to generate letter. Please try again.' },
        { status: 500 }
      );
    }

    // Structured non-letter responses pass through without being cached as a
    // letter (so the user can fix inputs and retry).
    //
    // S10 FIX: the model occasionally wraps these signals in a markdown code
    // fence (```), which used to defeat a bare startsWith() check and let the
    // notice fall through, get cached, and render as a downloadable letter/PDF.
    // We now strip a leading BOM/whitespace and any opening code fence, and
    // match case-insensitively, before classifying.
    const normalizedSignal = letterText
      .replace(/^\uFEFF/, '')        // strip BOM if present
      .replace(/^\s+/, '')           // leading whitespace/newlines
      .replace(/^```[a-zA-Z]*\s*/, '') // a leading ```fence (optionally ```text)
      .toUpperCase();

    if (
      normalizedSignal.startsWith('MISSING_INFORMATION') ||
      normalizedSignal.startsWith('SCOPE_LIMITATION')
    ) {
      const isMissing = normalizedSignal.startsWith('MISSING_INFORMATION');
      // Surface a clean message to the user with any stray code fences removed.
      const cleanMessage = letterText.replace(/```/g, '').trim();
      return NextResponse.json({
        type: isMissing ? 'missing_info' : 'out_of_scope',
        message: cleanMessage,
      });
    }

    // Cache the successful letter against the paid session for retry-safety.
    await redis.set(letterKey(sessionId), letterText, { ex: LETTER_TTL_SECONDS });

    return NextResponse.json({
      type: 'letter',
      letter: letterText,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating letter:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
