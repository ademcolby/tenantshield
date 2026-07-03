// app/admin/orders/[ref]/page.tsx  — SERVER COMPONENT (Project D)
//
// Single-order drill-in: full order fields with copy buttons, a Stripe
// deep-link, the raw form payload, the letter text, PDF re-download, and the
// only two writable admin fields (note + test flag) via a server action.
//
// Order data itself is deliberately READ-ONLY here — genuine data fixes go
// through the Supabase Table Editor. Notes let you annotate without mutating.
import Link from 'next/link';
import SiteChrome from '../../../components/SiteChrome';
import { requireAdmin } from '../../../../lib/adminAuth';
import { getOrderByRef } from '../../../../lib/db';
import CopyButton from '../../CopyButton';
import DownloadPdfButton from '../../DownloadPdfButton';
import ConfirmButton from '../../ConfirmButton';
import { saveAdminFields, resendReceiptEmail, regenerateLetter } from './actions';

export const dynamic = 'force-dynamic';
// Regeneration calls Anthropic and can take most of a minute.
export const maxDuration = 60;

// Status banners (v2): every admin action redirects back with ?status=... so
// the result is visible instead of a silent re-render.
const STATUS_BANNERS: Record<string, { tone: 'ok' | 'warn' | 'error'; text: string }> = {
  saved: { tone: 'ok', text: 'Admin fields saved.' },
  save_failed: { tone: 'error', text: 'Save failed — check server logs.' },
  resent: { tone: 'ok', text: 'Receipt email re-sent (with PDF) to the order email address.' },
  resend_failed: {
    tone: 'error',
    text: 'Re-send failed — check server logs and the Resend dashboard.',
  },
  regenerated: {
    tone: 'ok',
    text: 'Letter regenerated and saved. The previous version was overwritten, and a note was added below.',
  },
  regen_missing_info: {
    tone: 'warn',
    text: 'Regeneration did NOT overwrite the letter: the model returned a MISSING_INFORMATION signal for this form data. The original letter is unchanged.',
  },
  regen_out_of_scope: {
    tone: 'warn',
    text: 'Regeneration did NOT overwrite the letter: the model returned a SCOPE_LIMITATION signal for this form data. The original letter is unchanged.',
  },
  regen_error: {
    tone: 'error',
    text: 'Regeneration failed — the original letter is unchanged. Check server logs.',
  },
};

