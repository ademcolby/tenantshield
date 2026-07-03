// lib/adminEmail.ts  — SHARED (safe for both client and server imports)
//
// The single hardcoded admin identity for TenantShield (Project D). This is a
// deliberate v1 simplification: one founder, one admin. If a second admin is
// ever needed, replace this with an is_admin flag on auth.users and update
// lib/adminAuth.ts + app/components/SiteChrome.tsx (the only two consumers).
//
// This file must contain NOTHING secret — it is imported by SiteChrome.tsx
// ('use client') and therefore ships to the browser. An email address in the
// bundle is fine; keys/tokens would not be.

export const ADMIN_EMAIL = 'adem.colby@gmail.com';

/** Case-insensitive check used by both the server gate and the client nav. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}
