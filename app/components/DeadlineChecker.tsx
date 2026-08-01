'use client';

// ============================================================
// DeadlineChecker — free deposit-deadline checker (U6).
//
// ALL statute facts (deadlines, branch conditions, penalties,
// nuance notes, scope gates) come from lib/stateLawData.ts —
// the audited source of truth. This component NEVER hard-codes
// a deadline figure, penalty amount, or statute claim.
//
// The only per-state knowledge encoded here is STRUCTURAL:
// which states anchor their statutory clock on a tenant act
// (written forwarding address / written demand), derived from
// the audited systemPrompt.ts per-state sections + the
// trigger_condition notes in stateLawData. The question wording
// below states no day counts and no penalties — those all
// render from the data.
//
// Clock-anchor list (derived July/Aug 2026 audit data — re-derive
// at the Jan 2027 re-audit):
//   address-anchored: TX (§92.107), IA, MN, RI, SD, TN, CT
//   demand-anchored:  AZ (§33-1321), MS, NE, SC
// CT note: CT's statute is later-of(21 after termination,
// 15 after address); computing deadlineDays from the later of
// move-out and address date is equal or slightly LATER than the
// true deadline when the address came after move-out — i.e. the
// conservative direction (never calls a landlord late early).
// ============================================================

import { useMemo, useState } from 'react';
import {
  JURISDICTIONS,
  type Jurisdiction,
  type ConditionalJurisdiction,
} from '@/lib/stateLawData';

// ------------------------------------------------------------
// Clock-anchor configuration (structural only — see header)
// ------------------------------------------------------------

type AnchorKind = 'address' | 'demand';

const CLOCK_ANCHORS: Record<string, AnchorKind> = {
  texas: 'address',
  iowa: 'address',
  minnesota: 'address',
  'rhode-island': 'address',
  'south-dakota': 'address',
  tennessee: 'address',
  connecticut: 'address',
  arizona: 'demand',
  mississippi: 'demand',
  nebraska: 'demand',
  'south-carolina': 'demand',
};

const ANCHOR_QUESTION: Record<AnchorKind, string> = {
  address:
    'Have you given your landlord your forwarding address in writing?',
  demand:
    'Have you demanded the return of your deposit in writing?',
};

const ANCHOR_DATE_LABEL: Record<AnchorKind, string> = {
  address: 'When did you provide it (roughly)?',
  demand: 'When did you send the demand (roughly)?',
};

const ANCHOR_ACT: Record<AnchorKind, string> = {
  address: 'give your landlord a written forwarding address',
  demand: 'demand the deposit in writing',
};

// Business-day counting applies where the audited deadlineLabel
// says "business" (Arizona). Detected from the data, not assumed.
export function usesBusinessDays(j: Jurisdiction): boolean {
  return /business/i.test(j.deadlineLabel);
}

// Federal holidays (observed), 2026–2027. Used only for
// business-day states; results are labeled "approximately".
// 📅 Jan 2027 refresh: extend this list.
const FEDERAL_HOLIDAYS = new Set([
  '2026-01-01', '2026-01-19', '2026-02-16', '2026-05-25', '2026-06-19',
  '2026-07-03', '2026-09-07', '2026-10-12', '2026-11-11', '2026-11-26',
  '2026-12-25',
  '2027-01-01', '2027-01-18', '2027-02-15', '2027-05-31', '2027-06-18',
  '2027-07-05', '2027-09-06', '2027-10-11', '2027-11-11', '2027-11-25',
  '2027-12-24',
]);

// ------------------------------------------------------------
// Date helpers (all local-time, date-only)
// ------------------------------------------------------------

