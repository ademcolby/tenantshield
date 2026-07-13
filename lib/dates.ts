/**
 * Date helper for TenantShield letter generation.
 *
 * WHY THIS EXISTS (audit finding P1):
 * Calendar arithmetic is a known weak spot for language models. The app
 * computes every date the letter needs and injects them as ready-to-use
 * calendar dates the model must use verbatim.
 *
 * REV 2 (July 12, 2026 — Legal Audit rev. 2, "the letter/site split"):
 * The letter NEVER asserts a statutory deadline, a statutory interval, or a
 * missed date — in ANY jurisdiction. Its argument is forfeiture + never
 * ("you never sent the required notice"), and the only clock it references
 * is the one it creates itself: a response deadline measured from the letter
 * date. Accordingly, ALL statutory-deadline candidate math
 * (deadlineFromVacated / businessDays / deadlineFromForwarding and the
 * STANDARD_INTERVALS tables) has been REMOVED. Do not reintroduce it.
 *
 * The dates that remain are recital facts (move-out, forwarding-address,
 * days elapsed) and the letter's own response deadline.
 *
 * All math is done in UTC against date-only values to avoid timezone drift
 * (a subtle off-by-one that toLocaleDateString() could hit for US users,
 * e.g. "2026-03-01" rendering as "February 28").
 */

// Default demand window the tenant gives the landlord to respond.
export const DEFAULT_RESPONSE_WINDOW_DAYS = 14;

function parseInputDate(value: string): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (m) {
    return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  }
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function todayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function diffDays(later: Date, earlier: Date): number {
  return Math.round((later.getTime() - earlier.getTime()) / 86400000);
}

/** UTC-safe long-form date, e.g. "March 1, 2026". */
export function formatLongDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Parse a YYYY-MM-DD string as a UTC date (exported for optional inputs). */
export function parseYmdUTC(value: string): Date | null {
  return parseInputDate(value);
}

export interface ComputedDates {
  letterDate: string;
  responseDeadlineDate: string;
  responseWindowDays: number;
  vacatedDateFormatted: string | null;
  daysSinceVacated: number | null;
  forwardingAddressDateFormatted: string | null;
}

export function computeDates(
  vacatedDate: string,
  forwardingAddressDate: string,
  responseWindowDays: number = DEFAULT_RESPONSE_WINDOW_DAYS
): ComputedDates {
  const today = todayUTC();
  const vacated = parseInputDate(vacatedDate);
  const forwarding = parseInputDate(forwardingAddressDate);

  return {
    letterDate: formatLongDate(today),
    responseDeadlineDate: formatLongDate(addDays(today, responseWindowDays)),
    responseWindowDays,
    vacatedDateFormatted: vacated ? formatLongDate(vacated) : null,
    daysSinceVacated: vacated ? diffDays(today, vacated) : null,
    forwardingAddressDateFormatted: forwarding ? formatLongDate(forwarding) : null,
  };
}

/**
 * Render the computed dates as a labeled block for the user message.
 * REV 2: contains NO statutory-deadline candidates. The only deadline the
 * model ever sees is the letter's own response deadline.
 */
export function renderComputedDatesBlock(d: ComputedDates): string {
  const lines: string[] = [];
  lines.push(
    'PRE-CALCULATED DATES (authoritative — use these exact calendar dates verbatim; do NOT compute, count, or derive any other date):'
  );
  lines.push(`- Today / letter date: ${d.letterDate}`);
  lines.push(
    `- Response deadline to state in the letter (${d.responseWindowDays} days from today): ${d.responseDeadlineDate}`
  );
  if (d.vacatedDateFormatted) {
    lines.push(`- Move-out date (recital fact only): ${d.vacatedDateFormatted}`);
  }
  if (d.daysSinceVacated !== null) {
    lines.push(`- Days elapsed since move-out (as of today): ${d.daysSinceVacated}`);
  }
  if (d.forwardingAddressDateFormatted) {
    lines.push(`- Forwarding-address date (recital fact only): ${d.forwardingAddressDateFormatted}`);
  }
  lines.push(
    '- There are NO statutory-deadline dates in this block, by design. The letter must not assert one.'
  );
  return lines.join('\n');
}
