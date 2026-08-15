// app/admin/orders/page.tsx  — SERVER COMPONENT (Project D, v3)
//
// The searchable, filterable order list. Defaults to the 50 most recent
// orders (the day-to-day "what came in?" view). One GET form carries the
// global search box PLUS the filter row (customer, date preset/range, state,
// case strength, real/test) — everything stays in the URL, the server
// component re-renders with filtered results.
//
// v3 additions:
//  - Excel-style filters: each dropdown's options come only from values
//    actually present in the data — and they CASCADE (a facet reflects every
//    other active filter, like Excel's column filters). The state filter is a
//    type-to-narrow <datalist> input: typed partials ("conn") match too.
//  - Bulk test-flag: checkbox per row + select-all in the header; "Mark as
//    test" / "Unmark" buttons above the table act on the selection via a
//    server action, with a count banner and filters preserved.
//  - Top scrollbar: TableScroller adds a synced horizontal scrollbar strip
//    above the table so wide tables can be scrolled without going to the
//    bottom of the container.
//  - Dates (display AND the date filter) use Eastern time, so "today" is
//    Adem's today rather than the server's UTC day.
//
// Test orders are shown (badged TEST) — only the metrics page excludes them.
import Link from 'next/link';
import SiteChrome from '../../components/SiteChrome';
import { requireAdmin } from '../../../lib/adminAuth';
import { getOrdersForAdminList, type OrderListFilters } from '../../../lib/db';
import SelectAllCheckbox from './SelectAllCheckbox';
import TableScroller from './TableScroller';
import { bulkSetTestFlag } from './actions';

export const dynamic = 'force-dynamic';

const ADMIN_TZ = 'America/New_York';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: ADMIN_TZ,
  });
}

