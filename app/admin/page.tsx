// app/admin/page.tsx  — SERVER COMPONENT (Project D)
//
// The admin metrics dashboard. Gated by requireAdmin(); customers and
// signed-out visitors are redirected home before any data is fetched.
//
// All figures exclude test orders (is_test), with the excluded count disclosed
// under the cards. Revenue sums amount_paid_cents from Stripe; rows persisted
// before that column existed are assumed to be the flat $39 and disclosed via
// the "estimated" footnote.
import Link from 'next/link';
import SiteChrome from '../components/SiteChrome';
import { requireAdmin } from '../../lib/adminAuth';
import { getOrderMetrics } from '../../lib/db';

// Cookie-based auth + live order data: never cache this page.
export const dynamic = 'force-dynamic';

function formatUsd(cents: number): string {
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}

function strengthLabel(s: string): string {
  return s === 'not answered' ? 'Not answered' : s.charAt(0).toUpperCase() + s.slice(1);
}

export default async function AdminPage() {
  const adminEmail = await requireAdmin();
  const metrics = await getOrderMetrics();

  return (
    <SiteChrome>
      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1
              className="text-3xl font-semibold tracking-tight text-slate-900"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Admin
            </h1>
            <p className="mt-1 text-sm text-slate-600">Signed in as {adminEmail}</p>
          </div>
          <Link
            href="/admin/orders"
            className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#B45309] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#92400E]"
          >
            View orders →
          </Link>
        </div>

        {!metrics ? (
          <div className="mt-10 rounded-xl border border-[#E7E5E0] bg-white p-6 text-sm text-slate-600">
            Could not load metrics — check server logs (Supabase env vars / connectivity).
          </div>
        ) : (
          <>
            {/* ---------- Letters generated ---------- */}
            <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Letters generated
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-[#E7E5E0] bg-white p-5">
                <div className="text-sm text-slate-600">All time</div>
                <div className="mt-1 text-3xl font-semibold text-slate-900">
                  {metrics.totalAllTime}
                </div>
              </div>
              <div className="rounded-xl border border-[#E7E5E0] bg-white p-5">
                <div className="text-sm text-slate-600">Last 30 days</div>
                <div className="mt-1 text-3xl font-semibold text-slate-900">
                  {metrics.totalLast30Days}
                </div>
              </div>
              <div className="rounded-xl border border-[#E7E5E0] bg-white p-5">
                <div className="text-sm text-slate-600">Last 7 days</div>
                <div className="mt-1 text-3xl font-semibold text-slate-900">
                  {metrics.totalLast7Days}
                </div>
              </div>
            </div>

            {/* ---------- Revenue ---------- */}
            <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Revenue
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-[#E7E5E0] bg-white p-5">
                <div className="text-sm text-slate-600">All time</div>
                <div className="mt-1 text-3xl font-semibold text-slate-900">
                  {formatUsd(metrics.revenueCentsAllTime)}
                </div>
              </div>
              <div className="rounded-xl border border-[#E7E5E0] bg-white p-5">
                <div className="text-sm text-slate-600">Last 30 days</div>
                <div className="mt-1 text-3xl font-semibold text-slate-900">
                  {formatUsd(metrics.revenueCentsLast30Days)}
                </div>
              </div>
              <div className="rounded-xl border border-[#E7E5E0] bg-white p-5">
                <div className="text-sm text-slate-600">Last 7 days</div>
                <div className="mt-1 text-3xl font-semibold text-slate-900">
                  {formatUsd(metrics.revenueCentsLast7Days)}
                </div>
              </div>
            </div>

            {/* ---------- Disclosures ---------- */}
            {(metrics.testOrdersExcluded > 0 || metrics.estimatedRevenueRows > 0) && (
              <p className="mt-3 text-xs text-slate-500">
                {metrics.testOrdersExcluded > 0 && (
                  <>
                    {metrics.testOrdersExcluded} test order
                    {metrics.testOrdersExcluded === 1 ? '' : 's'} excluded from all figures.{' '}
                  </>
                )}
                {metrics.estimatedRevenueRows > 0 && (
                  <>
                    Revenue for {metrics.estimatedRevenueRows} older order
                    {metrics.estimatedRevenueRows === 1 ? '' : 's'} estimated at the flat $39
                    (pre-dates per-order amount tracking).
                  </>
                )}
              </p>
            )}

            {/* ---------- Breakdowns ---------- */}
            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  By state
                </h2>
                <div className="mt-3 overflow-hidden rounded-xl border border-[#E7E5E0] bg-white">
                  {metrics.byState.length === 0 ? (
                    <p className="p-5 text-sm text-slate-600">No orders yet.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <tbody>
                        {metrics.byState.map((row) => (
                          <tr key={row.state} className="border-b border-[#E7E5E0] last:border-b-0">
                            <td className="px-5 py-3 text-slate-900">{row.state}</td>
                            <td className="px-5 py-3 text-right font-medium text-slate-900">
                              {row.count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>

              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Case strength
                </h2>
                <div className="mt-3 overflow-hidden rounded-xl border border-[#E7E5E0] bg-white">
                  {metrics.byCaseStrength.length === 0 ? (
                    <p className="p-5 text-sm text-slate-600">No orders yet.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <tbody>
                        {metrics.byCaseStrength.map((row) => (
                          <tr
                            key={row.strength}
                            className="border-b border-[#E7E5E0] last:border-b-0"
                          >
                            <td className="px-5 py-3 text-slate-900">
                              {strengthLabel(row.strength)}
                            </td>
                            <td className="px-5 py-3 text-right font-medium text-slate-900">
                              {row.count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  "Not answered" = customer skipped the Quick Case Check (questions are currently
                  optional — see Project I).
                </p>
              </section>
            </div>
          </>
        )}
      </main>
    </SiteChrome>
  );
}