export function parseInputDate(value: string): Date | null {
  // <input type="date"> yields YYYY-MM-DD; construct in local time.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

export function isoDay(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function addCalendarDays(start: Date, days: number): Date {
  const d = new Date(start);
  d.setDate(d.getDate() + days);
  return d;
}

export function addBusinessDays(start: Date, days: number): Date {
  const d = new Date(start);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    if (FEDERAL_HOLIDAYS.has(isoDay(d))) continue;
    added += 1;
  }
  return d;
}

export function laterOf(a: Date, b: Date): Date {
  return a.getTime() >= b.getTime() ? a : b;
}

export function earlierOf(a: Date, b: Date): Date {
  return a.getTime() <= b.getTime() ? a : b;
}

export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ------------------------------------------------------------
// Result model
// ------------------------------------------------------------

interface ComputedBranch {
  /** which branch/condition this deadline belongs to (empty for simple) */
  conditionLabel: string;
  deadline: Date;
  approximate: boolean;
}

type CheckerResult =
  | { kind: 'clock_not_started'; j: Jurisdiction; anchor: AnchorKind }
  | { kind: 'out_of_scope'; j: Jurisdiction }
  | { kind: 'deadline'; j: Jurisdiction; branches: ComputedBranch[] };

export function computeDeadline(
  j: Jurisdiction,
  anchorDate: Date,
  deadlineDays: number
): { deadline: Date; approximate: boolean } {
  if (usesBusinessDays(j)) {
    return { deadline: addBusinessDays(anchorDate, deadlineDays), approximate: true };
  }
  return { deadline: addCalendarDays(anchorDate, deadlineDays), approximate: false };
}

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

const NOT_SURE = '__not_sure__';

export default function DeadlineChecker() {
  const states = useMemo(
    () => [...JURISDICTIONS].sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  const [slug, setSlug] = useState('');
  const [moveOut, setMoveOut] = useState('');

  // conditional-state branch choice (index as string, or NOT_SURE)
  const [branchChoice, setBranchChoice] = useState('');
  // trigger-state anchor answers
  const [anchorDone, setAnchorDone] = useState(''); // 'yes' | 'no' | ''
  const [anchorDate, setAnchorDate] = useState('');
  // Arkansas scope answer
  const [arScope, setArScope] = useState(''); // 'covered' | 'exempt' | NOT_SURE | ''
  // West Virginia new-tenant answer
  const [wvNewTenant, setWvNewTenant] = useState(''); // 'yes' | 'no' | ''
  const [wvNewTenantDate, setWvNewTenantDate] = useState('');

  const [submitted, setSubmitted] = useState(false);

  const j = useMemo(
    () => states.find((s) => s.slug === slug),
    [states, slug]
  );

  function resetFollowUps(nextSlug: string) {
    setSlug(nextSlug);
    setBranchChoice('');
    setAnchorDone('');
    setAnchorDate('');
    setArScope('');
    setWvNewTenant('');
    setWvNewTenantDate('');
    setSubmitted(false);
  }

  const moveOutDate = parseInputDate(moveOut);
  const anchorKind = j ? CLOCK_ANCHORS[j.slug] : undefined;

  // ---- which follow-up questions does this state need? ----
  const needsBranchQuestion = j?.type === 'conditional';
  const needsAnchorQuestion = Boolean(anchorKind);
  const needsArScopeQuestion = j?.slug === 'arkansas';
  const needsWvQuestion = j?.slug === 'west-virginia';

  const followUpsAnswered =
    (!needsBranchQuestion || branchChoice !== '') &&
    (!needsAnchorQuestion ||
      anchorDone === 'no' ||
      (anchorDone === 'yes' && parseInputDate(anchorDate) !== null)) &&
    (!needsArScopeQuestion || arScope !== '') &&
    (!needsWvQuestion ||
      wvNewTenant === 'no' ||
      (wvNewTenant === 'yes' && parseInputDate(wvNewTenantDate) !== null));

  const canCheck = Boolean(j && moveOutDate && followUpsAnswered);

  // ---- compute the result ----
  const result: CheckerResult | null = useMemo(() => {
    if (!submitted || !j || !moveOutDate) return null;

    // Arkansas scope gate: exempt landlords fall back to lease/common law.
    if (j.slug === 'arkansas' && arScope === 'exempt') {
      return { kind: 'out_of_scope', j };
    }

    // Trigger-anchored clock: not started until the tenant act happens.
    if (anchorKind) {
      if (anchorDone === 'no') {
        return { kind: 'clock_not_started', j, anchor: anchorKind };
      }
      const aDate = parseInputDate(anchorDate);
      const anchor = aDate ? laterOf(moveOutDate, aDate) : moveOutDate;
      const days = j.type === 'conditional' ? 0 : j.deadlineDays;
      const { deadline, approximate } = computeDeadline(j, anchor, days);
      return {
        kind: 'deadline',
        j,
        branches: [{ conditionLabel: '', deadline, approximate }],
      };
    }

    // Conditional states: one branch, or both when "not sure".
    if (j.type === 'conditional') {
      const cj = j as ConditionalJurisdiction;
      const build = (b: { deadlineDays: number; condition: string }): ComputedBranch => {
        const { deadline, approximate } = computeDeadline(cj, moveOutDate, b.deadlineDays);
        return { conditionLabel: b.condition, deadline, approximate };
      };
      if (branchChoice === NOT_SURE) {
        return { kind: 'deadline', j, branches: cj.branches.map(build) };
      }
      const chosen = cj.branches[Number(branchChoice)];
      return { kind: 'deadline', j, branches: [build(chosen)] };
    }

    // West Virginia: shorter of 60 after termination / 45 after re-rental
    // (figures from the data entry; the shortening rule is rendered from
    // its own trigger_condition note below).
    if (j.slug === 'west-virginia' && wvNewTenant === 'yes') {
      const nt = parseInputDate(wvNewTenantDate);
      const base = addCalendarDays(moveOutDate, j.deadlineDays);
      const deadline = nt ? earlierOf(base, addCalendarDays(nt, 45)) : base;
      return {
        kind: 'deadline',
        j,
        branches: [{ conditionLabel: '', deadline, approximate: false }],
      };
    }

    // Simple / scope-gated default: deadlineDays from the anchor date.
    const { deadline, approximate } = computeDeadline(j, moveOutDate, j.deadlineDays);
    return {
      kind: 'deadline',
      j,
      branches: [{ conditionLabel: '', deadline, approximate }],
    };
  }, [submitted, j, moveOutDate, anchorKind, anchorDone, anchorDate, branchChoice, arScope, wvNewTenant, wvNewTenantDate]);

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------

  return (
    <div className="ddc">
      {/* ---- inputs ---- */}
      <div className="ddc-card">
        <div className="ddc-field">
          <label className="ddc-label" htmlFor="ddc-state">
            Your state
          </label>
          <select
            id="ddc-state"
            className="ddc-input"
            value={slug}
            onChange={(e) => resetFollowUps(e.target.value)}
          >
            <option value="">Select your state…</option>
            {states.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
          <p className="ddc-hint">
            City rules (e.g., Chicago, Seattle, NYC) can add protections — the{' '}
            <a href="/generate">letter generator</a> handles those.
          </p>
        </div>

        <div className="ddc-field">
          <label className="ddc-label" htmlFor="ddc-moveout">
            The date you moved out
          </label>
          <input
            id="ddc-moveout"
            className="ddc-input"
            type="date"
            value={moveOut}
            onChange={(e) => {
              setMoveOut(e.target.value);
              setSubmitted(false);
            }}
          />
        </div>

        {/* ---- conditional-state branch question ---- */}
        {j && needsBranchQuestion && (
          <fieldset className="ddc-field ddc-fieldset">
            <legend className="ddc-label">Which describes your situation?</legend>
            {(j as ConditionalJurisdiction).branches.map((b, i) => (
              <label key={i} className="ddc-radio">
                <input
                  type="radio"
                  name="ddc-branch"
                  checked={branchChoice === String(i)}
                  onChange={() => {
                    setBranchChoice(String(i));
                    setSubmitted(false);
                  }}
                />
                <span>{b.condition}</span>
              </label>
            ))}
            <label className="ddc-radio">
              <input
                type="radio"
                name="ddc-branch"
                checked={branchChoice === NOT_SURE}
                onChange={() => {
                  setBranchChoice(NOT_SURE);
                  setSubmitted(false);
                }}
              />
              <span>Not sure yet — show me both</span>
            </label>
          </fieldset>
        )}

        {/* ---- trigger-anchor question ---- */}
        {j && anchorKind && (
          <fieldset className="ddc-field ddc-fieldset">
            <legend className="ddc-label">{ANCHOR_QUESTION[anchorKind]}</legend>
            <label className="ddc-radio">
              <input
                type="radio"
                name="ddc-anchor"
                checked={anchorDone === 'yes'}
                onChange={() => {
                  setAnchorDone('yes');
                  setSubmitted(false);
                }}
              />
              <span>Yes</span>
            </label>
            <label className="ddc-radio">
              <input
                type="radio"
                name="ddc-anchor"
                checked={anchorDone === 'no'}
                onChange={() => {
                  setAnchorDone('no');
                  setSubmitted(false);
                }}
              />
              <span>No / not sure</span>
            </label>
            {anchorDone === 'yes' && (
              <div className="ddc-subfield">
                <label className="ddc-label" htmlFor="ddc-anchor-date">
                  {ANCHOR_DATE_LABEL[anchorKind]}
                </label>
                <input
                  id="ddc-anchor-date"
                  className="ddc-input"
                  type="date"
                  value={anchorDate}
                  onChange={(e) => {
                    setAnchorDate(e.target.value);
                    setSubmitted(false);
                  }}
                />
              </div>
            )}
          </fieldset>
        )}

        {/* ---- Arkansas scope question ---- */}
        {j && needsArScopeQuestion && (
          <fieldset className="ddc-field ddc-fieldset">
            <legend className="ddc-label">
              Does your landlord own six or more rental units (or use a
              management company)?
            </legend>
            {[
              ['covered', 'Yes — six or more units, or a management company'],
              ['exempt', 'No — five or fewer units'],
              [NOT_SURE, 'Not sure'],
            ].map(([val, label]) => (
              <label key={val} className="ddc-radio">
                <input
                  type="radio"
                  name="ddc-arscope"
                  checked={arScope === val}
                  onChange={() => {
                    setArScope(val);
                    setSubmitted(false);
                  }}
                />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>
        )}

        {/* ---- West Virginia new-tenant question ---- */}
        {j && needsWvQuestion && (
          <fieldset className="ddc-field ddc-fieldset">
            <legend className="ddc-label">
              Has a new tenant already moved into the unit?
            </legend>
            <label className="ddc-radio">
              <input
                type="radio"
                name="ddc-wv"
                checked={wvNewTenant === 'yes'}
                onChange={() => {
                  setWvNewTenant('yes');
                  setSubmitted(false);
                }}
              />
              <span>Yes</span>
            </label>
            <label className="ddc-radio">
              <input
                type="radio"
                name="ddc-wv"
                checked={wvNewTenant === 'no'}
                onChange={() => {
                  setWvNewTenant('no');
                  setSubmitted(false);
                }}
              />
              <span>No / not sure</span>
            </label>
            {wvNewTenant === 'yes' && (
              <div className="ddc-subfield">
                <label className="ddc-label" htmlFor="ddc-wv-date">
                  When did they move in (roughly)?
                </label>
                <input
                  id="ddc-wv-date"
                  className="ddc-input"
                  type="date"
                  value={wvNewTenantDate}
                  onChange={(e) => {
                    setWvNewTenantDate(e.target.value);
                    setSubmitted(false);
                  }}
                />
              </div>
            )}
          </fieldset>
        )}

        <button
          type="button"
          className="ddc-button"
          disabled={!canCheck}
          onClick={() => setSubmitted(true)}
        >
          Check my deadline
        </button>
      </div>

      {/* ---- results ---- */}
      {result && <ResultPanel result={result} />}
    </div>
  );
}

// ------------------------------------------------------------
// Result panel
// ------------------------------------------------------------

function ResultPanel({ result }: { result: CheckerResult }) {
  const { j } = result;
  const today = startOfToday();

  if (result.kind === 'clock_not_started') {
    return (
      <div className="ddc-result ddc-result-notstarted">
        <p className="ddc-result-kicker">{j.name} · {j.statuteCardLabel}</p>
        <h3 className="ddc-result-headline">
          Your landlord isn&rsquo;t legally late yet — because the clock
          hasn&rsquo;t started.
        </h3>
        <p>
          In {j.name}, the statutory deadline under {j.statuteCardLabel}{' '}
          doesn&rsquo;t begin until you {ANCHOR_ACT[result.anchor]}. Until
          then, there is no deadline for your landlord to miss.
        </p>
        <p>
          <strong>A demand letter is the document that starts the clock</strong>
          {result.anchor === 'address'
            ? ' — it supplies your forwarding address in writing and puts the date on record.'
            : ' — it is your written demand, and it puts the date on record.'}
        </p>
        <StateNotes j={j} />
        <Cta label="Start the clock — generate my letter" />
        <Disclaimer />
      </div>
    );
  }

  if (result.kind === 'out_of_scope') {
    const scope = j.type === 'scope_gated' ? j.scope : null;
    return (
      <div className="ddc-result">
        <p className="ddc-result-kicker">{j.name} · {j.statuteCardLabel}</p>
        <h3 className="ddc-result-headline">
          The deposit statute may not cover your rental — but you still have
          rights.
        </h3>
        {scope && <p>{scope.exemptFallback}</p>}
        <Cta label="Generate my demand letter" />
        <Disclaimer />
      </div>
    );
  }

  return (
    <div className="ddc-result">
      <p className="ddc-result-kicker">{j.name} · {j.statuteCardLabel}</p>
      {result.branches.map((b, i) => {
        const diff = daysBetween(today, b.deadline);
        const late = diff < 0;
        return (
          <div key={i} className="ddc-deadline-block">
            {b.conditionLabel && (
              <p className="ddc-branch-label">If: {b.conditionLabel}</p>
            )}
            <h3 className="ddc-result-headline">
              {late
                ? `Your landlord is ${Math.abs(diff)} day${Math.abs(diff) === 1 ? '' : 's'} past the deadline.`
                : diff === 0
                  ? 'The deadline is today.'
                  : `Your landlord has ${diff} day${diff === 1 ? '' : 's'} left.`}
            </h3>
            <p className="ddc-deadline-date">
              Deadline: <strong>{formatDate(b.deadline)}</strong>
              {b.approximate &&
                ' (approximately — business-day counting can shift by a day or two around holidays)'}
            </p>
          </div>
        );
      })}

      <div className="ddc-exposure">
        <h4>What {j.name} law says your landlord risks</h4>
        <p>{j.penalty.long}</p>
        <p>{j.copy.penaltyExample}</p>
      </div>

      <StateNotes j={j} />

      <Cta
        label={
          result.branches.some((b) => daysBetween(today, b.deadline) < 0)
            ? 'They missed it — generate my demand letter'
            : 'Get my demand letter ready'
        }
      />
      <Disclaimer />
    </div>
  );
}

/** Data-sourced callouts: scope gates, homepage caveats, trigger notes. */
function StateNotes({ j }: { j: Jurisdiction }) {
  const notes = j.notes.filter((n) => n.kind === 'trigger_condition');
  return (
    <div className="ddc-notes">
      {j.type === 'scope_gated' && (
        <p className="ddc-note">
          <strong>Who this covers:</strong> {j.scope.appliesTo}{' '}
          {j.scope.exemptFallback}
        </p>
      )}
      {j.homepageDeadlineNote && (
        <p className="ddc-note">
          <strong>Note:</strong> {j.homepageDeadlineNote}
        </p>
      )}
      {notes.map((n, i) => (
        <p key={i} className="ddc-note">
          <strong>{n.heading}</strong> {n.body}
        </p>
      ))}
    </div>
  );
}

function Cta({ label }: { label: string }) {
  return (
    <a className="ddc-cta" href="/generate">
      {label} — $39
    </a>
  );
}

function Disclaimer() {
  return (
    <p className="ddc-fineprint">
      This tool provides general information based on state statutes, not
      legal advice about your specific situation.
    </p>
  );
}
