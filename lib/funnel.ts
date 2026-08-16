// lib/funnel.ts  — CLIENT ONLY (Project J v2, August 2026)
//
// Step-level funnel instrumentation for the intake form wizard. Fires small
// anonymous events (form started, step completed, validation blocked, review
// reached, checkout redirect, autofill used) to /api/funnel-event, where they
// become DAILY COUNTERS in Redis — no per-visitor trails are ever stored for
// people who don't buy. The admin /admin/funnel page reads the counters.
//
// DESIGN (mirrors lib/attribution.ts):
//   - ANONYMOUS SESSION ID: a random UUID in localStorage (ts_funnel_id). No
//     PII. Its only jobs are (a) server-side dedupe — counters read as UNIQUE
//     sessions per day — and (b) the order linkage: the form stamps
//     { sessionId, autofillUsed } into the payload at checkout (rider pattern,
//     same as attribution; buildUserMessage() reads only named fields, so it
//     can never reach the prompt or the letter).
//   - FIRE-AND-FORGET: navigator.sendBeacon first (survives the Stripe
//     redirect), keepalive fetch as fallback. No response is read; failures
//     are silent. Tracking must NEVER block or break the form.
//   - CLIENT DEDUPE is best-effort (an in-memory Set per page load); the
//     SERVER dedupe (per session+event+day, Redis SETNX) is authoritative.
//   - ORDERING: form_started is auto-sent before any other event if it hasn't
//     fired yet, so a session can never show a completed step without a start.
//   - Everything is wrapped in try/catch: localStorage can throw in private
//     browsing, sendBeacon may not exist. Failure mode is "no funnel data".
//
// CONSUMERS:
//   - SecurityDepositForm.tsx calls trackFunnelEvent() at the wizard's step
//     transitions and getFunnelId() at payload build.
//   - app/api/funnel-event/route.ts imports FUNNEL_EVENTS / STEPPED_EVENTS to
//     validate incoming events against the same list (server-safe: this
//     module touches window/localStorage only inside functions).

const FUNNEL_ID_KEY = 'ts_funnel_id';

// The complete event vocabulary. The API route validates against this list —
// add here first, then handle the new event's key shape in lib/funnelServer.
export const FUNNEL_EVENTS = [
  'form_started',
  'step_completed',
  'validation_blocked',
  'review_reached',
  'checkout_redirect',
  'autofill_used',
] as const;

export type FunnelEvent = (typeof FUNNEL_EVENTS)[number];

// Events that carry a 1-based wizard step number.
export const STEPPED_EVENTS: FunnelEvent[] = ['step_completed', 'validation_blocked'];

function newFunnelId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
}

/**
 * The anonymous funnel session id (created on first use, then stable).
 * Returns undefined when storage is unavailable — callers must treat the
 * whole feature as absent in that case (JSON.stringify drops undefined keys,
 * so old payload shapes stay byte-identical).
 */
export function getFunnelId(): string | undefined {
  try {
    if (typeof window === 'undefined') return undefined;
    let id = localStorage.getItem(FUNNEL_ID_KEY);
    if (!id) {
      id = newFunnelId();
      localStorage.setItem(FUNNEL_ID_KEY, id);
    }
    return id;
  } catch {
    return undefined;
  }
}

// Per-page-load dedupe so obvious repeats (re-entering runSubmit from the
// review screen, going back and re-completing a step) don't even hit the
// network. The server's per-day dedupe remains the source of truth.
const sentThisLoad = new Set<string>();

function send(event: FunnelEvent, step?: number): void {
  const id = getFunnelId();
  if (!id) return; // storage blocked — feature silently absent

  const body = JSON.stringify(step !== undefined ? { id, event, step } : { id, event });
  const url = '/api/funnel-event';
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      // Blob with an explicit content type so the route can req.json() it.
      const ok = navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
      if (ok) return;
    }
  } catch {
    // fall through to fetch
  }
  try {
    void fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true, // survives navigation if sendBeacon was unavailable
    }).catch(() => undefined);
  } catch {
    // tracking must never throw
  }
}

/**
 * Record a funnel event (fire-and-forget). `step` is the 1-based wizard step
 * and is required for step_completed / validation_blocked, ignored otherwise.
 */
export function trackFunnelEvent(event: FunnelEvent, step?: number): void {
  try {
    if (typeof window === 'undefined') return;

    // Ordering guarantee: nothing precedes form_started.
    if (event !== 'form_started' && !sentThisLoad.has('form_started')) {
      sentThisLoad.add('form_started');
      send('form_started');
    }

    const key = STEPPED_EVENTS.includes(event) && step !== undefined ? `${event}:${step}` : event;
    if (sentThisLoad.has(key)) return;
    sentThisLoad.add(key);

    send(event, STEPPED_EVENTS.includes(event) ? step : undefined);
  } catch {
    // never let tracking break the form
  }
}
