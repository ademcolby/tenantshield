import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { randomUUID } from 'crypto';
import { redis, formKey, FORM_TTL_SECONDS } from '../../../lib/redis';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

    // Persist the payload server-side under a one-time id with a TTL.
    const formId = randomUUID();
    await redis.set(formKey(formId), JSON.stringify(payload), {
      ex: FORM_TTL_SECONDS,
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
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
      // formId travels with the session; it's a UUID, well within Stripe's
      // metadata size limits. The actual payload stays in Redis.
      metadata: { formId },
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
