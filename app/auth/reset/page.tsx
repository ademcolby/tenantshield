// app/auth/reset/page.tsx  — Project E
//
// Reached from a password-reset email link after /auth/confirm has exchanged the
// code for a short-lived recovery session. The customer is authenticated at this
// point, so updateUser({ password }) succeeds. If they land here without a valid
// recovery session (link expired, opened directly), we tell them how to recover.
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SiteChrome from '../../components/SiteChrome';
import { getSession, updatePassword } from '../../../lib/auth';

const MIN_PASSWORD = 8;

export default function ResetPasswordPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const session = await getSession();
      if (!active) return;
      setHasSession(!!session);
      setChecking(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async () => {
    setError('');
    if (password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (password !== confirm) {
      setError('Passwords don’t match.');
      return;
    }
    setBusy(true);
    try {
      const res = await updatePassword(password);
      if (!res.ok) {
        setError(res.error || 'Could not update your password. Request a new link.');
        return;
      }
      setDone(true);
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1400);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SiteChrome>
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-16 sm:px-8">
        <h1
          className="text-3xl font-semibold tracking-tight text-slate-900"
          style={{ fontFamily: 'var(--font-display), ui-serif, Georgia, serif' }}
        >
          Set a new password
        </h1>

        <div className="mt-7 rounded-2xl border border-[#E7E5E0] bg-white p-6 shadow-sm">
          {checking ? (
            <div className="flex items-center justify-center py-6">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#B45309]" />
            </div>
          ) : done ? (
            <p className="text-sm leading-relaxed text-slate-700">
              Password updated. Taking you to your dashboard…
            </p>
          ) : !hasSession ? (
            <p className="text-sm leading-relaxed text-slate-700">
              This reset link is no longer valid. Head back to{' '}
              <a href="/auth" className="font-medium text-[#B45309] hover:text-[#92400E]">
                sign in
              </a>{' '}
              and choose “Forgot your password?” to get a fresh link.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-slate-700">
                  New password
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-lg border border-[#E7E5E0] bg-[#FAFAF7] px-3.5 py-2.5 text-slate-900 outline-none transition focus:border-[#B45309] focus:bg-white focus:ring-2 focus:ring-[#B45309]/20"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-slate-700">
                  Confirm new password
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="Re-enter password"
                  className="w-full rounded-lg border border-[#E7E5E0] bg-[#FAFAF7] px-3.5 py-2.5 text-slate-900 outline-none transition focus:border-[#B45309] focus:bg-white focus:ring-2 focus:ring-[#B45309]/20"
                />
              </label>

              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={busy}
                className="mt-1 inline-flex items-center justify-center rounded-full bg-[#B45309] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#92400E] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? 'Saving…' : 'Update password'}
              </button>
            </div>
          )}
        </div>
      </main>
    </SiteChrome>
  );
}