const BANNER_STYLES: Record<'ok' | 'warn' | 'error', string> = {
  ok: 'border-green-200 bg-green-50 text-green-800',
  warn: 'border-amber-200 bg-amber-50 text-amber-800',
  error: 'border-red-200 bg-red-50 text-red-800',
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatUsd(cents: number | undefined): string {
  if (cents === undefined) return 'Not recorded (pre-dates amount tracking)';
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

/**
 * Stripe dashboard deep-link. There is no stable public URL scheme for a
 * checkout session page, but dashboard search on the session id resolves to
 * the payment. Test-mode sessions (cs_test_...) must use the /test/ dashboard.
 */
function stripeSearchUrl(sessionId: string): string {
  const base = sessionId.startsWith('cs_test_')
    ? 'https://dashboard.stripe.com/test/search'
    : 'https://dashboard.stripe.com/search';
  return `${base}?query=${encodeURIComponent(sessionId)}`;
}

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  // Next.js 15: params and searchParams are async.
  params: Promise<{ ref: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { ref } = await params;
  const { status } = await searchParams;
  const banner = status ? STATUS_BANNERS[status] : undefined;
  const refNumber = decodeURIComponent(ref);
  const order = await getOrderByRef(refNumber);

  return (
    <SiteChrome>
      <main className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
        <Link
          href="/admin/orders"
          className="text-sm font-medium text-slate-700 transition hover:text-slate-900"
        >
          ← Back to orders
        </Link>

        {!order ? (
          <div className="mt-6 rounded-xl border border-[#E7E5E0] bg-white p-6 text-sm text-slate-600">
            No order found with reference <span className="font-mono">{refNumber}</span>.
          </div>
        ) : (
          <>
            {banner && (
              <div
                className={`mt-4 rounded-xl border px-4 py-3 text-sm ${BANNER_STYLES[banner.tone]}`}
              >
                {banner.text}
              </div>
            )}
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1
                  className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-slate-900"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  <span className="font-mono">{order.refNumber}</span>
                  {order.isTest && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-amber-800">
                      Test
                    </span>
                  )}
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Generated {formatDateTime(order.createdAt)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <DownloadPdfButton letterText={order.letterText} />
                {/* v2: manual re-send — always attempts (bypasses the pipeline's
                    idempotency flag by calling sendLetterEmail directly). */}
                <form action={resendReceiptEmail}>
                  <input type="hidden" name="ref" value={order.refNumber} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#E7E5E0] bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:text-slate-900"
                  >
                    Re-send email
                  </button>
                </form>
                {/* v2: regenerate — confirm dialog, then overwrite-on-success. */}
                <form action={regenerateLetter}>
                  <input type="hidden" name="ref" value={order.refNumber} />
                  <ConfirmButton
                    message={`Regenerate this letter?\n\nThis calls the AI again on the stored form data and OVERWRITES the current letter text (no undo). The customer is NOT emailed automatically — use Re-send email after, if needed.`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 shadow-sm transition hover:bg-amber-100"
                  >
                    Regenerate letter
                  </ConfirmButton>
                </form>
              </div>
            </div>

            {/* ---------- Order fields ---------- */}
            <section className="mt-8 overflow-hidden rounded-xl border border-[#E7E5E0] bg-white">
              <dl className="divide-y divide-[#E7E5E0] text-sm">
                <div className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <dt className="text-slate-500">Reference</dt>
                  <dd className="flex items-center gap-2 font-mono text-slate-900">
                    {order.refNumber} <CopyButton value={order.refNumber} />
                  </dd>
                </div>
                <div className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <dt className="text-slate-500">Customer</dt>
                  <dd className="text-slate-900">{order.tenantName}</dd>
                </div>
                <div className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <dt className="text-slate-500">Email</dt>
                  <dd className="flex items-center gap-2 text-slate-900">
                    {order.email} <CopyButton value={order.email} />
                  </dd>
                </div>
                <div className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <dt className="text-slate-500">Location</dt>
                  <dd className="text-slate-900">
                    {order.city ? `${order.city}, ` : ''}
                    {order.state}
                  </dd>
                </div>
                <div className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <dt className="text-slate-500">Security deposit</dt>
                  <dd className="text-slate-900">
                    {order.depositAmount.toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    })}
                  </dd>
                </div>
                <div className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <dt className="text-slate-500">Amount paid</dt>
                  <dd className="text-slate-900">{formatUsd(order.amountPaidCents)}</dd>
                </div>
                <div className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <dt className="text-slate-500">Vacated</dt>
                  <dd className="text-slate-900">{order.vacatedDate}</dd>
                </div>
                <div className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <dt className="text-slate-500">Case strength</dt>
                  <dd className="capitalize text-slate-900">
                    {order.caseStrength ?? 'Not answered'}
                  </dd>
                </div>
                <div className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <dt className="text-slate-500">Stripe session</dt>
                  <dd className="flex items-center gap-2 font-mono text-xs text-slate-900">
                    <a
                      href={stripeSearchUrl(order.stripeSessionId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#B45309] underline-offset-2 transition hover:text-[#92400E] hover:underline"
                    >
                      {order.stripeSessionId}
                    </a>
                    <CopyButton value={order.stripeSessionId} />
                  </dd>
                </div>
                <div className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <dt className="text-slate-500">Account (user id)</dt>
                  <dd className="font-mono text-xs text-slate-900">
                    {order.userId ?? 'No account'}
                  </dd>
                </div>
              </dl>
            </section>

            {/* ---------- Admin note + test flag ---------- */}
            <section className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Admin fields
              </h2>
              <form
                action={saveAdminFields}
                className="mt-3 rounded-xl border border-[#E7E5E0] bg-white p-5"
              >
                <input type="hidden" name="ref" value={order.refNumber} />
                <label className="block text-sm font-medium text-slate-700" htmlFor="admin_note">
                  Note
                </label>
                <textarea
                  id="admin_note"
                  name="admin_note"
                  rows={3}
                  defaultValue={order.adminNote ?? ''}
                  placeholder="Internal note about this order (never shown to the customer)"
                  className="mt-1 w-full rounded-lg border border-[#E7E5E0] bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#B45309] focus:outline-none"
                />
                <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="is_test"
                    defaultChecked={order.isTest}
                    className="h-4 w-4 rounded border-[#E7E5E0] accent-[#B45309]"
                  />
                  Test order (excluded from metrics; still visible everywhere)
                </label>
                <button
                  type="submit"
                  className="mt-4 rounded-full bg-[#B45309] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#92400E]"
                >
                  Save
                </button>
              </form>
            </section>

            {/* ---------- Letter text ---------- */}
            <section className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Letter text
              </h2>
              <pre className="mt-3 max-h-[480px] overflow-auto whitespace-pre-wrap rounded-xl border border-[#E7E5E0] bg-white p-5 text-xs leading-relaxed text-slate-800">
                {order.letterText}
              </pre>
            </section>

            {/* ---------- Raw form payload ---------- */}
            <section className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Form payload
              </h2>
              <pre className="mt-3 max-h-[480px] overflow-auto rounded-xl border border-[#E7E5E0] bg-white p-5 text-xs leading-relaxed text-slate-800">
                {JSON.stringify(order.formPayload, null, 2)}
              </pre>
            </section>
          </>
        )}
      </main>
    </SiteChrome>
  );
}
