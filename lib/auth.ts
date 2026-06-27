// lib/auth.ts  — CLIENT ONLY (Project E)
//
// Thin browser-side auth surface. Everything the UI needs to sign a customer in
// or out goes through here so no component talks to @supabase/ssr directly.
//
// Uses the PUBLIC anon key (NEXT_PUBLIC_*) and stores the session in cookies via
// @supabase/ssr's browser client, so the server (middleware, server components,
// the /auth/confirm route) can read the same session. The browser client also
// writes the PKCE code-verifier cookie that /auth/confirm reads when it
// exchanges the email-link code for a session.
'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Session } from '@supabase/supabase-js';

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient(): ReturnType<typeof createBrowserClient> {
  if (_client) return _client;
  _client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return _client;
}

function siteOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'https://gettenantshield.com';
}

export interface AuthResult {
  ok: boolean;
  // For sign-up: true when Supabase requires an email confirmation click before
  // the session is active (the default, and what we rely on for security).
  needsEmailConfirm?: boolean;
  error?: string;
}

/**
 * Create an account. With "Confirm email" ON (required for TenantShield — see
 * the dashboard data-scoping note), no session is returned until the customer
 * clicks the confirmation link, which lands on /auth/confirm.
 */
export async function signUp(email: string, password: string): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo: `${siteOrigin()}/auth/confirm` },
  });
  if (error) return { ok: false, error: error.message };
  // When confirmation is required, Supabase returns a user but no session.
  const needsEmailConfirm = !data.session;
  return { ok: true, needsEmailConfirm };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Send a password-reset email. The link lands on /auth/confirm with
 * ?next=/auth/reset, where the code is exchanged for a short-lived recovery
 * session and the customer sets a new password.
 */
export async function sendPasswordReset(email: string): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${siteOrigin()}/auth/confirm?next=/auth/reset`,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Set a new password for the currently-authenticated (or recovery) session. */
export async function updatePassword(newPassword: string): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
