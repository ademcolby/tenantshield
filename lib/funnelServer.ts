// lib/funnelServer.ts  — SERVER ONLY (Project J v2, August 2026)
//
// The Redis side of funnel tracking: recording an event (called by
// app/api/funnel-event) and reading counters for a date range (called by the
// /admin/funnel page).
//
// STORAGE MODEL — daily counters, no raw event logs (the locked batch-10
// spec ruling):
//   funnel:count:{YYYY-MM-DD}:{eventKey}  — INCR'd once per unique session
//                                           per day. No TTL: a year of full
//                                           traffic is ~5k tiny keys.
//   funnel:seen:{YYYY-MM-DD}:{id}:{eventKey} — SETNX dedupe marker, 48h TTL
//                                           (spans the day boundary, then
//                                           self-cleans).
//   funnel:ipcap:{YYYY-MM-DD}:{ip}        — per-IP daily event cap, 48h TTL.
//
// Event keys: form_started · step_completed_1..6 · validation_blocked_1..6 ·
// review_reached · checkout_redirect · autofill_used.
//
// DAYS ARE EASTERN (America/New_York), matching every other admin surface
// (the batch-9 rule: "today" means Adem's today). The same helper produces
// the day for writes and reads, so the two can never disagree.
//
// PRIVACY: counters are anonymous aggregates. The session id appears only in
// short-lived dedupe keys (gone in 48h) and — for paying customers only — in
// the order's form_payload stamp written by the form. Non-payers leave no
// per-person record.
import { redis } from './redis';
import { FUNNEL_EVENTS, STEPPED_EVENTS, type FunnelEvent } from './funnel';

const ADMIN_TZ = 'America/New_York';
const DEDUPE_TTL_SECONDS = 60 * 60 * 48;
const IP_CAP_TTL_SECONDS = 60 * 60 * 48;
// Generous per-IP daily ceiling: a real session produces ~15 events, so 300
// allows an office NAT / family IP while making bot inflation boring.
const IP_DAILY_CAP = 300;
// Bound on the admin read: 92 days × 15 event keys ≈ 1,380 MGET keys, well
// within a single Upstash REST call.
export const MAX_RANGE_DAYS = 92;

export const WIZARD_STEP_COUNT = 6;

/** Today's YYYY-MM-DD in Eastern time ('en-CA' formats ISO-style). */
export function easternToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: ADMIN_TZ });
}

/** Shift a YYYY-MM-DD string by whole days (calendar math, TZ-free). */
export function shiftDay(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The flat counter key suffix for an event (+ step where applicable). */
function eventKey(event: FunnelEvent, step?: number): string {
  return STEPPED_EVENTS.includes(event) ? `${event}_${step}` : event;
}

/** Every counter key suffix that exists, in display order. */
function allEventKeys(): string[] {
  const keys: string[] = ['form_started'];
  for (let s = 1; s <= WIZARD_STEP_COUNT; s++) keys.push(`step_completed_${s}`);
  keys.push('review_reached', 'checkout_redirect');
  for (let s = 1; s <= WIZARD_STEP_COUNT; s++) keys.push(`validation_blocked_${s}`);
  keys.push('autofill_used');
  return keys;
}

export interface FunnelEventInput {
  id: string;
  event: FunnelEvent;
  step?: number;
  ip: string;
}

/** Validate a raw parsed body into a FunnelEventInput (null = drop it). */
export function parseFunnelEvent(raw: unknown, ip: string): FunnelEventInput | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;

  const id = typeof o.id === 'string' ? o.id.trim() : '';
  // UUIDs plus the client's non-crypto fallback shape; nothing else.
  if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) return null;

  const event = o.event;
  if (typeof event !== 'string' || !(FUNNEL_EVENTS as readonly string[]).includes(event)) {
    return null;
  }
  const ev = event as FunnelEvent;

  if (STEPPED_EVENTS.includes(ev)) {
    const step = o.step;
    if (
      typeof step !== 'number' ||
      !Number.isInteger(step) ||
      step < 1 ||
      step > WIZARD_STEP_COUNT
    ) {
      return null;
    }
    return { id, event: ev, step, ip };
  }
  return { id, event: ev, ip };
}

