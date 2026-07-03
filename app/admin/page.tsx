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
import { getOrderMetrics, getMetricsForRange, type RangeMetrics } from '../../lib/db';

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

// ---- Project D v2: date-range resolution -----------------------------------
// Presets are computed server-side in UTC (Vercel's clock). start is
// inclusive; end is EXCLUSIVE (custom end dates get +1 day so the chosen day
// is fully included).
type ResolvedRange = { label: string; startIso: string | null; endIso: string | null } | null;

function isoDay(y: number, monthZeroBased: number, d: number): string {
  return new Date(Date.UTC(y, monthZeroBased, d)).toISOString();
}

function resolveRange(sp: { preset?: string; start?: string; end?: string }): ResolvedRange {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();

  switch (sp.preset) {
    case 'this_month':
      return { label: 'This month', startIso: isoDay(y, m, 1), endIso: null };
    case 'last_month':
      return { label: 'Last month', startIso: isoDay(y, m - 1, 1), endIso: isoDay(y, m, 1) };
    case 'last_90':
      return {
        label: 'Last 90 days',
        startIso: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        endIso: null,
      };
    case 'all_time':
      return { label: 'All time', startIso: null, endIso: null };
    case 'custom': {
      const start = (sp.start ?? '').trim();
      const end = (sp.end ?? '').trim();
      if (!start && !end) return null;
      // Inclusive end day -> exclusive bound = end + 1 day.
      let endIso: string | null = null;
      if (end) {
        const endDate = new Date(`${end}T00:00:00.000Z`);
        endDate.setUTCDate(endDate.getUTCDate() + 1);
        endIso = endDate.toISOString();
      }
      const label = `${start || 'beginning'} → ${end || 'now'}`;
      return {
        label,
        startIso: start ? `${start}T00:00:00.000Z` : null,
        endIso,
      };
    }
    default:
      return null;
  }
}

export default async function AdminPage({
  searchParams,
}: {
  // Next.js 15: searchParams is async.
  searchParams: Promise<{ preset?: string; start?: string; end?: string }>;
}) {
  const adminEmail = await requireAdmin();
  const sp = await searchParams;
  const range = resolveRange(sp);
  const [metrics, rangeMetrics]: [
    Awaited<ReturnType<typeof getOrderMetrics>>,
    RangeMetrics | null,
  ] = await Promise.all([
    getOrderMetrics(),
    range ? getMetricsForRange(range.startIso, range.endIso) : Promise.resolve(null),
  ]);

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

            {/* ---------- Date-range metrics (Project D v2) ---------- */}
            <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Date range
            </h2>
            <form
              method="get"
              className="mt-3 flex flex-col gap-3 rounded-xl border border-[#E7E5E0] bg-white p-4 sm:flex-row sm:items-end"
            >
              <div className="flex flex-col gap-1">
                <label htmlFor="preset" className="text-xs font-medium text-slate-600">
                  Preset
                </label>
                <select
                  id="preset"
                  name="preset"
                  defaultValue={sp.preset ?? ''}
                  className="rounded-lg border border-[#E7E5E0] bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#B45309] focus:outline-none"
                >
                  <option value="">— Choose —</option>
                  <option value="this_month">This month</option>
                  <option value="last_month">Last month</option>
                  <option value="last_90">Last 90 days</option>
                  <option value="all_time">All time</option>
                  <option value="custom">Custom (use dates)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="start" className="text-xs font-medium text-slate-600">
                  Start (custom)
                </label>
                <input
                  id="start"
                  type="date"
                  name="start"
                  defaultValue={sp.start ?? ''}
                  className="rounded-lg border border-[#E7E5E0] bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#B45309] focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="end" className="text-xs font-medium text-slate-600">
                  End (custom, inclusive)
                </label>
                <input
                  id="end"
                  type="date"
                  name="end"
                  defaultValue={sp.end ?? ''}
                  className="rounded-lg border border-[#E7E5E0] bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#B45309] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="rounded-full bg-[#B45309] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#92400E]"
              >
                Apply
              </button>
              {range && (
                <Link
                  href="/admin"
                  className="inline-flex items-center px-2 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
                >
                  Clear
                </Link>
              )}
            </form>

            {range && (
              <div className="mt-4">
                {!rangeMetrics ? (
                  <div className="rounded-xl border border-[#E7E5E0] bg-white p-5 text-sm text-slate-600">
                    Could not load range metrics — check server logs.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-[#E7E5E0] bg-white p-5">
                        <div className="text-sm text-slate-600">Letters — {range.label}</div>
                        <div className="mt-1 text-3xl font-semibold text-slate-900">
                          {rangeMetrics.orderCount}
                        </div>
                      </div>
                      <div className="rounded-xl border border-[#E7E5E0] bg-white p-5">
                        <div className="text-sm text-slate-600">Revenue — {range.label}</div>
                        <div className="mt-1 text-3xl font-semibold text-slate-900">
                          {formatUsd(rangeMetrics.revenueCents)}
                        </div>
                      </div>
                    </div>
                    {(rangeMetrics.testOrdersExcluded > 0 ||
                      rangeMetrics.estimatedRevenueRows > 0 ||
                      rangeMetrics.byState.length > 0) && (
                      <p className="mt-3 text-xs text-slate-500">
                        {rangeMetrics.byState.length > 0 && (
                          <>
                            By state:{' '}
                            {rangeMetrics.byState
                              .map((s) => `${s.state} (${s.count})`)
                              .join(', ')}
                            .{' '}
                          </>
                        )}
                        {rangeMetrics.testOrdersExcluded > 0 && (
                          <>
                            {rangeMetrics.testOrdersExcluded} test order
                            {rangeMetrics.testOrdersExcluded === 1 ? '' : 's'} excluded.{' '}
                          </>
                        )}
                        {rangeMetrics.estimatedRevenueRows > 0 && (
                          <>
                            Revenue for {rangeMetrics.estimatedRevenueRows} older order
                            {rangeMetrics.estimatedRevenueRows === 1 ? '' : 's'} estimated at
                            the flat $39.
                          </>
                        )}
                      </p>
                    )}
                  </>
                )}
              </div>
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
