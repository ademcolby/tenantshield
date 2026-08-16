// app/api/funnel-event/route.ts  — SERVER (Project J v2, August 2026)
//
// Receives fire-and-forget funnel events from lib/funnel.ts (sendBeacon /
// keepalive fetch) and records them as daily counters via lib/funnelServer.
//
// CONTRACT: this endpoint ALWAYS answers 204 with an empty body — counted,
// deduped, capped, malformed, or erroring, the response is identical. The
// client never reads it (fire-and-forget), and a prober can't learn anything
// from it. All validation and the write logic live in lib/funnelServer; this
// file only extracts the body + caller IP and hands off.
import { NextRequest } from 'next/server';
import { parseFunnelEvent, recordFunnelEvent } from '../../../lib/funnelServer';

export const dynamic = 'force-dynamic';

function callerIp(req: NextRequest): string {
  // Vercel sets x-forwarded-for; take the first (client) hop. Bound the
  // length so an abusive header can't bloat Redis keys.
  const fwd = req.headers.get('x-forwarded-for') ?? '';
  const first = fwd.split(',')[0]?.trim() ?? '';
  return first.slice(0, 64);
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const raw: unknown = await req.json();
    const input = parseFunnelEvent(raw, callerIp(req));
    if (input) {
      await recordFunnelEvent(input);
    }
  } catch {
    // Malformed JSON, Redis hiccup — identical outcome by design.
  }
  return new Response(null, { status: 204 });
}