function formatUsd(cents: number | undefined): string {
  if (cents === undefined) return '—';
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

// --- Date presets (all in ADMIN_TZ) ---------------------------------------

const YMD = /^\d{4}-\d{2}-\d{2}$/;

function tzToday(): string {
  // 'en-CA' formats as YYYY-MM-DD.
  return new Date().toLocaleDateString('en-CA', { timeZone: ADMIN_TZ });
}

function shiftDays(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Resolve the date preset + custom inputs into an inclusive from/to pair. */
function resolveDateRange(
  preset: string,
  from: string,
  to: string,
): { dateFrom?: string; dateTo?: string } {
  const today = tzToday();
  switch (preset) {
    case 'today':
      return { dateFrom: today, dateTo: today };
    case '7d':
      return { dateFrom: shiftDays(today, -6), dateTo: today };
    case '30d':
      return { dateFrom: shiftDays(today, -29), dateTo: today };
    case 'year':
      return { dateFrom: `${today.slice(0, 4)}-01-01`, dateTo: today };
    case 'custom':
    case '': {
      // Explicit custom range — also honored when dates are filled with no
      // preset selected.
      const dateFrom = YMD.test(from) ? from : undefined;
      const dateTo = YMD.test(to) ? to : undefined;
      if (preset === '' && !dateFrom && !dateTo) return {};
      return { dateFrom, dateTo };
    }
    default:
      return {};
  }
}

// --- Status banners (bulk action results) ----------------------------------

function bannerFor(
  status: string | undefined,
  n: string | undefined,
): { tone: 'ok' | 'warn' | 'error'; text: string } | undefined {
  if (!status) return undefined;
  const count = Number(n ?? '0');
  const orders = count === 1 ? 'order' : 'orders';
  switch (status) {
    case 'bulk_flagged':
      return { tone: 'ok', text: `${count} ${orders} marked as test.` };
    case 'bulk_unflagged':
      return { tone: 'ok', text: `${count} ${orders} unmarked (now counted as real orders).` };
    case 'bulk_none':
      return {
        tone: 'warn',
        text: 'No orders were selected — tick at least one checkbox first.',
      };
    case 'bulk_failed':
      return { tone: 'error', text: 'Bulk update failed — check server logs.' };
    default:
      return undefined;
  }
}

const BANNER_STYLES: Record<'ok' | 'warn' | 'error', string> = {
  ok: 'border-green-200 bg-green-50 text-green-800',
  warn: 'border-amber-200 bg-amber-50 text-amber-800',
  error: 'border-red-200 bg-red-50 text-red-800',
};

// --- Shared control styles ---------------------------------------------------

const INPUT_CLS =
  'w-full rounded-lg border border-[#E7E5E0] bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#B45309] focus:outline-none';
const LABEL_CLS = 'block text-xs font-medium text-slate-500';

function strengthLabel(value: string): string {
  if (value === 'not answered') return 'Not answered';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  // Next.js 15: searchParams is async.
  searchParams: Promise<{
    q?: string;
    customer?: string;
    date?: string;
    from?: string;
    to?: string;
    state?: string;
    strength?: string;
    type?: string;
    status?: string;
    n?: string;
  }>;
}) {
  await requireAdmin();
  const sp = await searchParams;

  const search = (sp.q ?? '').trim();
  const customer = (sp.customer ?? '').trim();
  const datePreset = (sp.date ?? '').trim();
  const fromParam = (sp.from ?? '').trim();
  const toParam = (sp.to ?? '').trim();
  const stateFilter = (sp.state ?? '').trim();
  const strengthFilter = (sp.strength ?? '').trim();
  const typeParam = (sp.type ?? '').trim();
  const orderType =
    typeParam === 'real' || typeParam === 'test' ? typeParam : undefined;

  const { dateFrom, dateTo } = resolveDateRange(datePreset, fromParam, toParam);

  const filters: OrderListFilters = {
    search: search || undefined,
    customer: customer || undefined,
    state: stateFilter || undefined,
    caseStrength: strengthFilter || undefined,
    orderType,
    dateFrom,
    dateTo,
  };

  const anyFilterActive = Boolean(
    search || customer || stateFilter || strengthFilter || orderType || dateFrom || dateTo,
  );
  // Unfiltered default keeps the familiar 50-most-recent view; a filtered
  // view is a deliberate lookup, so it gets more room before truncating.
  const limit = anyFilterActive ? 200 : 50;

  const { orders, totalMatching, facets } = await getOrdersForAdminList(filters, limit);
  const banner = bannerFor(sp.status, sp.n);

  // Current filter params, re-carried by the bulk form so its redirect can
  // restore this exact view (whitelisted server-side in the action).
  const ctx: Record<string, string> = {
    q: search,
    customer,
    date: datePreset,
    from: fromParam,
    to: toParam,
    state: stateFilter,
    strength: strengthFilter,
    type: typeParam,
  };

  return (
    <SiteChrome>
      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1
              className="text-3xl font-semibold tracking-tight text-slate-900"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Orders
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {anyFilterActive
                ? `${totalMatching} order${totalMatching === 1 ? '' : 's'} match the current search/filters`
                : 'Most recent 50 orders, newest first'}
            </p>
          </div>
          <div className="flex items-center gap-5">
            {/* Project D v2: full CSV export (all orders incl. test, flagged column). */}
            <a
              href="/admin/orders/export"
              className="text-sm font-medium text-[#B45309] transition hover:text-[#92400E]"
            >
              Export CSV
            </a>
            <Link
              href="/admin"
              className="text-sm font-medium text-slate-700 transition hover:text-slate-900"
            >
              ← Back to metrics
            </Link>
          </div>
        </div>

        {banner && (
          <div
            className={`mt-4 rounded-xl border px-4 py-3 text-sm ${BANNER_STYLES[banner.tone]}`}
          >
            {banner.text}
          </div>
        )}

        {/* ---------- Search + filters (one GET form, no client JS) ---------- */}
        <form
          method="get"
          className="mt-6 rounded-xl border border-[#E7E5E0] bg-white p-4 sm:p-5"
        >
          <input
            type="text"
            name="q"
            defaultValue={search}
            placeholder="Search ref #, email, name, state, or Stripe session id"
            className={INPUT_CLS}
          />

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div>
              <label className={LABEL_CLS} htmlFor="filter-customer">
                Customer
              </label>
              <input
                id="filter-customer"
                type="text"
                name="customer"
                defaultValue={customer}
                placeholder="Name or email"
                className={`mt-1 ${INPUT_CLS}`}
              />
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="filter-date">
                Date
              </label>
              <select
                id="filter-date"
                name="date"
                defaultValue={datePreset}
                className={`mt-1 ${INPUT_CLS}`}
              >
                <option value="">All time</option>
                <option value="today">Today</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="year">This year</option>
                <option value="custom">Custom range</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="filter-from">
                From (custom)
              </label>
              <input
                id="filter-from"
                type="date"
                name="from"
                defaultValue={fromParam}
                className={`mt-1 ${INPUT_CLS}`}
              />
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="filter-to">
                To (custom)
              </label>
              <input
                id="filter-to"
                type="date"
                name="to"
                defaultValue={toParam}
                className={`mt-1 ${INPUT_CLS}`}
              />
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="filter-state">
                State
              </label>
              {/* Excel-style: the datalist holds only states present in the
                  (otherwise-filtered) data; typing narrows it natively, and
                  typed partials ("conn") match as substrings too. */}
              <input
                id="filter-state"
                type="text"
                name="state"
                list="state-filter-options"
                defaultValue={stateFilter}
                placeholder="All states"
                className={`mt-1 ${INPUT_CLS}`}
              />
              <datalist id="state-filter-options">
                {facets.states.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="filter-strength">
                Case strength
              </label>
              <select
                id="filter-strength"
                name="strength"
                defaultValue={strengthFilter}
                className={`mt-1 ${INPUT_CLS}`}
              >
                <option value="">All</option>
                {facets.caseStrengths.map((s) => (
                  <option key={s} value={s}>
                    {strengthLabel(s)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="w-40">
              <label className={LABEL_CLS} htmlFor="filter-type">
                Order type
              </label>
              <select
                id="filter-type"
                name="type"
                defaultValue={orderType ?? ''}
                className={`mt-1 ${INPUT_CLS}`}
              >
                <option value="">All orders</option>
                <option value="real">Real only</option>
                <option value="test">Test only</option>
              </select>
            </div>
            <button
              type="submit"
              className="rounded-full bg-[#B45309] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#92400E]"
            >
              Apply
            </button>
            {anyFilterActive && (
              <Link
                href="/admin/orders"
                className="inline-flex items-center rounded-full border border-[#E7E5E0] bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:text-slate-900"
              >
                Clear all
              </Link>
            )}
          </div>
        </form>

        {/* ---------- Bulk test-flag form: action bar + table ---------- */}
        <form action={bulkSetTestFlag} className="mt-6">
          {/* Carry the current filters so the post-action redirect restores
              this exact view. */}
          {Object.entries(ctx).map(([key, value]) =>
            value ? (
              <input key={key} type="hidden" name={`ctx_${key}`} value={value} />
            ) : null,
          )}

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-slate-600">With selected:</span>
            <button
              type="submit"
              name="mode"
              value="test"
              className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 shadow-sm transition hover:bg-amber-100"
            >
              Mark as test
            </button>
            <button
              type="submit"
              name="mode"
              value="real"
              className="rounded-full border border-[#E7E5E0] bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:text-slate-900"
            >
              Unmark (real order)
            </button>
            <span className="text-xs text-slate-500">
              Test orders stay visible everywhere but are excluded from metrics.
            </span>
          </div>

          <div className="mt-3 rounded-xl border border-[#E7E5E0] bg-white">
            {orders.length === 0 ? (
              <p className="p-6 text-sm text-slate-600">
                {anyFilterActive
                  ? 'No orders match the current search/filters.'
                  : 'No orders yet.'}
              </p>
            ) : (
              <TableScroller>
                <table className="w-full min-w-[780px] text-sm">
                  <thead>
                    <tr className="border-b border-[#E7E5E0] text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="w-10 px-4 py-3">
                        <SelectAllCheckbox />
                      </th>
                      <th className="px-5 py-3">Ref #</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Customer</th>
                      <th className="px-5 py-3">State</th>
                      <th className="px-5 py-3">Paid</th>
                      <th className="px-5 py-3">Case</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-[#E7E5E0] last:border-b-0 hover:bg-[#FAFAF7]"
                      >
                        <td className="w-10 px-4 py-3">
                          <input
                            type="checkbox"
                            name="refs"
                            value={order.refNumber}
                            aria-label={`Select ${order.refNumber}`}
                            className="h-4 w-4 rounded border-[#E7E5E0] accent-[#B45309]"
                          />
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-slate-900">
                          <span className="flex items-center gap-2">
                            {order.refNumber}
                            {order.isTest && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                                Test
                              </span>
                            )}
                            {order.adminNote && (
                              <span
                                title={order.adminNote}
                                className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600"
                              >
                                Note
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-slate-700">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-5 py-3 text-slate-900">
                          <div>{order.tenantName}</div>
                          <div className="text-xs text-slate-500">{order.email}</div>
                        </td>
                        <td className="px-5 py-3 text-slate-700">
                          {order.state}
                          {order.city ? `, ${order.city}` : ''}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-slate-700">
                          {formatUsd(order.amountPaidCents)}
                        </td>
                        <td className="px-5 py-3 capitalize text-slate-700">
                          {order.caseStrength ?? '—'}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link
                            href={`/admin/orders/${encodeURIComponent(order.refNumber)}`}
                            className="text-sm font-medium text-[#B45309] transition hover:text-[#92400E]"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroller>
            )}
          </div>
        </form>

        {orders.length < totalMatching && (
          <p className="mt-3 text-xs text-slate-500">
            {anyFilterActive
              ? `Showing the first ${orders.length} of ${totalMatching} matching orders — narrow the filters to see the rest.`
              : `Showing the 50 most recent orders (${totalMatching} total). Use search or filters to find older ones.`}
          </p>
        )}
      </main>
    </SiteChrome>
  );
}
