// app/api/cron/keep-alive/route.ts  — SERVER (Oct 31 2026)
//
// Daily keep-alive for the Supabase project after the Pro → Free downgrade.
// Free projects pause after 7 days without a database request; this route is
// hit once a day by the Vercel cron in vercel.json and runs one tiny read via
// lib/db.ts pingDatabase(), so the project never goes idle.
//
// Auth: Vercel sends `Authorization: Bearer <CRON_SECRET>` on cron calls when
// the CRON_SECRET env var is set. Anything without it gets 401, so the public
// can't use this URL to poke the database.
//
// ⚠️ DO NOT DELETE this route or the vercel.json cron while Supabase is on the
// Free plan. If either goes away, the project pauses within a week and the
// next order/sign-in fails until it is restored by hand in the dashboard.
import { NextRequest, NextResponse } from 'next/server';
import { pingDatabase } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ok = await pingDatabase();
  if (!ok) {
    // Non-200 makes the failure visible in Vercel's cron/function logs.
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