/**
 * Record one event: per-IP cap → per-session/day dedupe → daily counter INCR.
 * Returns quietly in every case (the API route always answers 204 — a caller
 * can never probe whether an event was counted, deduped, or dropped).
 */
export async function recordFunnelEvent(input: FunnelEventInput): Promise<void> {
  const day = easternToday();
  const key = eventKey(input.event, input.step);

  // Per-IP daily cap (bot/runaway guard). INCR then EXPIRE NX so the window
  // starts at the IP's first event of the day.
  if (input.ip) {
    const ipKey = `funnel:ipcap:${day}:${input.ip}`;
    const n = await redis.incr(ipKey);
    if (n === 1) await redis.expire(ipKey, IP_CAP_TTL_SECONDS);
    if (n > IP_DAILY_CAP) return;
  }

  // Unique-per-session-per-day dedupe: only the first arrival counts.
  const seenKey = `funnel:seen:${day}:${input.id}:${key}`;
  const first = await redis.set(seenKey, 1, { nx: true, ex: DEDUPE_TTL_SECONDS });
  if (first === null) return; // already counted today

  await redis.incr(`funnel:count:${day}:${key}`);
}

// --- Admin reads -----------------------------------------------------------

export interface FunnelCounts {
  formStarted: number;
  stepCompleted: number[]; // index 0 = step 1 … index 5 = step 6
  reviewReached: number;
  checkoutRedirect: number;
  validationBlocked: number[]; // index 0 = step 1 … index 5 = step 6
  autofillUsed: number;
  days: number; // how many days the range actually covered (after capping)
  truncated: boolean; // true if the requested range exceeded MAX_RANGE_DAYS
}

/**
 * Sum the daily counters across an inclusive Eastern-day range. Days with no
 * traffic (or pre-dating the feature) simply read zero.
 */
export async function getFunnelCounts(dayFrom: string, dayTo: string): Promise<FunnelCounts> {
  const empty: FunnelCounts = {
    formStarted: 0,
    stepCompleted: Array(WIZARD_STEP_COUNT).fill(0),
    reviewReached: 0,
    checkoutRedirect: 0,
    validationBlocked: Array(WIZARD_STEP_COUNT).fill(0),
    autofillUsed: 0,
    days: 0,
    truncated: false,
  };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayFrom) || !/^\d{4}-\d{2}-\d{2}$/.test(dayTo)) return empty;
  if (dayFrom > dayTo) return empty;

  // Enumerate the days, newest-boundary capped.
  const days: string[] = [];
  let truncated = false;
  for (let d = dayFrom; d <= dayTo; d = shiftDay(d, 1)) {
    days.push(d);
    if (days.length >= MAX_RANGE_DAYS && d < dayTo) {
      truncated = true;
      break;
    }
  }

  const suffixes = allEventKeys();
  const keys: string[] = [];
  for (const day of days) {
    for (const s of suffixes) keys.push(`funnel:count:${day}:${s}`);
  }

  let values: (number | string | null)[] = [];
  try {
    values = keys.length > 0 ? await redis.mget<(number | string | null)[]>(...keys) : [];
  } catch (err) {
    console.error('getFunnelCounts mget error:', err);
    return { ...empty, days: days.length, truncated };
  }

  const totals = new Map<string, number>();
  for (let i = 0; i < keys.length; i++) {
    const raw = values[i];
    const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? parseInt(raw, 10) : 0;
    if (!Number.isFinite(n) || n <= 0) continue;
    const suffix = suffixes[i % suffixes.length];
    totals.set(suffix, (totals.get(suffix) ?? 0) + n);
  }

  const counts: FunnelCounts = {
    formStarted: totals.get('form_started') ?? 0,
    stepCompleted: [],
    reviewReached: totals.get('review_reached') ?? 0,
    checkoutRedirect: totals.get('checkout_redirect') ?? 0,
    validationBlocked: [],
    autofillUsed: totals.get('autofill_used') ?? 0,
    days: days.length,
    truncated,
  };
  for (let s = 1; s <= WIZARD_STEP_COUNT; s++) {
    counts.stepCompleted.push(totals.get(`step_completed_${s}`) ?? 0);
    counts.validationBlocked.push(totals.get(`validation_blocked_${s}`) ?? 0);
  }
  return counts;
}
