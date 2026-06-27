// lib/supabaseServer.ts  — SERVER ONLY (Project E)
//
// The cookie-bound Supabase client used by server components, route handlers,
// and middleware to read the *currently logged-in user's* session. This is the
// auth-aware counterpart to lib/db.ts:
//
//   - lib/db.ts            uses the SERVICE-ROLE key, bypasses RLS, never sees a
//                          user session. It is the data layer (orders).
//   - lib/supabaseServer.ts uses the PUBLIC ANON key + the request cookies. It
//                          only ever knows who the caller is. It does NOT read
//                          order data.
//
// The split is deliberate: order reads stay behind the service-role layer and
// are gated by the *verified* email we get from this client's getUser(). The
// anon key here is safe to expose (it is NEXT_PUBLIC_*); all it can do is act
// as the signed-in user, never as an admin.
//
// next/headers makes this module server-only — importing it from a 'use client'
// file is a build error, which is the guard we want.
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseServerClient() {
  // Next.js 15: cookies() is async.
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll was called from a Server Component, where cookies are
            // read-only. This is safe to ignore because middleware.ts refreshes
            // the session cookie on every navigation. (Standard @supabase/ssr
            // pattern.)
          }
        },
      },
    },
  );
}
