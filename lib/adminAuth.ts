// lib/adminAuth.ts  — SERVER ONLY (Project D)
//
// The /admin route gate. Every server component and server action under
// app/admin/** must call requireAdmin() before doing anything else.
//
// How it works: reads the caller's session via the cookie-bound anon client
// (lib/supabaseServer.ts) and compares the VERIFIED email against ADMIN_EMAIL.
// Anyone else — signed out, or signed in as a customer — is redirected to the
// home page. We deliberately redirect rather than render a 403 so /admin's
// existence isn't advertised to non-admins.
//
// getUser() (not getSession()) is used on purpose: getUser() revalidates the
// JWT against Supabase's auth server, so a tampered cookie can't spoof the
// admin email. This is the same reason middleware.ts touches getUser().
//
// NOTE: this gates the ROUTE, not the data. Order data access continues to go
// through lib/db.ts (service-role) exactly as before; this module just decides
// who may reach the pages that call it.
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from './supabaseServer';
import { isAdminEmail } from './adminEmail';

/**
 * Redirects to '/' unless the current session belongs to the admin.
 * Returns the admin's email on success (handy for "signed in as" display).
 */
export async function requireAdmin(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  const email = data.user?.email ?? null;
  if (error || !isAdminEmail(email)) {
    redirect('/');
  }

  // isAdminEmail(null) is false, so email is non-null here.
  return email as string;
}
