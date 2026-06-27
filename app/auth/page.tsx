// app/auth/page.tsx  — Project E
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SiteChrome from '../components/SiteChrome';
import { signIn, signUp, sendPasswordReset } from '../../lib/auth';

type Mode = 'signin' | 'signup' | 'forgot';

const MIN_PASSWORD = 8;

function AuthCard() {
  const router = useRouter();
  const params = useSearchParams();

  const initialEmail = params.get('email') ?? '';
  const next = params.get('next') ?? '/dashboard';
  const linkError = params.get('error') === 'link';

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // If an email arrives pre-filled (from the success page), assume the customer
  // is new and default them to the create-account view.
  useEffect(() => {
    if (initialEmail) setMode('signup');
  }, [initialEmail]);

  const clearMessages = () => {
    setError('');
    setNotice('');
  };

  const switchMode = (m: Mode) => {
    clearMessages();
    setMode(m);
  };

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSubmit = async () => {
    clearMessages();

    if (!emailValid) {
      setError('Enter a valid email address.');
      return;
    }
    if (mode !== 'forgot' && password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }

    setBusy(true);
    try {
      if (mode === 'signin') {
        const res = await signIn(email, password);
        if (!res.ok) {
          setError(res.error || 'Could not sign in. Check your email and password.');
          return;
        }
        router.push(next);
        router.refresh();
      } else if (mode === 'signup') {
        const res = await signUp(email, password);
        if (!res.ok) {
          setError(res.error || 'Could not create your account.');
          return;
        }
        if (res.needsEmailConfirm) {
          setNotice(
            'Check your inbox — we sent a confirmation link to ' +
              email.trim() +
              '. Click it to activate your account and see your letters.',
          );
        } else {
          router.push(next);
          router.refresh();
        }
      } else {
        const res = await sendPasswordReset(email);
        // Always show the same confirmation regardless of whether the address
        // exists — don't leak which emails have accounts.
        if (!res.ok) {
          setError(res.error || 'Could not send the reset link. Try again.');
          return;
        }
        setNotice(
          'If an account exists for ' +
            email.trim() +
            ', a password-reset link is on its way.',
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const heading =
    mode === 'signin'
      ? 'Sign in'
      : mode === 'signup'
        ? 'Create your account'
        : 'Reset your password';

  const subhead =
    mode === 'signin'
      ? 'Access every letter you’ve generated, anytime.'
      : mode === 'signup'
        ? 'Save your letters so you can re-download them whenever you need.'
        : 'We’ll email you a link to set a new password.';

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-16 sm:px-8">
      <h1
        className="text-3xl font-semibold tracking-tight text-slate-900"
        style={{ fontFamily: 'var(--font-display), ui-serif, Georgia, serif' }}
      >
        {heading}
      </h1>
      <p className="mt-2 text-sm text-slate-600">{subhead}</p>

      {linkError && !notice && (
        <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          That link has expired or was already used. Sign in below, or request a
          new password-reset link.
        </p>
      )}

      <div className="mt-7 rounded-2xl border border-[#E7E5E0] bg-white p-6 shadow-sm">
        {notice ? (
          <p className="text-sm leading-relaxed text-slate-700">{notice}</p>
        ) : (
          <div className="flex flex-col gap-4">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-slate-700">Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-[#E7E5E0] bg-[#FAFAF7] px-3.5 py-2.5 text-slate-900 outline-none transition focus:border-[#B45309] focus:bg-white focus:ring-2 focus:ring-[#B45309]/20"
              />
            </label>

            {mode !== 'forgot' && (
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-slate-700">
                  Password
                </span>
                <input
                  type="password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
                  className="w-full rounded-lg border border-[#E7E5E0] bg-[#FAFAF7] px-3.5 py-2.5 text-slate-900 outline-none transition focus:border-[#B45309] focus:bg-white focus:ring-2 focus:ring-[#B45309]/20"
                />
              </label>
            )}

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
              {busy
                ? 'Working…'
                : mode === 'signin'
                  ? 'Sign in'
                  : mode === 'signup'
                    ? 'Create account'
                    : 'Send reset link'}
            </button>

            {mode === 'signin' && (
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="self-start text-sm text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
              >
                Forgot your password?
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mode switch footer */}
      <div className="mt-6 text-center text-sm text-slate-600">
        {mode === 'signin' && (
          <>
            New here?{' '}
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className="font-medium text-[#B45309] hover:text-[#92400E]"
            >
              Create an account
            </button>
          </>
        )}
        {mode === 'signup' && (
          <>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="font-medium text-[#B45309] hover:text-[#92400E]"
            >
              Sign in
            </button>
          </>
        )}
        {mode === 'forgot' && (
          <button
            type="button"
            onClick={() => switchMode('signin')}
            className="font-medium text-[#B45309] hover:text-[#92400E]"
          >
            ← Back to sign in
          </button>
        )}
      </div>

      <p className="mt-8 text-center text-xs text-slate-400">
        Need help?{' '}
        <Link href="mailto:support@gettenantshield.com" className="underline">
          support@gettenantshield.com
        </Link>
      </p>
    </main>
  );
}

export default function AuthPage() {
  return (
    <SiteChrome>
      <Suspense
        fallback={
          <div className="flex min-h-[70vh] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[#B45309]" />
          </div>
        }
      >
        <AuthCard />
      </Suspense>
    </SiteChrome>
  );
}
