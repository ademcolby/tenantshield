// app/auth/confirm/route.ts  — Project E
//
// The single landing point for every Supabase auth email link:
//   - sign-up confirmation  -> redirects to /dashboard
//   - password recovery     -> redirects to /auth/reset
//
// Handles BOTH email-link formats so it works no matter how the Supabase email
// templates are configured:
//   - PKCE flow:        ?code=...                 -> exchangeCodeForSession
//   - OTP/token flow:   ?token_hash=...&type=...  -> verifyOtp
// In both cases the result is a real session cookie, after which the user is
// authenticated and we send them on.
//
// Register https://gettenantshield.com/auth/confirm (and the localhost variant)
// in Supabase -> Authentication -> URL Configuration -> Redirect URLs, or the
// links will be rejected.
import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '../../../lib/supabaseServer';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  // Recovery links go to the set-new-password screen; everything else to the
  // dashboard. An explicit ?next= wins if present.
  const next =
    searchParams.get('next') ??
    (type === 'recovery' ? '/auth/reset' : '/dashboard');

  const supabase = await createSupabaseServerClient();

  // 1) PKCE flow.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // 2) OTP / token-hash flow.
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as
        | 'signup'
        | 'recovery'
        | 'invite'
        | 'magiclink'
        | 'email_change'
        | 'email',
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // No usable token, or the link expired / was already used.
  return NextResponse.redirect(new URL('/auth?error=link', origin));
}
