// app/api/admin/letter-text/route.ts  — SERVER (Project D, W1 fix)
//
// Returns the CURRENT letter text for an order, fetched fresh from the
// database at request time. Exists so the admin "Download PDF" button can
// fetch letter text at click time instead of using the text baked into the
// page at render time — closing W1 (a download clicked after regeneration
// but before a page refresh served the OLD letter via the stale RSC payload
// in the Next.js client router cache).
//
// Auth: same identity check as requireAdmin() (verified getUser() +
// isAdminEmail), but implemented inline because requireAdmin() redirect()s
// on failure — correct for pages, wrong for a JSON endpoint (a client fetch
// would receive the homepage HTML with a 200). Here non-admins get 401 JSON.
//
// Data access goes through lib/db.ts (service-role) exactly like the pages.
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../lib/supabaseServer';
import { isAdminEmail } from '../../../../lib/adminEmail';
import { getOrderByRef } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !isAdminEmail(data.user?.email ?? null)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ref = request.nextUrl.searchParams.get('ref')?.trim();
  if (!ref) {
    return NextResponse.json({ error: 'Missing ref' }, { status: 400 });
  }

  const order = await getOrderByRef(ref);
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json(
    { letterText: order.letterText },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
