// app/dashboard/DashboardClient.tsx  — Project E (CLIENT COMPONENT)
//
// The interactive half of the dashboard. Receives already-fetched, already-
// scoped order rows from the server component (app/dashboard/page.tsx) and
// handles: re-downloading any letter's PDF, an account-settings panel (email +
// change password), and sign-out. No data fetching happens here.
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SiteChrome from '../components/SiteChrome';
import { buildLetterPdfDoc, LETTER_PDF_FILENAME } from '../../lib/letterPdf';
import { signOut, updatePassword } from '../../lib/auth';

export interface DashboardOrder {
  refNumber: string;
  state: string;
  city: string;
  depositAmount: number;
  vacatedDate: string;
  createdAt: string;
  caseStrength: string | null;
  letterText: string;
}

const MIN_PASSWORD = 8;

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function strengthStyles(strength: string | null): { label: string; cls: string } {
  switch ((strength ?? '').toLowerCase()) {
    case 'strong':
      return { label: 'Strong case', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'moderate':
      return { label: 'Moderate case', cls: 'bg-amber-50 text-amber-800 border-amber-200' };
    case 'weak':
      return { label: 'Weak case', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
    default:
      return { label: 'Case strength n/a', cls: 'bg-slate-100 text-slate-500 border-slate-200' };
  }
}

export default function DashboardClient({
  email,
  orders,
}: {
  email: string;
  orders: DashboardOrder[];
}) {
  const router = useRouter();

  const [showSettings, setShowSettings] = useState(false);
  const [pw, setPw] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwDone, setPwDone] = useState(false);

  const handleDownload = (order: DashboardOrder) => {
    // Same shared builder as the success page — byte-for-byte identical PDF.
    buildLetterPdfDoc(order.letterText).save(LETTER_PDF_FILENAME);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  const handleChangePassword = async () => {
    setPwError('');
    setPwDone(false);
    if (pw.length < MIN_PASSWORD) {
      setPwError(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (pw !== pwConfirm) {
      setPwError('Passwords don’t match.');
      return;
    }
    setPwBusy(true);
    try {
      const res = await updatePassword(pw);
      if (!res.ok) {
        setPwError(res.error || 'Could not update your password.');
        return;
      }
      setPwDone(true);
      setPw('');
      setPwConfirm('');
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <SiteChrome>
      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        {/* Header row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1
              className="text-3xl font-semibold tracking-tight text-slate-900"
              style={{ fontFamily: 'var(--font-display), ui-serif, Georgia, serif' }}
            >
              Your letters
            </h1>
            <p className="mt-1.5 text-sm text-slate-600">
              Signed in as <span className="font-medium text-slate-800">{email}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings((s) => !s)}
              className="rounded-full border border-[#E7E5E0] bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              {showSettings ? 'Close settings' : 'Account settings'}
            </button>
            <button
              onClick={handleSignOut}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-500 transition hover:text-slate-800"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <section className="mt-6 rounded-2xl border border-[#E7E5E0] bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Account settings</h2>
            <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-[140px_1fr]">
              <dt className="text-slate-500">Email</dt>
              <dd className="text-slate-800">{email}</dd>
            </dl>
            <p className="mt-1 text-xs text-slate-400">
              Need to change your email? Email support@gettenantshield.com and
              we’ll move your orders over.
            </p>

            <div className="mt-6 border-t border-[#F0EEE9] pt-5">
              <h3 className="text-sm font-medium text-slate-700">Change password</h3>
              <div className="mt-3 flex max-w-sm flex-col gap-3">
                <input
                  type="password"
                  autoComplete="new-password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="New password (8+ characters)"
                  className="w-full rounded-lg border border-[#E7E5E0] bg-[#FAFAF7] px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#B45309] focus:bg-white focus:ring-2 focus:ring-[#B45309]/20"
                />
                <input
                  type="password"
                  autoComplete="new-password"
                  value={pwConfirm}
                  onChange={(e) => setPwConfirm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
                  placeholder="Confirm new password"
                  className="w-full rounded-lg border border-[#E7E5E0] bg-[#FAFAF7] px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#B45309] focus:bg-white focus:ring-2 focus:ring-[#B45309]/20"
                />
                {pwError && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                    {pwError}
                  </p>
                )}
                {pwDone && (
                  <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
                    Password updated.
                  </p>
                )}
                <button
                  onClick={handleChangePassword}
                  disabled={pwBusy}
                  className="inline-flex w-fit items-center justify-center rounded-full bg-[#B45309] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#92400E] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pwBusy ? 'Saving…' : 'Update password'}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Orders */}
        {orders.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[#E0DDD6] bg-white/60 p-10 text-center">
            <p className="text-sm text-slate-600">
              No letters here yet. When you generate one, it’ll show up here for
              re-download anytime.
            </p>
            <a
              href="/generate"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#B45309] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#92400E]"
            >
              Generate a letter — $39
            </a>
          </div>
        ) : (
          <ul className="mt-8 flex flex-col gap-3">
            {orders.map((order) => {
              const s = strengthStyles(order.caseStrength);
              const place = order.city ? `${order.city}, ${order.state}` : order.state;
              return (
                <li
                  key={order.refNumber}
                  className="flex flex-col gap-4 rounded-2xl border border-[#E7E5E0] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-medium text-slate-900">
                        {order.refNumber}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${s.cls}`}
                      >
                        {s.label}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-600">
                      {place} · ${order.depositAmount.toLocaleString()} deposit ·
                      generated {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownload(order)}
                    className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#E7E5E0] bg-[#FAFAF7] px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:border-[#B45309] hover:text-[#92400E]"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Download PDF
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-10 text-center text-xs text-slate-400">
          Letters are stored as text and the PDF is rebuilt on download, so it’s
          always identical to the original.
        </p>
      </main>
    </SiteChrome>
  );
}
