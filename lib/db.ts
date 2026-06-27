// lib/db.ts  — SERVER ONLY (uses SUPABASE_SERVICE_ROLE_KEY)
//
// The single data-access layer for TenantShield. EVERY Supabase read/write goes
// through the functions exported here — the rest of the app never imports
// @supabase/supabase-js directly. This keeps the data layer in one place, makes
// it testable, and means Project E's auth layer can be wired in here without
// touching any route code.
//
// SECURITY: this module uses the service-role key, which bypasses Row Level
// Security. It must NEVER be imported from a 'use client' file or shipped to the
// browser. It is only ever called from server routes (API handlers, the Stripe
// webhook).
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- Types ---------------------------------------------------------------

export interface NewOrder {
  refNumber: string;
  stripeSessionId: string;
  email: string;
  tenantName: string;
  state: string;
  city: string;
  depositAmount: number;
  vacatedDate: string; // ISO date string (YYYY-MM-DD)
  formPayload: Record<string, unknown>;
  letterText: string;
  caseStrength?: string;
}

export interface Order extends NewOrder {
  id: string;
  createdAt: string;
  userId: string | null;
}

// Shape of a row as stored in Postgres (snake_case columns).
interface OrderRow {
  id: string;
  ref_number: string;
  stripe_session_id: string;
  email: string;
  tenant_name: string;
  state: string;
  city: string;
  deposit_amount: number | string; // numeric may come back as string
  vacated_date: string;
  form_payload: Record<string, unknown>;
  letter_text: string;
  case_strength: string | null;
  created_at: string;
  user_id: string | null;
}

// --- Client (lazy singleton) --------------------------------------------

// Instantiate lazily and guarded so a missing env var never throws at
// import/build time. If the client can't be created, the read helpers return
// null/[] and saveOrder throws a clear error (callers treat persistence as
// best-effort and log, exactly like the email step).
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — DB calls are no-ops.');
    return null;
  }
  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}

// --- Mapping -------------------------------------------------------------

function rowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    refNumber: row.ref_number,
    stripeSessionId: row.stripe_session_id,
    email: row.email,
    tenantName: row.tenant_name,
    state: row.state,
    city: row.city,
    depositAmount:
      typeof row.deposit_amount === 'string'
        ? parseFloat(row.deposit_amount)
        : row.deposit_amount,
    vacatedDate: row.vacated_date,
    formPayload: row.form_payload,
    letterText: row.letter_text,
    caseStrength: row.case_strength ?? undefined,
    createdAt: row.created_at,
    userId: row.user_id,
  };
}

// --- Public API ----------------------------------------------------------

/**
 * Persists a new order. Idempotent at the DB level via the unique constraint on
 * stripe_session_id: if a row for this session already exists (e.g. the success
 * page and the Stripe webhook both fire), the insert is treated as a no-op and
 * the existing row is returned, so we never create duplicate orders for one
 * payment.
 */
export async function saveOrder(order: NewOrder): Promise<Order | null> {
  const client = getClient();
  if (!client) return null;

  const insertRow = {
    ref_number: order.refNumber,
    stripe_session_id: order.stripeSessionId,
    email: order.email,
    tenant_name: order.tenantName,
    state: order.state,
    city: order.city,
    deposit_amount: order.depositAmount,
    vacated_date: order.vacatedDate,
    form_payload: order.formPayload,
    letter_text: order.letterText,
    case_strength: order.caseStrength ?? null,
  };

  const { data, error } = await client
    .from('orders')
    .insert(insertRow)
    .select()
    .single();

  if (error) {
    // 23505 = unique_violation. A row for this paid session already exists,
    // which is the expected race between the success page and the webhook.
    // Return the existing row instead of failing.
    if (error.code === '23505') {
      const existing = await getOrderBySession(order.stripeSessionId);
      if (existing) return existing;
    }
    console.error('saveOrder error:', error);
    return null;
  }

  return rowToOrder(data as OrderRow);
}

export async function getOrderByRef(refNumber: string): Promise<Order | null> {
  const client = getClient();
  if (!client) return null;

  const { data, error } = await client
    .from('orders')
    .select()
    .eq('ref_number', refNumber)
    .maybeSingle();

  if (error) {
    console.error('getOrderByRef error:', error);
    return null;
  }
  return data ? rowToOrder(data as OrderRow) : null;
}

export async function getOrderBySession(stripeSessionId: string): Promise<Order | null> {
  const client = getClient();
  if (!client) return null;

  const { data, error } = await client
    .from('orders')
    .select()
    .eq('stripe_session_id', stripeSessionId)
    .maybeSingle();

  if (error) {
    console.error('getOrderBySession error:', error);
    return null;
  }
  return data ? rowToOrder(data as OrderRow) : null;
}

export async function getOrdersByEmail(email: string): Promise<Order[]> {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from('orders')
    .select()
    .eq('email', email)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getOrdersByEmail error:', error);
    return [];
  }
  return (data as OrderRow[]).map(rowToOrder);
}

/**
 * Project E — retroactive linking. When a customer creates/confirms an account,
 * attach their user_id to every past order placed with that same email (the
 * orders created before the account existed). Idempotent: only updates rows
 * whose user_id is still NULL, so re-running on every dashboard load is cheap
 * and safe. The dashboard reads by email regardless, so this is bookkeeping for
 * the eventual admin dashboard (Project D) — not required for the read path.
 *
 * Best-effort: a failure here never blocks the dashboard from rendering.
 */
export async function linkOrdersToUser(email: string, userId: string): Promise<void> {
  const client = getClient();
  if (!client) return;

  const { error } = await client
    .from('orders')
    .update({ user_id: userId })
    .eq('email', email)
    .is('user_id', null);

  if (error) {
    console.error('linkOrdersToUser error:', error);
  }
}
