// app/dashboard/page.tsx  — Project E (SERVER COMPONENT)
//
// Auth-gated order history. Flow:
//   1. Read the *verified* logged-in user from the cookie session.
//   2. Not logged in -> redirect to /auth?next=/dashboard.
//   3. Backfill user_id on any past orders that match this confirmed email
//      (retroactive linking; reserved column from Project C).
//   4. Fetch all orders for the email via the service-role data layer and hand a
//      trimmed, client-safe shape to the interactive child.
//
// Why this is safe: orders are matched on the email Supabase has VERIFIED the
// caller controls (email-confirm is required). The service-role read happens
// server-side only; the browser never gets the service-role key. We still send
// letter_text to the client, but only the rows belonging to the caller's own
// confirmed email — it's their own correspondence, same as the success page.
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '../../lib/supabaseServer';
import { getOrdersByEmail, linkOrdersToUser } from '../../lib/db';
import DashboardClient, { type DashboardOrder } from './DashboardClient';

// Always render per-request (depends on the session cookie).
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect('/auth?next=/dashboard');
  }

  const email = user.email;

  // Retroactively attach any pre-account orders to this user (idempotent;
  // only touches rows where user_id is still null).
  await linkOrdersToUser(email, user.id);

  const orders = await getOrdersByEmail(email);

  // Trim to exactly what the client needs. formPayload is intentionally dropped.
  const clientOrders: DashboardOrder[] = orders.map((o) => ({
    refNumber: o.refNumber,
    state: o.state,
    city: o.city,
    depositAmount: o.depositAmount,
    vacatedDate: o.vacatedDate,
    createdAt: o.createdAt,
    caseStrength: o.caseStrength ?? null,
    letterText: o.letterText,
  }));

  return <DashboardClient email={email} orders={clientOrders} />;
}
