// app/api/generate-letter/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { generateLetterForSession } from '../../../lib/generateLetterCore';

export const maxDuration = 60;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Browser-driven generation, called by the success page with the paid Stripe
 * session id. This route's job is narrow:
 *   1. validate input,
 *   2. verify the payment with Stripe (P8),
 *   3. hand the verified session to the shared core (lib/generateLetterCore),
 *      which does prompt assembly, the Anthropic call, classification, caching,
 *      order persistence, and the receipt email.
 *
 * The same core is invoked by the Stripe webhook (Project C), so a customer who
 * closes the tab before this page loads still gets their letter, order record,
 * and email — generated server-side from the webhook instead.
 */
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

    const result = await generateLetterForSession(session, apiKey);

    switch (result.kind) {
      case 'letter':
        return NextResponse.json({
          type: 'letter',
          letter: result.letter,
          refNumber: result.refNumber,
          generatedAt: new Date().toISOString(),
          cached: result.cached,
        });
      case 'missing_info':
        return NextResponse.json({ type: 'missing_info', message: result.message });
      case 'out_of_scope':
        return NextResponse.json({ type: 'out_of_scope', message: result.message });
      case 'error':
        return NextResponse.json({ error: result.message }, { status: result.status });
    }
  } catch (error) {
    console.error('Error generating letter:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
