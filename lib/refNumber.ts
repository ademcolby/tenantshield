// lib/refNumber.ts
//
// Generates a customer-facing order reference number in the format
// TS-YYYYMMDD-XXXX, where:
//   - YYYYMMDD is the UTC date of generation, and
//   - XXXX is 4 random uppercase alphanumeric characters (A–Z, 0–9).
//
// The number is generated at checkout (create-checkout-session), stored in
// Stripe session metadata so it survives the Redis TTL, persisted in the
// Supabase orders table, shown on the success page, and included in the receipt
// email. It is NEVER printed on the landlord-facing PDF letter.
//
// At TenantShield's scale the random suffix gives a collision probability low
// enough to ignore (36^4 = 1,679,616 combinations per day). If volume ever
// makes collisions a real concern, callers can verify uniqueness against the DB
// and retry — the function is pure and side-effect-free so that's trivial to
// layer on top.

// Excludes nothing — full Crockford-style set is unnecessary here; we keep the
// full A–Z0–9 alphabet because the number is system-generated and surfaced for
// reference/lookup, not hand-transcribed under pressure.
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function randomSuffix(len: number): string {
  let out = '';
  for (let i = 0; i < len; i++) {
    out += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  }
  return out;
}

export function generateRefNumber(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `TS-${y}${m}${d}-${randomSuffix(4)}`;
}
