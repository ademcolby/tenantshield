// middleware.ts  (repo ROOT, next to package.json) — Project E
//
// Refreshes the Supabase auth session on every page navigation. Without this,
// an expired access token is never silently refreshed and customers appear to
// get "randomly logged out" between page loads. This is the standard
// @supabase/ssr middleware and is effectively required, not optional.
//
// NOTE: /api/* is intentionally EXCLUDED from the matcher. API routes (the
// Stripe webhook, generate-letter, create-checkout-session) read their own raw
// bodies and manage their own auth; running session-refresh middleware on them
// is unnecessary and we keep it well clear of the webhook's raw-body signature
// verification.
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Touching getUser() is what triggers the token refresh + cookie rewrite.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Run on everything EXCEPT api routes, Next internals, and static assets.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
