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
  // Project D: actual amount the customer paid, in cents, from the Stripe
  // Checkout Session (session.amount_total). Optional/best-effort: older
  // callers and historical rows won't have it; metrics fall back to the flat
  // $39 price for those rows.
  amountPaidCents?: number;
}

export interface Order extends NewOrder {
  id: string;
  createdAt: string;
  userId: string | null;
  // Project D admin fields.
  adminNote: string | null;
  isTest: boolean;
  amountPaidCents?: number; // narrowed to number | undefined after mapping
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
  // Project D columns (added July 2026). Nullable in old rows; is_test was
  // backfilled to false by the ADD COLUMN ... DEFAULT false migration, but we
  // still treat null defensively.
  admin_note: string | null;
  is_test: boolean | null;
  amount_paid_cents: number | null;
}

// Project D — aggregate metrics for the /admin dashboard. All figures EXCLUDE
// test orders (is_test = true); testOrdersExcluded reports how many were
// skipped so the dashboard can disclose it.
export interface OrderMetrics {
  totalAllTime: number;
  totalLast30Days: number;
  totalLast7Days: number;
  revenueCentsAllTime: number;
  revenueCentsLast30Days: number;
  revenueCentsLast7Days: number;
  // Rows counted in revenue that pre-date amount_paid_cents and were assumed
  // to be the flat $39. Shown as a footnote when > 0.
  estimatedRevenueRows: number;
  byState: { state: string; count: number }[];
  // case_strength values plus a 'not answered' bucket for null (customers can
  // currently skip the Quick Case Check entirely — see Project I).
  byCaseStrength: { strength: string; count: number }[];
  testOrdersExcluded: number;
}

// Project D v2 — metrics for an arbitrary date range (the second section on
// the /admin metrics page). Same exclusion rules as OrderMetrics.
export interface RangeMetrics {
  orderCount: number;
  revenueCents: number;
  estimatedRevenueRows: number;
  testOrdersExcluded: number;
  byState: { state: string; count: number }[];
}

// Project D v3 — filters for the admin order list. All optional; an empty
// object means "everything". Dates are YYYY-MM-DD strings in ADMIN_TZ
// (America/New_York) and are INCLUSIVE on both ends — the UI's "today"
// preset passes the same date for both.
export interface OrderListFilters {
  search?: string; // global search: ref, email, name, state, Stripe session id
  customer?: string; // narrower: tenant name or email only
  state?: string; // case-insensitive; exact or substring (typed partials work)
  caseStrength?: string; // 'strong' | 'moderate' | 'weak' | 'not answered'
  orderType?: 'real' | 'test'; // omit for all
  dateFrom?: string; // YYYY-MM-DD in ADMIN_TZ, inclusive
  dateTo?: string; // YYYY-MM-DD in ADMIN_TZ, inclusive
}

// Project D v3 — the admin list result. Facets are Excel-style: each facet
// lists only the values present in the orders that pass all OTHER filters
// (so filtering to test-only shrinks the state list to states with test
// orders, exactly like Excel's cascading column filters).
export interface OrderListResult {
  orders: Order[]; // newest first, capped at the caller's limit
  totalMatching: number; // before the cap
  facets: {
    states: string[]; // alphabetical
    caseStrengths: string[]; // strong / moderate / weak / not answered order
  };
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
    adminNote: row.admin_note ?? null,
    isTest: row.is_test ?? false,
    amountPaidCents: row.amount_paid_cents ?? undefined,
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
    amount_paid_cents: order.amountPaidCents ?? null,
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

// --- Project D: admin dashboard ------------------------------------------

/**
 * Admin order list. Newest first. With no search term returns the most recent
 * `limit` orders (the default /admin/orders view); with a search term, matches
 * case-insensitively across ref number, email, tenant name, state, and Stripe
 * session id.
 *
 * Test orders ARE included (they are visible and badged in the admin UI; only
 * the aggregate metrics exclude them).
 */
export async function getAllOrders(options?: {
  search?: string;
  limit?: number;
}): Promise<Order[]> {
  const client = getClient();
  if (!client) return [];

  const limit = options?.limit ?? 50;
  // PostgREST .or() uses commas/parens as syntax; strip them (and %) from the
  // user-supplied term so a search string can't break the filter expression.
  const search = (options?.search ?? '').trim().replace(/[,()%]/g, '');

  let query = client
    .from('orders')
    .select()
    .order('created_at', { ascending: false })
    .limit(limit);

  if (search) {
    const s = `%${search}%`;
    query = query.or(
      `ref_number.ilike.${s},email.ilike.${s},tenant_name.ilike.${s},state.ilike.${s},stripe_session_id.ilike.${s}`,
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('getAllOrders error:', error);
    return [];
  }
  return (data as OrderRow[]).map(rowToOrder);
}

// Project D v3 — all admin-facing dates (the list's date filter and its
// rendered Date column) use Eastern time so "today" means Adem's today, not
// the server's UTC day. Rows are stored as UTC ISO timestamps; this converts
// one to its YYYY-MM-DD date string in Eastern time ('en-CA' gives ISO order).
const ADMIN_TZ = 'America/New_York';
function adminTzDateString(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: ADMIN_TZ });
}

