// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { generateLetterForSession } from '../../../../lib/generateLetterCore';

// The webhook may need the full generation window if it is the path that
// actually produces the letter (customer closed the tab before /success loaded).
export const maxDuration = 60;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Stripe webhook — closes the "tab-close gap".
 *
 * The success page normally drives generation, but if the customer closes the
 * browser immediately after paying, that page never runs. Stripe still delivers
 * a signed `checkout.session.completed` event here, server-side, so we can
 * generate the letter, persist the order, and email the receipt independently
 * of the browser. Everything downstream is idempotent (letter cache + DB unique
 * constraint on stripe_session_id + email_sent flag), so if BOTH the success
 * page and this webhook fire for the same payment, the work happens exactly
 * once and the second caller returns the cached result.
 *
 * Signature verification uses STRIPE_WEBHOOK_SECRET and the RAW request body —
 * App Router gives us the raw bytes via request.text(). We must NOT parse JSON
 * first, or the signature check will fail.
 */
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header.' }, { status: 400 });
  }

  // Raw body (string) — required for signature verification.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  // We only act on completed checkouts. Acknowledge anything else with 200 so
  // Stripe doesn't retry events we intentionally ignore.
  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // Only fully-paid sessions should generate. (For card checkouts this is paid
  // at completion; the guard keeps async/delayed methods from generating early.)
  if (session.payment_status !== 'paid') {
    return NextResponse.json({ received: true });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set');
    // 500 so Stripe retries — this is a transient server-config problem, not a
    // bad event.
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    const result = await generateLetterForSession(session, apiKey);

    // For 'missing_info' / 'out_of_scope' / 'error' we still return 200: the
    // customer will see the same notice on the success page and can retry there,
    // and retrying the webhook wouldn't change a content/data outcome. We log so
    // these are visible in monitoring.
    if (result.kind === 'error') {
      console.error('Webhook generation error:', result.status, result.message);
    } else if (result.kind === 'missing_info' || result.kind === 'out_of_scope') {
      console.warn('Webhook generation produced a non-letter signal:', result.kind);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook generation threw (will let Stripe retry):', err);
    // 500 → Stripe retries with backoff. Idempotency guards make a retry safe.
    return NextResponse.json({ error: 'Generation failed.' }, { status: 500 });
  }
}
