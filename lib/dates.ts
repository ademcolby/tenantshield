/**
 * Date helper for TenantShield letter generation.
 *
 * WHY THIS EXISTS (audit finding P1):
 * Calendar arithmetic ("March 1 + 60 days = ?", "today + 14 days = ?",
 * "today − vacate date = ? days") is a known weak spot for language models.
 * Rather than trusting the model to count days, the app computes every date
 * the letter could need and injects them as ready-to-use calendar dates. The
 * model then only has to LOOK UP the right one based on the statutory rule in
 * the system prompt — never calculate it.
 *
 * The system prompt knows which interval applies to which state (e.g., Alabama
 * = 60 days, New York = 14 days, Connecticut = later of 30-day / 15-day-from-
 * forwarding). We pre-compute the calendar date at every standard interval from
 * the vacate date, plus the forwarding-address-based intervals, so the model
 * can match the rule to a pre-computed date.
 *
 * All math is done in UTC against date-only values to avoid timezone drift
 * (a subtle off-by-one that the previous toLocaleDateString() call could hit
 * for US users, e.g. "2026-03-01" rendering as "February 28").
 */

// Standard statutory return intervals that appear across the 51 jurisdictions.
const STANDARD_INTERVALS_DAYS = [14, 15, 20, 21, 30, 31, 45, 60];

// Forwarding-address-based intervals used by conditional "later of" states
// (e.g., Connecticut/Wyoming use 15 days from forwarding address).
const FORWARDING_INTERVALS_DAYS = [14, 15, 30];

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
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function diffDays(later: Date, earlier: Date): number {
  const ms = later.getTime() - earlier.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function formatLongDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export interface ComputedDates {
  letterDate: string;
  responseDeadlineDate: string;
  responseWindowDays: number;
  vacatedDateFormatted: string | null;
  daysSinceVacated: number | null;
  forwardingAddressDateFormatted: string | null;
  /** "N days after move-out → <calendar date>" for each standard interval. */
  deadlineFromVacated: { days: number; date: string }[];
  /** "N days after forwarding address → <calendar date>", if a date was given. */
  deadlineFromForwarding: { days: number; date: string }[] | null;
}

export function computeDates(
  vacatedDate: string,
  forwardingAddressDate: string,
  responseWindowDays: number = DEFAULT_RESPONSE_WINDOW_DAYS
): ComputedDates {
  const today = todayUTC();
  const vacated = parseInputDate(vacatedDate);
  const forwarding = parseInputDate(forwardingAddressDate);

  const deadlineFromVacated = vacated
    ? STANDARD_INTERVALS_DAYS.map((days) => ({
        days,
        date: formatLongDate(addDays(vacated, days)),
      }))
    : [];

  const deadlineFromForwarding = forwarding
    ? FORWARDING_INTERVALS_DAYS.map((days) => ({
        days,
        date: formatLongDate(addDays(forwarding, days)),
      }))
    : null;

  return {
    letterDate: formatLongDate(today),
    responseDeadlineDate: formatLongDate(addDays(today, responseWindowDays)),
    responseWindowDays,
    vacatedDateFormatted: vacated ? formatLongDate(vacated) : null,
    daysSinceVacated: vacated ? diffDays(today, vacated) : null,
    forwardingAddressDateFormatted: forwarding ? formatLongDate(forwarding) : null,
    deadlineFromVacated,
    deadlineFromForwarding,
  };
}

/**
 * Render the computed dates as a labeled block for the user message. The
 * wording is deliberately emphatic that these are authoritative and must not
 * be recalculated.
 */
export function renderComputedDatesBlock(d: ComputedDates): string {
  const lines: string[] = [];
  lines.push('PRE-CALCULATED DATES (authoritative — use these exact calendar dates verbatim; do NOT recompute any date yourself):');
  lines.push(`- Today / letter date: ${d.letterDate}`);
  lines.push(
    `- Response deadline to state in the letter (${d.responseWindowDays} days from today): ${d.responseDeadlineDate}`
  );
  if (d.vacatedDateFormatted) {
    lines.push(`- Move-out date: ${d.vacatedDateFormatted}`);
  }
  if (d.daysSinceVacated !== null) {
    lines.push(`- Days elapsed since move-out (as of today): ${d.daysSinceVacated}`);
  }
  if (d.forwardingAddressDateFormatted) {
    lines.push(`- Forwarding-address date: ${d.forwardingAddressDateFormatted}`);
  }
  if (d.deadlineFromVacated.length) {
    lines.push('- Statutory-deadline candidates measured from the MOVE-OUT date (pick the one matching this state\u2019s rule in the system prompt):');
    for (const x of d.deadlineFromVacated) {
      lines.push(`    \u2022 ${x.days} days after move-out = ${x.date}`);
    }
  }
  if (d.deadlineFromForwarding) {
    lines.push('- Statutory-deadline candidates measured from the FORWARDING-ADDRESS date (for "later of" states, compare against the move-out candidate and use whichever is later):');
    for (const x of d.deadlineFromForwarding) {
      lines.push(`    \u2022 ${x.days} days after forwarding address = ${x.date}`);
    }
  }
  return lines.join('\n');
}