/**
 * Project D v3 — does one order pass the filter set? `skip` omits one facet's
 * own filter so that facet's option list can be computed Excel-style (a
 * column's dropdown reflects every OTHER active filter, never its own).
 */
function orderMatchesFilters(
  order: Order,
  f: OrderListFilters,
  skip?: 'state' | 'strength',
): boolean {
  if (f.search) {
    const s = f.search.toLowerCase();
    const hay = [
      order.refNumber,
      order.email,
      order.tenantName,
      order.state,
      order.stripeSessionId,
    ]
      .join(' ')
      .toLowerCase();
    if (!hay.includes(s)) return false;
  }

  if (f.customer) {
    const c = f.customer.toLowerCase();
    if (
      !order.tenantName.toLowerCase().includes(c) &&
      !order.email.toLowerCase().includes(c)
    ) {
      return false;
    }
  }

  if (skip !== 'state' && f.state) {
    const wanted = f.state.trim().toLowerCase();
    const actual = order.state.toLowerCase();
    // Exact match (a datalist pick) or substring (a typed partial like "conn").
    if (actual !== wanted && !actual.includes(wanted)) return false;
  }

  if (skip !== 'strength' && f.caseStrength) {
    const actual = order.caseStrength ?? 'not answered';
    if (actual !== f.caseStrength) return false;
  }

  if (f.orderType === 'real' && order.isTest) return false;
  if (f.orderType === 'test' && !order.isTest) return false;

  if (f.dateFrom || f.dateTo) {
    const d = adminTzDateString(order.createdAt); // YYYY-MM-DD sorts lexically
    if (f.dateFrom && d < f.dateFrom) return false;
    if (f.dateTo && d > f.dateTo) return false;
  }

  return true;
}

/**
 * Project D v3 — the filtered admin order list with Excel-style cascading
 * facets.
 *
 * Implementation note: fetches ALL orders and filters/facets in JS — the same
 * fetch-all-and-aggregate pattern (and the same scale rationale) as
 * getOrderMetrics: at well under Supabase's 1,000-row cap this is simpler and
 * just as fast as pushing every combination into PostgREST, and it's the only
 * practical way to get cascading facets in one round trip. Revisit alongside
 * the metrics functions if volume approaches ~1,000 rows. Explicit .range()
 * like the export query so growth never silently truncates.
 */
