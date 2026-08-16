// app/admin/funnel/page.tsx  — SERVER COMPONENT (Project J v2, batch 10)
//
// The intake-form funnel: form started → step 1–6 completed → review →
// checkout redirect → paid orders, with % of starts at each stage, validation
// blocks by step, and the autofill-vs-manual split on paid orders.
//
// Data sources:
//   - Redis daily counters via lib/funnelServer (anonymous unique-session
//     tallies, Eastern-day keys — see the storage model note there).
//   - Supabase paid-order stats via getFunnelOrderStats (same Eastern-day
//     vocabulary, test orders excluded like every metrics surface).
//
// Entirely server-rendered — one GET form for the date range (the orders
// page's preset vocabulary: today / 7d / 30d / custom), no client islands.
//
// READING THE NUMBERS (the honest fine print, also rendered on-page):
//   - Counters exist from the day J v2 shipped; earlier days read zero.
//   - "Paid orders" comes from Supabase order rows; the funnel counters come
//     from browser events. Blocked storage, disabled JS, or beacon loss mean
//     the two won't reconcile exactly — treat trends, not single sessions.
//   - Step 6 → Review losses include the coverage/offsets blocked screens,
//     the warnings pause, and strength-modal abandonment (by design: step 6
//     "completed" means its fields validated).
import Link from 'next/link';
import SiteChrome from '../../components/SiteChrome';
import { requireAdmin } from '../../../lib/adminAuth';
import {
  getFunnelCounts,
  easternToday,
  shiftDay,
  WIZARD_STEP_COUNT,
  MAX_RANGE_DAYS,
} from '../../../lib/funnelServer';
import { getFunnelOrderStats } from '../../../lib/db';

export const dynamic = 'force-dynamic';

// Wizard step titles, mirrored from SecurityDepositForm's WIZARD_STEPS (display
// only — if the wizard is ever restructured, update BOTH, same as FIELD_STEP).
const STEP_TITLES = [
  'About you',
  'The rental property',
  'Deposit & dates',
  'Your landlord',
  'What happened',
  'The honest facts',
];

const YMD = /^\d{4}-\d{2}-\d{2}$/;

/** Resolve the preset + custom inputs into an inclusive Eastern day range. */
function resolveDays(
  preset: string,
  from: string,
  to: string,
): { dayFrom: string; dayTo: string; label: string } {
  const today = easternToday();
  switch (preset) {
    case 'today':
      return { dayFrom: today, dayTo: today, label: 'Today' };
    case '30d':
      return { dayFrom: shiftDay(today, -29), dayTo: today, label: 'Last 30 days' };
    case 'custom': {
      const dayFrom = YMD.test(from) ? from : shiftDay(today, -6);
      const dayTo = YMD.test(to) ? to : today;
      return { dayFrom, dayTo, label: `${dayFrom} → ${dayTo}` };
    }
    case '7d':
    default:
      // 7 days is the default view: wide enough to smooth day-of-week noise,
      // narrow enough that a wizard/autofill effect would show.
      return { dayFrom: shiftDay(today, -6), dayTo: today, label: 'Last 7 days' };
  }
}

const INPUT_CLS =
  'w-full rounded-lg border border-[#E7E5E0] bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#B45309] focus:outline-none';
const LABEL_CLS = 'block text-xs font-medium text-slate-500';

function pctOfStarts(n: number, starts: number): string {
  if (starts <= 0) return '—';
  return `${Math.round((n / starts) * 1000) / 10}%`;
}

