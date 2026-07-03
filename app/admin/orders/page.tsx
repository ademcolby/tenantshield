// app/admin/orders/page.tsx  — SERVER COMPONENT (Project D)
//
// The searchable order list. Defaults to the 50 most recent orders (the
// day-to-day "what came in?" view); the search box filters across ref number,
// email, tenant name, state, and Stripe session id. Search is a plain GET form
// (?q=) — no client JS, the server component re-renders with filtered results.
//
// Test orders are shown (badged TEST) — only the metrics page excludes them.
import Link from 'next/link';
import SiteChrome from '../../components/SiteChrome';
import { requireAdmin } from '../../../lib/adminAuth';
import { getAllOrders } from '../../../lib/db';

export const dynamic = 'force-dynamic';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatUsd(cents: number | undefined): string {
  if (cents === undefined) return '—';
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  // Next.js 15: searchParams is async.
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;
  const search = (q ?? '').trim();
  const orders = await getAllOrders({ search: search || undefined, limit: 50 });

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
              {search
                ? `Search results for “${search}”`
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

        {/* Plain GET form — server-rendered search, no client JS needed. */}
        <form method="get" className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            name="q"
            defaultValue={search}
            placeholder="Search ref #, email, name, state, or Stripe session id"
            className="w-full rounded-lg border border-[#E7E5E0] bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#B45309] focus:outline-none"
          />
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-full bg-[#B45309] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#92400E]"
            >
              Search
            </button>
            {search && (
              <Link
                href="/admin/orders"
                className="inline-flex items-center rounded-full border border-[#E7E5E0] bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:text-slate-900"
              >
                Clear
              </Link>
            )}
          </div>
        </form>

        <div className="mt-6 overflow-x-auto rounded-xl border border-[#E7E5E0] bg-white">
          {orders.length === 0 ? (
            <p className="p-6 text-sm text-slate-600">
              {search ? 'No orders match that search.' : 'No orders yet.'}
            </p>
          ) : (
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-[#E7E5E0] text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
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
          )}
        </div>

        {!search && orders.length === 50 && (
          <p className="mt-3 text-xs text-slate-500">
            Showing the 50 most recent orders. Use search to find older ones.
          </p>
        )}
      </main>
    </SiteChrome>
  );
}
