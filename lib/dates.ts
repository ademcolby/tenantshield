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
// NOTE: 10 days added for Montana's no-deduction branch (§ 70-25-202(2)(b));
// without it the model falls back to relative-phrasing for that deadline.
const STANDARD_INTERVALS_DAYS = [10, 14, 15, 20, 21, 30, 31, 45, 60];

// Forwarding-address-based intervals used by conditional "later of" states
// (e.g., Connecticut/Wyoming use 15 days from forwarding address;
//  Rhode Island's 20-day clock runs from the later of termination/possession/forwarding).
const FORWARDING_INTERVALS_DAYS = [14, 15, 20, 30];

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

// --- P32: business-day support (Arizona's 14-business-day deadline, ARS § 33-1321) ---
// Business days exclude Saturdays, Sundays, and U.S. federal holidays (observed).
// We use the federal holiday set as the standard exclusion list.

function isoYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function nthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): Date {
  // month 0-indexed; weekday 0=Sun..6=Sat; n = 1..5
  const first = new Date(Date.UTC(year, month, 1));
  const firstDow = first.getUTCDay();
  const day = 1 + ((weekday - firstDow + 7) % 7) + (n - 1) * 7;
  return new Date(Date.UTC(year, month, day));
}

function lastWeekdayOfMonth(year: number, month: number, weekday: number): Date {
  const last = new Date(Date.UTC(year, month + 1, 0));
  const lastDow = last.getUTCDay();
  const day = last.getUTCDate() - ((lastDow - weekday + 7) % 7);
  return new Date(Date.UTC(year, month, day));
}

function observedFixed(year: number, month: number, day: number): Date {
  const d = new Date(Date.UTC(year, month, day));
  const dow = d.getUTCDay();
  if (dow === 6) return new Date(Date.UTC(year, month, day - 1)); // Sat -> observed Fri
  if (dow === 0) return new Date(Date.UTC(year, month, day + 1)); // Sun -> observed Mon
  return d;
}

function federalHolidaysForYear(year: number): string[] {
  return [
    isoYMD(observedFixed(year, 0, 1)),            // New Year's Day
    isoYMD(nthWeekdayOfMonth(year, 0, 1, 3)),     // MLK Jr. Day (3rd Mon Jan)
    isoYMD(nthWeekdayOfMonth(year, 1, 1, 3)),     // Washington's Birthday (3rd Mon Feb)
    isoYMD(lastWeekdayOfMonth(year, 4, 1)),       // Memorial Day (last Mon May)
    isoYMD(observedFixed(year, 5, 19)),           // Juneteenth
    isoYMD(observedFixed(year, 6, 4)),            // Independence Day
    isoYMD(nthWeekdayOfMonth(year, 8, 1, 1)),     // Labor Day (1st Mon Sep)
    isoYMD(nthWeekdayOfMonth(year, 9, 1, 2)),     // Columbus Day (2nd Mon Oct)
    isoYMD(observedFixed(year, 10, 11)),          // Veterans Day
    isoYMD(nthWeekdayOfMonth(year, 10, 4, 4)),    // Thanksgiving (4th Thu Nov)
    isoYMD(observedFixed(year, 11, 25)),          // Christmas Day
  ];
}

function addBusinessDays(base: Date, n: number): Date {
  // Holidays spanning the base year and the following year cover any realistic span.
  const holidays = new Set<string>([
    ...federalHolidaysForYear(base.getUTCFullYear()),
    ...federalHolidaysForYear(base.getUTCFullYear() + 1),
  ]);
  let d = new Date(base);
  let added = 0;
  while (added < n) {
    d = addDays(d, 1);
    const dow = d.getUTCDay();
    if (dow === 0 || dow === 6) continue;       // weekend
    if (holidays.has(isoYMD(d))) continue;       // federal holiday
    added++;
  }
  return d;
}

// Business-day statutory intervals (Arizona = 14 business days). Kept as an array
// for symmetry with STANDARD_INTERVALS_DAYS and easy future additions.
const BUSINESS_DAY_INTERVALS = [14];

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
  /** Business-day deadline candidates from move-out (e.g., Arizona's 14 business days). */
  deadlineFromVacatedBusinessDays: { days: number; date: string }[];
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

  const deadlineFromVacatedBusinessDays = vacated
    ? BUSINESS_DAY_INTERVALS.map((days) => ({
        days,
        date: formatLongDate(addBusinessDays(vacated, days)),
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
    deadlineFromVacatedBusinessDays,
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
    lines.push('- Statutory-deadline candidates measured from the MOVE-OUT date (pick the ONE whose day-count EXACTLY equals this state\u2019s statutory interval from the system prompt \u2014 e.g., a 21-day state uses the "21 days" line, NOT the 14- or 15-day line):');
    for (const x of d.deadlineFromVacated) {
      lines.push(`    \u2022 Exactly ${x.days} days after move-out = ${x.date}`);
    }
  }
  if (d.deadlineFromVacatedBusinessDays.length) {
    lines.push('- BUSINESS-DAY deadline candidates from the MOVE-OUT date (use ONLY for states whose statute is in BUSINESS days, e.g., Arizona = 14 business days; these already exclude weekends and U.S. federal holidays \u2014 do NOT use these for calendar-day states):');
    for (const x of d.deadlineFromVacatedBusinessDays) {
      lines.push(`    \u2022 Exactly ${x.days} business days after move-out = ${x.date}`);
    }
  }
  if (d.deadlineFromForwarding) {
    lines.push('- Statutory-deadline candidates measured from the FORWARDING-ADDRESS date (for "later of" states, compare against the move-out candidate and use whichever is later):');
    for (const x of d.deadlineFromForwarding) {
      lines.push(`    \u2022 Exactly ${x.days} days after forwarding address = ${x.date}`);
    }
  }
  return lines.join('\n');
}