export default async function AdminFunnelPage({
  searchParams,
}: {
  // Next.js 15: searchParams is async.
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;

  const preset = (sp.range ?? '7d').trim();
  const { dayFrom, dayTo, label } = resolveDays(
    preset,
    (sp.from ?? '').trim(),
    (sp.to ?? '').trim(),
  );

  const [counts, orderStats] = await Promise.all([
    getFunnelCounts(dayFrom, dayTo),
    getFunnelOrderStats(dayFrom, dayTo),
  ]);

  const starts = counts.formStarted;

  // The funnel table rows, in order. Paid orders come from Supabase (the only
  // row not sourced from browser events).
  const rows: { stage: string; n: number; note?: string }[] = [
    { stage: 'Form started', n: starts, note: 'first field interaction' },
    ...counts.stepCompleted.map((n, i) => ({
      stage: `Step ${i + 1} done — ${STEP_TITLES[i] ?? ''}`,
      n,
    })),
    { stage: 'Review reached', n: counts.reviewReached },
    { stage: 'Checkout redirect', n: counts.checkoutRedirect, note: 'sent to Stripe' },
    { stage: 'Paid orders', n: orderStats.paidOrders, note: 'from order rows, test excluded' },
  ];

  const anyBlocked = counts.validationBlocked.some((n) => n > 0);
  const anyFunnelData =
    starts > 0 || counts.stepCompleted.some((n) => n > 0) || counts.reviewReached > 0;

  return (
    <SiteChrome>
      <main className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1
              className="text-3xl font-semibold tracking-tight text-slate-900"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Funnel
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Intake form drop-off — unique sessions per stage, {label}
              {counts.truncated ? ` (capped at ${MAX_RANGE_DAYS} days)` : ''}
            </p>
          </div>
          <div className="flex items-center gap-5">
            <Link
              href="/admin/orders"
              className="text-sm font-medium text-[#B45309] transition hover:text-[#92400E]"
            >
              View orders
            </Link>
            <Link
              href="/admin"
              className="text-sm font-medium text-slate-700 transition hover:text-slate-900"
            >
              ← Back to metrics
            </Link>
          </div>
        </div>

        {/* ---------- Date range (one GET form, no client JS) ---------- */}
        <form
          method="get"
          className="mt-6 rounded-xl border border-[#E7E5E0] bg-white p-4 sm:p-5"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
            <div>
              <label className={LABEL_CLS} htmlFor="range">
                Range (Eastern days)
              </label>
              <select id="range" name="range" defaultValue={preset} className={`mt-1 ${INPUT_CLS}`}>
                <option value="today">Today</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="from">
                From (custom)
              </label>
              <input
                id="from"
                type="date"
                name="from"
                defaultValue={preset === 'custom' ? dayFrom : ''}
                className={`mt-1 ${INPUT_CLS}`}
              />
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="to">
                To (custom)
              </label>
              <input
                id="to"
                type="date"
                name="to"
                defaultValue={preset === 'custom' ? dayTo : ''}
                className={`mt-1 ${INPUT_CLS}`}
              />
            </div>
            <button
              type="submit"
              className="rounded-full bg-[#B45309] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#92400E]"
            >
              Apply
            </button>
          </div>
        </form>

        {/* ---------- The funnel ---------- */}
        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Stage by stage
        </h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-[#E7E5E0] bg-white">
          {!anyFunnelData && orderStats.paidOrders === 0 ? (
            <p className="p-6 text-sm text-slate-600">
              No funnel events in this range. Counters exist from the day funnel
              tracking shipped — earlier days read zero.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E7E5E0] text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Stage</th>
                  <th className="px-5 py-3 text-right">Sessions</th>
                  <th className="px-5 py-3 text-right">% of starts</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.stage}
                    className="border-b border-[#E7E5E0] last:border-b-0 hover:bg-[#FAFAF7]"
                  >
                    <td className="px-5 py-3 text-slate-900">
                      {row.stage}
                      {row.note && (
                        <span className="ml-2 text-xs text-slate-500">({row.note})</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-900">{row.n}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-700">
                      {pctOfStarts(row.n, starts)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ---------- Validation blocks by step ---------- */}
        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Validation blocks by step
        </h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-[#E7E5E0] bg-white">
          {!anyBlocked ? (
            <p className="p-6 text-sm text-slate-600">
              No validation blocks recorded in this range.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E7E5E0] text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Step</th>
                  <th className="px-5 py-3 text-right">Sessions blocked</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: WIZARD_STEP_COUNT }, (_, i) => (
                  <tr
                    key={i}
                    className="border-b border-[#E7E5E0] last:border-b-0 hover:bg-[#FAFAF7]"
                  >
                    <td className="px-5 py-3 text-slate-900">
                      Step {i + 1} — {STEP_TITLES[i] ?? ''}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-900">
                      {counts.validationBlocked[i] ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          A session counts once per step per day — this shows which steps fight
          people, not how many times they retried.
        </p>

        {/* ---------- Autofill split (the Aug 15–16 question) ---------- */}
        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Address autofill
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#E7E5E0] bg-white p-5">
            <div className="text-sm text-slate-600">Sessions using autofill</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
              {counts.autofillUsed}
            </div>
            <div className="mt-1 text-xs text-slate-500">accepted a Places suggestion</div>
          </div>
          <div className="rounded-xl border border-[#E7E5E0] bg-white p-5">
            <div className="text-sm text-slate-600">Paid orders — autofill used</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
              {orderStats.autofillUsed}
              <span className="text-sm font-normal text-slate-500">
                {' '}
                of {orderStats.withFunnelStamp} stamped
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-500">from the order payload stamp</div>
          </div>
          <div className="rounded-xl border border-[#E7E5E0] bg-white p-5">
            <div className="text-sm text-slate-600">Paid orders — manual entry</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
              {orderStats.manualEntry}
              <span className="text-sm font-normal text-slate-500">
                {' '}
                of {orderStats.withFunnelStamp} stamped
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-500">typed every address by hand</div>
          </div>
        </div>
        {orderStats.paidOrders > orderStats.withFunnelStamp && (
          <p className="mt-2 text-xs text-slate-500">
            {orderStats.paidOrders - orderStats.withFunnelStamp} of{' '}
            {orderStats.paidOrders} paid orders in this range carry no funnel
            stamp (they pre-date funnel tracking, or the customer&apos;s browser
            blocked storage).
          </p>
        )}

        {/* ---------- Fine print ---------- */}
        <div className="mt-8 rounded-xl border border-[#E7E5E0] bg-[#FAFAF7] p-5 text-xs leading-relaxed text-slate-600">
          <p className="font-semibold text-slate-700">Reading these numbers</p>
          <p className="mt-1.5">
            Counters are anonymous unique-session tallies per Eastern day and
            exist from the day funnel tracking shipped — earlier days read
            zero. Paid orders come from order rows (test orders excluded);
            everything else comes from browser events, so blocked storage or
            lost beacons mean the columns won&apos;t reconcile exactly — read
            trends, not single sessions. The Step 6 → Review gap includes the
            coverage and offsets blocked screens, the warnings pause, and the
            case-strength modal, by design.
          </p>
        </div>
      </main>
    </SiteChrome>
  );
}