export async function getOrdersForAdminList(
  filters: OrderListFilters,
  limit: number,
): Promise<OrderListResult> {
  const empty: OrderListResult = {
    orders: [],
    totalMatching: 0,
    facets: { states: [], caseStrengths: [] },
  };
  const client = getClient();
  if (!client) return empty;

  const { data, error } = await client
    .from('orders')
    .select()
    .order('created_at', { ascending: false })
    .range(0, 9999);

  if (error) {
    console.error('getOrdersForAdminList error:', error);
    return empty;
  }

  const all = (data as OrderRow[]).map(rowToOrder);

  const matching = all.filter((o) => orderMatchesFilters(o, filters));

  // Facets: each list comes from the orders passing all OTHER filters.
  const stateSet = new Set<string>();
  for (const o of all) {
    if (orderMatchesFilters(o, filters, 'state')) stateSet.add(o.state);
  }
  const strengthSet = new Set<string>();
  for (const o of all) {
    if (orderMatchesFilters(o, filters, 'strength')) {
      strengthSet.add(o.caseStrength ?? 'not answered');
    }
  }

  const strengthOrder = ['strong', 'moderate', 'weak', 'not answered'];
  const caseStrengths = [...strengthSet].sort((a, b) => {
    const ai = strengthOrder.indexOf(a);
    const bi = strengthOrder.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return {
    orders: matching.slice(0, limit),
    totalMatching: matching.length,
    facets: { states: [...stateSet].sort(), caseStrengths },
  };
}

/**
 * Aggregate metrics for the /admin dashboard. Excludes test orders from every
 * figure and reports how many were excluded.
 *
 * Implementation note: fetches the minimal columns for ALL orders and
 * aggregates in JS. At TenantShield's current scale (well under Supabase's
 * 1,000-row default response cap) this is simpler and just as fast as SQL
 * aggregates. Revisit (RPC / SQL views) if order volume approaches ~1,000 rows.
 *
 * Revenue: sums amount_paid_cents; rows that pre-date that column (null) are
 * assumed to be the flat $39 (3900¢) and counted in estimatedRevenueRows so
 * the dashboard can disclose the assumption.
 */
export async function getOrderMetrics(): Promise<OrderMetrics | null> {
  const client = getClient();
  if (!client) return null;

  const { data, error } = await client
    .from('orders')
    .select('created_at,state,case_strength,amount_paid_cents,is_test');

  if (error) {
    console.error('getOrderMetrics error:', error);
    return null;
  }

  const rows = data as Pick<
    OrderRow,
    'created_at' | 'state' | 'case_strength' | 'amount_paid_cents' | 'is_test'
  >[];

  const FLAT_PRICE_CENTS = 3900; // fallback for rows that pre-date amount_paid_cents
  const now = Date.now();
  const cutoff7 = now - 7 * 24 * 60 * 60 * 1000;
  const cutoff30 = now - 30 * 24 * 60 * 60 * 1000;

  const metrics: OrderMetrics = {
    totalAllTime: 0,
    totalLast30Days: 0,
    totalLast7Days: 0,
    revenueCentsAllTime: 0,
    revenueCentsLast30Days: 0,
    revenueCentsLast7Days: 0,
    estimatedRevenueRows: 0,
    byState: [],
    byCaseStrength: [],
    testOrdersExcluded: 0,
  };

  const stateCounts = new Map<string, number>();
  const strengthCounts = new Map<string, number>();

  for (const row of rows) {
    if (row.is_test === true) {
      metrics.testOrdersExcluded += 1;
      continue;
    }

    const created = new Date(row.created_at).getTime();
    let cents = row.amount_paid_cents;
    if (cents === null || cents === undefined) {
      cents = FLAT_PRICE_CENTS;
      metrics.estimatedRevenueRows += 1;
    }

    metrics.totalAllTime += 1;
    metrics.revenueCentsAllTime += cents;
    if (created >= cutoff30) {
      metrics.totalLast30Days += 1;
      metrics.revenueCentsLast30Days += cents;
    }
    if (created >= cutoff7) {
      metrics.totalLast7Days += 1;
      metrics.revenueCentsLast7Days += cents;
    }

    const state = row.state || 'Unknown';
    stateCounts.set(state, (stateCounts.get(state) ?? 0) + 1);

    const strength = row.case_strength ?? 'not answered';
    strengthCounts.set(strength, (strengthCounts.get(strength) ?? 0) + 1);
  }

  metrics.byState = [...stateCounts.entries()]
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count);

  // Fixed display order; 'not answered' last. Unknown values (future tiers)
  // append after the known ones.
  const strengthOrder = ['strong', 'moderate', 'weak', 'not answered'];
  metrics.byCaseStrength = [...strengthCounts.entries()]
    .map(([strength, count]) => ({ strength, count }))
    .sort((a, b) => {
      const ai = strengthOrder.indexOf(a.strength);
      const bi = strengthOrder.indexOf(b.strength);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

  return metrics;
}

/**
 * Project D — save the admin's note and/or test flag on an order. Only these
 * two columns are writable from the admin UI; order data itself stays
 * read-only by design (use the Supabase Table Editor as the escape hatch for
 * genuine data fixes).
 */
export async function updateOrderAdminFields(
  refNumber: string,
  fields: { adminNote?: string | null; isTest?: boolean },
): Promise<boolean> {
  const client = getClient();
  if (!client) return false;

  const update: { admin_note?: string | null; is_test?: boolean } = {};
  if ('adminNote' in fields) update.admin_note = fields.adminNote ?? null;
  if (typeof fields.isTest === 'boolean') update.is_test = fields.isTest;
  if (Object.keys(update).length === 0) return true;

  const { error } = await client
    .from('orders')
    .update(update)
    .eq('ref_number', refNumber);

  if (error) {
    console.error('updateOrderAdminFields error:', error);
    return false;
  }
  return true;
}

/**
 * Project D v3 — bulk-set the test flag on many orders at once (the order
 * list's checkbox selection). Same writable-columns rule as
 * updateOrderAdminFields: is_test is one of the only two admin-writable
 * fields. Returns the number of rows actually updated (which the banner
 * reports), or -1 on error so callers can distinguish "0 matched" from
 * "the write failed".
 */
export async function bulkUpdateIsTest(
  refNumbers: string[],
  isTest: boolean,
): Promise<number> {
  if (refNumbers.length === 0) return 0;
  const client = getClient();
  if (!client) return -1;

  const { data, error } = await client
    .from('orders')
    .update({ is_test: isTest })
    .in('ref_number', refNumbers)
    .select('ref_number');

  if (error) {
    console.error('bulkUpdateIsTest error:', error);
    return -1;
  }
  return (data ?? []).length;
}

/**
 * Project D v2 — metrics for an arbitrary date range. startIso/endIso are ISO
 * timestamps; either may be null (open-ended). start is inclusive, end is
 * EXCLUSIVE (callers pass "day after the last day" for inclusive-day ranges).
 * Same aggregation approach and test-order exclusion as getOrderMetrics.
 */
export async function getMetricsForRange(
  startIso: string | null,
  endIso: string | null,
): Promise<RangeMetrics | null> {
  const client = getClient();
  if (!client) return null;

  const { data, error } = await client
    .from('orders')
    .select('created_at,state,amount_paid_cents,is_test');

  if (error) {
    console.error('getMetricsForRange error:', error);
    return null;
  }

  const rows = data as Pick<
    OrderRow,
    'created_at' | 'state' | 'amount_paid_cents' | 'is_test'
  >[];

  const FLAT_PRICE_CENTS = 3900;
  const startMs = startIso ? new Date(startIso).getTime() : null;
  const endMs = endIso ? new Date(endIso).getTime() : null;

  const metrics: RangeMetrics = {
    orderCount: 0,
    revenueCents: 0,
    estimatedRevenueRows: 0,
    testOrdersExcluded: 0,
    byState: [],
  };
  const stateCounts = new Map<string, number>();

  for (const row of rows) {
    const created = new Date(row.created_at).getTime();
    if (startMs !== null && created < startMs) continue;
    if (endMs !== null && created >= endMs) continue;

    if (row.is_test === true) {
      metrics.testOrdersExcluded += 1;
      continue;
    }

    let cents = row.amount_paid_cents;
    if (cents === null || cents === undefined) {
      cents = FLAT_PRICE_CENTS;
      metrics.estimatedRevenueRows += 1;
    }

    metrics.orderCount += 1;
    metrics.revenueCents += cents;

    const state = row.state || 'Unknown';
    stateCounts.set(state, (stateCounts.get(state) ?? 0) + 1);
  }

  metrics.byState = [...stateCounts.entries()]
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count);

  return metrics;
}

/**
 * Project D v2 — the CSV export query. ALL orders, newest first, including
 * test orders (is_test is an explicit CSV column so Adem can filter in
 * Excel). Explicit .range() because Supabase caps un-ranged responses at
 * 1,000 rows; revisit with pagination if volume ever approaches 10k.
 */
export async function getAllOrdersForExport(): Promise<Order[]> {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from('orders')
    .select()
    .order('created_at', { ascending: false })
    .range(0, 9999);

  if (error) {
    console.error('getAllOrdersForExport error:', error);
    return [];
  }
  return (data as OrderRow[]).map(rowToOrder);
}

/**
 * Project D v2 — admin regeneration write. Overwrites letter_text and appends
 * the regeneration note line to admin_note in a single update. The caller is
 * responsible for ONLY calling this with a real letter (never a
 * missing_info/out_of_scope signal — those must not overwrite anything).
 */
export async function regenerateOrderLetter(
  refNumber: string,
  newLetterText: string,
  noteLine: string,
): Promise<boolean> {
  const client = getClient();
  if (!client) return false;

  const existing = await getOrderByRef(refNumber);
  if (!existing) {
    console.error('regenerateOrderLetter: no order for ref', refNumber);
    return false;
  }

  const combinedNote = existing.adminNote
    ? `${existing.adminNote}\n${noteLine}`
    : noteLine;

  const { error } = await client
    .from('orders')
    .update({ letter_text: newLetterText, admin_note: combinedNote })
    .eq('ref_number', refNumber);

  if (error) {
    console.error('regenerateOrderLetter error:', error);
    return false;
  }
  return true;
}

// --- Project J v2: funnel page order stats ---------------------------------

// Paid-order figures for the /admin/funnel page's bottom rows: how many real
// orders landed in the (Eastern) day range, and the autofill-vs-manual split
// read from the form_payload.funnel stamp the form writes at checkout.
export interface FunnelOrderStats {
  paidOrders: number; // real (non-test) orders in range
  withFunnelStamp: number; // of those, orders carrying a funnel stamp
  autofillUsed: number; // stamped orders where a Places suggestion was used
  manualEntry: number; // stamped orders typed entirely by hand
  testOrdersExcluded: number;
}

/**
 * Project J v2 — paid orders + autofill split for an inclusive Eastern-day
 * range (same day vocabulary as the funnel counters and the order list's
 * date filter, via the shared adminTzDateString helper — the funnel page's
 * Redis rows and Supabase rows can never disagree about what "today" means).
 *
 * Implementation note: fetch-and-filter-in-JS like getOrderMetrics /
 * getOrdersForAdminList — same scale rationale, same ~1,000-row revisit note.
 * Orders that pre-date J v2 simply have no funnel stamp and are counted in
 * paidOrders but not in the split.
 */
export async function getFunnelOrderStats(
  dayFrom: string,
  dayTo: string,
): Promise<FunnelOrderStats> {
  const stats: FunnelOrderStats = {
    paidOrders: 0,
    withFunnelStamp: 0,
    autofillUsed: 0,
    manualEntry: 0,
    testOrdersExcluded: 0,
  };
  const client = getClient();
  if (!client) return stats;

  const { data, error } = await client
    .from('orders')
    .select('created_at,is_test,form_payload')
    .range(0, 9999);

  if (error) {
    console.error('getFunnelOrderStats error:', error);
    return stats;
  }

  const rows = data as Pick<OrderRow, 'created_at' | 'is_test' | 'form_payload'>[];

  for (const row of rows) {
    const day = adminTzDateString(row.created_at);
    if (day < dayFrom || day > dayTo) continue;

    if (row.is_test === true) {
      stats.testOrdersExcluded += 1;
      continue;
    }
    stats.paidOrders += 1;

    // The stamp the form writes at payload build: { sessionId, autofillUsed }.
    const funnel = (row.form_payload as { funnel?: unknown } | null)?.funnel;
    if (typeof funnel === 'object' && funnel !== null) {
      stats.withFunnelStamp += 1;
      if ((funnel as { autofillUsed?: unknown }).autofillUsed === true) {
        stats.autofillUsed += 1;
      } else {
        stats.manualEntry += 1;
      }
    }
  }

  return stats;
}
