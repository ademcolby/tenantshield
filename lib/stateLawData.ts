// lib/stateLawData.ts
//
// PROJECT K — Phase 2 COMPLETE (all 51 states + DC populated), plus all 15
// city overlays. Facts verified in Phase 1 (PROJECT_K_PHASE1_FINDINGS.md) for
// the 51 states/DC + 13 cities; Santa Monica and Boston added and verified in
// the July 7, 2026 Phase 1b city cleanup. Written batch by batch (Batches 1-7)
// from the audit findings; the 6 originally-seeded states (TX, FL, AR, AL, AK,
// AZ) were re-confirmed against the Phase 1 audit.
//
// July 22, 2026 (post-correction prompt↔data cross-check, 2 precision fixes):
// AZ penaltyExample corrected to the additive $4,500 total per § 33-1321(E)
// (register AZ deep-dive 🔴 that never received a numbered confirmed-wrong row,
// so the correction batch never wrote it); HI "service animal" → "assistance
// animal (§ 515-3 reasonable accommodation)" (Batch 9 precision item).
//
// Single source of truth for security-deposit legal facts consumed by the
// marketing state pages (and, later, blog sync). NOT consumed by the letter
// engine — systemPrompt.ts stays prose (Phase 5, separate project).
//
// Design: ONE file, ONE array, each jurisdiction tagged with a `type`
// discriminator (discriminated union). Same place to look for every state;
// TypeScript enforces that each type carries the fields its shape requires.

// ---------------------------------------------------------------------------
// Shared building blocks
// ---------------------------------------------------------------------------

/** A statute citation. `label` is what displays (e.g. "§ 92.103"); `full`
 *  is the formal cite for prose (e.g. "Texas Property Code § 92.103"). */
export interface StatuteCitation {
  label: string;
  full: string;
}

/** Penalty shape. Structured just enough for the quick-facts box + honest
 *  display, without trying to make every variant computable. `short` is the
 *  card label ("3× damages", "$100 + 3×", "Forfeiture"); `long` is the prose
 *  sentence used in the "what the law says" section. `kind` lets the UI style
 *  or group penalties and lets us sanity-check data entry, but the authoritative
 *  human-readable copy always lives in short/long. */
export interface Penalty {
  kind: 'multiplier' | 'fixed' | 'forfeiture' | 'greater_of' | 'none';
  /** present for kind='multiplier' or the multiplier side of 'greater_of' */
  multiplier?: number;
  /** present for kind='fixed' or the fixed side of 'greater_of' (in dollars) */
  fixedAmount?: number;
  attorneyFees: boolean;
  short: string;
  long: string;
}

/** Typed nuance callout — this is what preserves the per-page richness the
 *  better hand-built pages already have (deposit caps, scope notes, trigger
 *  explanations, outdated-figure warnings) instead of flattening to Texas's
 *  thin level. Rendered as the bordered callout boxes on the state pages. */
export interface NuanceNote {
  kind:
    | 'deposit_cap'
    | 'scope_threshold'
    | 'trigger_condition'
    | 'outdated_figure'
    | 'recent_amendment'
    | 'general';
  /** bold lead-in, e.g. "Good to know:" / "Important scope note:" */
  heading: string;
  body: string;
}

/** Unit-count threshold gating (AR 6+, IL 5+, NY 6+, NH ≤5 owner-occ, etc.). */
export interface UnitThreshold {
  minUnits?: number;   // statute applies at/above this count
  maxUnits?: number;   // …or exemption applies at/below this count
  description: string; // human explanation of the gate
}

/** Per-state WRITTEN COPY. Surfaced as its own block because mapping the real
 *  pages revealed most of each page's substance is prose, not structured facts:
 *  the hero paragraph, the law-summary opening, the penalty lead-in + bullets,
 *  and the worked "$1,500 → $X" example are all hand-written per state. Grouping
 *  them keeps the structured legal facts (deadline/statute/penalty.kind) clean
 *  and separate from the copy that varies state to state. NOTE for the audit:
 *  populating a state means migrating/writing this prose too, not just numbers. */
export interface JurisdictionCopy {
  /** hero paragraph under the h1 */
  heroSummary: string;
  /** opening paragraph of "What {state} law actually says" */
  lawSummary: string;
  /** sentence introducing the penalty bullet list */
  penaltyLeadIn: string;
  /** the "you may recover" bullet items */
  penaltyBullets: string[];
  /** the worked example paragraph, e.g. "So a $1,500 deposit…" */
  penaltyExample: string;
  /** the statute line shown in the "What you get for $39" grid */
  statuteLine: string;
}

/** Fields every jurisdiction shares, regardless of type. */
interface BaseJurisdiction {
  /** URL slug — matches app/states/{slug}/ and sitemap.ts */
  slug: string;
  /** Display name, e.g. "Texas" */
  name: string;
  statutes: StatuteCitation[];
  penalty: Penalty;
  copy: JurisdictionCopy;
  notes: NuanceNote[];
  /** short label for the Statute quick-fact card, e.g. "§ 92.103" */
  statuteCardLabel: string;
  /** the small grey line under the statute card, e.g. "Texas Property Code" */
  statuteCardSubtext: string;
  /** short label for the Penalty quick-fact card, e.g. "3× damages" */
  penaltyCardLabel: string;
  /** the small grey line under the penalty card */
  penaltyCardSubtext: string;
  /** optional caption for the homepage deadline lookup, for states where a
   *  bare deadline label would mislead without the state page's surrounding
   *  prose (KY, IL, WV). Rendered under the number, next to a link to the
   *  full state page. */
  homepageDeadlineNote?: string;
  /** optional across all types */
  unitThreshold?: UnitThreshold;
  /** audit provenance — REQUIRED so nothing ships unverified */
  lastVerified: string;      // ISO date
  primarySource: string;     // where it was verified against
}

// ---------------------------------------------------------------------------
// The three discriminated types
// ---------------------------------------------------------------------------

/** SIMPLE — one flat deadline, straightforward penalty. (TX, GA, MD, …) */
export interface SimpleJurisdiction extends BaseJurisdiction {
  type: 'simple';
  deadlineDays: number;
  /** short label for the card, e.g. "30 days" */
  deadlineLabel: string;
}

/** CONDITIONAL — deadline depends on a trigger (no-claim vs claim, notice
 *  given vs not, etc.). (FL, AK, MT, SD, …) */
export interface ConditionalJurisdiction extends BaseJurisdiction {
  type: 'conditional';
  /** the two (or more) branches, each with its own deadline + when it applies */
  branches: {
    deadlineDays: number;
    /** what triggers THIS branch, e.g. "no claim on the deposit" */
    condition: string;
  }[];
  /** short label spanning the range for the card, e.g. "15 / 30 days" */
  deadlineLabel: string;
  /** one-line explanation of how the branch is chosen, for the nuance box */
  triggerSummary: string;
}

/** SCOPE_GATED — the statute only applies to some landlords/tenancies; outside
 *  scope, weaker common-law/contract remedies apply. (AR, KY, NH, …) */
export interface ScopeGatedJurisdiction extends BaseJurisdiction {
  type: 'scope_gated';
  deadlineDays: number;
  deadlineLabel: string;
  /** who the statute covers vs. who's exempt — drives the scope callout and
   *  the "your letter reflects whichever applies" language */
  scope: {
    appliesTo: string;
    exemptFallback: string;
  };
}

/** The union every state resolves to. */
export type Jurisdiction =
  | SimpleJurisdiction
  | ConditionalJurisdiction
  | ScopeGatedJurisdiction;

// ---------------------------------------------------------------------------
// City overlays (Phase 0b)
//
// Cities relate to their parent state's law in THREE genuinely different ways —
// this is the same discriminated-union approach as the states, and it exists to
// prevent the specific errors the systemPrompt audit already caught:
//   - 'augments'  → city rules STACK on top of the state's; BOTH apply, and
//                   two-layer penalties MUST stay distinct (Portland is the
//                   canonical trap: ORS 90.300's 2x is a separate thing from
//                   PCC 30.01.087's $250/violation — never collapse them).
//   - 'replaces'  → city ordinance GOVERNS instead of the state default for the
//                   deposit timeline/penalty (Evanston's 21-day overrides IL's
//                   30/45; do not apply the state timeline here).
//   - 'defers'    → city has no exceeding ordinance; STATE law controls, city is
//                   listed only for completeness (Cambridge → apply MA law).
// ---------------------------------------------------------------------------

interface BaseCityOverlay {
  slug: string;
  name: string;
  /** the state this city sits in — links to a Jurisdiction.slug */
  parentStateSlug: string;
  /** one-sentence summary for the homepage city-variations card. MUST stay
   *  consistent with this entry's audited facts — it renders on the homepage
   *  lookup with no surrounding prose. */
  homepageSummary: string;
  /** optional label for the state-page "Local ordinances" card when the city
   *  has no page of its own. Defaults to 'State law applies' — set only where
   *  that default would be misleading (Evanston: 'Not yet covered'). */
  cardLabel?: string;
  statutes: StatuteCitation[];
  notes: NuanceNote[];
  lastVerified: string;
  primarySource: string;
}

/** AUGMENTS — city duties stack ON TOP of the parent state's rules; both apply.
 *  The city's own penalty is kept in its own field so it can never be conflated
 *  with the state penalty (the Portland requirement). */
export interface AugmentingCity extends BaseCityOverlay {
  type: 'augments';
  /** the city's OWN penalty, distinct from the state penalty which still applies */
  cityPenalty: Penalty;
  /** extra procedural duties the city imposes (caps, separate account, etc.) */
  cityDuties: string[];
  /** explicit reminder that the parent state's rules ALSO apply, and how */
  stateStillApplies: string;
}

/** REPLACES — city ordinance governs the deposit timeline/penalty instead of the
 *  state default. Carries its own deadline + penalty; names what it displaces. */
export interface ReplacingCity extends BaseCityOverlay {
  type: 'replaces';
  deadlineDays: number;
  deadlineLabel: string;
  penalty: Penalty;
  /** what state/other framework this ordinance overrides (so we don't apply it) */
  displaces: string;
}

/** DEFERS — no exceeding ordinance; parent state law controls. Listed for
 *  completeness; `apply` tells the letter which state framework to lead with. */
export interface DeferringCity extends BaseCityOverlay {
  type: 'defers';
  apply: string;
}

export type CityOverlay = AugmentingCity | ReplacingCity | DeferringCity;

// ---------------------------------------------------------------------------
// THREE WORKED EXAMPLES (stress-testing the model on the hard cases)
// Values below mirror systemPrompt.ts as a starting point; they still get
// primary-source RE-VERIFIED in Phase 1 before this file is trusted.
// ---------------------------------------------------------------------------

const TEXAS: SimpleJurisdiction = {
  type: 'simple',
  slug: 'texas',
  name: 'Texas',
  deadlineDays: 30,
  deadlineLabel: '30 days',
  statutes: [
    { label: '§ 92.103', full: 'Texas Property Code § 92.103' },
    { label: '§ 92.109', full: 'Texas Property Code § 92.109' },
  ],
  penalty: {
    kind: 'multiplier',
    multiplier: 3,
    fixedAmount: 100,
    attorneyFees: true,
    short: '$100 + 3× damages',
    long:
      'A landlord who acts in bad faith is liable for a $100 statutory penalty, ' +
      'three times the portion of the deposit wrongfully withheld, and the ' +
      "tenant's reasonable attorney's fees under § 92.109.",
  },
  statuteCardLabel: '§ 92.103',
  statuteCardSubtext: 'Texas Property Code',
  penaltyCardLabel: '3× damages',
  penaltyCardSubtext: 'for bad-faith withholding under § 92.109',
  copy: {
    heroSummary:
      'A professional demand letter citing Texas Property Code § 92.103, the ' +
      '30-day return deadline, and the triple damages penalty for bad-faith ' +
      'withholding. Ready in minutes.',
    lawSummary:
      'Under Texas Property Code § 92.103 & § 92.109, your landlord has 30 days ' +
      'from the date you surrender the property to return your security deposit ' +
      'or provide a written, itemized list of deductions.',
    penaltyLeadIn:
      'If the landlord acts in bad faith — for example, refusing to return the ' +
      'deposit, providing no itemization, or making clearly improper deductions ' +
      '— Texas Property Code § 92.109 allows you to recover:',
    penaltyBullets: [
      'A statutory penalty of $100',
      'Three times the portion of the deposit wrongfully withheld',
      "Reasonable attorney's fees",
    ],
    penaltyExample:
      'So a $1,500 deposit wrongfully withheld in full can result in a court ' +
      'judgment of $4,600 plus fees. Most landlords settle quickly once they ' +
      'realize you know the law.',
    statuteLine:
      'Texas Property Code § 92.103, § 92.109, and any others triggered by your ' +
      'circumstances — not generic legalese.',
  },
  notes: [],
  lastVerified: '2026-07-20',
  primarySource: 'Tex. Prop. Code §§ 92.103, 92.109 (verified against statute text; Phase 1 audit confirmed)',
};

const FLORIDA: ConditionalJurisdiction = {
  type: 'conditional',
  slug: 'florida',
  name: 'Florida',
  deadlineLabel: '15 / 30 days',
  branches: [
    { deadlineDays: 15, condition: 'Landlord makes no claim on the deposit (full return intended)' },
    { deadlineDays: 30, condition: 'Landlord intends to impose a claim — must send certified written notice within 30 days' },
  ],
  triggerSummary:
    'If the landlord makes no claim, the deposit is due in 15 days. If the ' +
    'landlord intends to keep any part, they must send certified notice of the ' +
    'claim within 30 days — missing that deadline forfeits the right to any claim.',
  statutes: [{ label: '§ 83.49', full: 'Florida Statutes § 83.49' }],
  penalty: {
    kind: 'forfeiture',
    attorneyFees: false,
    short: 'Forfeiture',
    long:
      'A landlord who fails to send the required notice of claim within 30 days ' +
      'forfeits the right to impose any claim on the deposit under § 83.49(3)(a), ' +
      'and the tenant may recover the deposit in full.',
  },
  statuteCardLabel: '§ 83.49',
  statuteCardSubtext: 'Florida Statutes',
  penaltyCardLabel: 'Forfeiture',
  penaltyCardSubtext: 'of the right to claim, if notice is missed',
  copy: {
    heroSummary:
      "A professional demand letter citing Florida Statutes § 83.49, the return " +
      'deadlines, and the forfeiture rule when a landlord misses the notice ' +
      'window. Ready in minutes.',
    lawSummary:
      'Under Florida Statutes § 83.49, if your landlord intends to return your ' +
      'full deposit they must do so within 15 days. If they intend to keep any ' +
      'part, they must send you written notice of the claim by certified mail ' +
      'within 30 days.',
    penaltyLeadIn:
      'If the landlord fails to send that certified notice of claim within 30 ' +
      'days, the consequences are significant:',
    penaltyBullets: [
      'The landlord forfeits the right to impose any claim on the deposit',
      'You may recover the deposit in full',
    ],
    penaltyExample:
      'A landlord who stays silent past the deadline generally cannot later ' +
      'justify keeping any part of the deposit. Most return it quickly once they ' +
      'realize the forfeiture rule has been triggered.',
    statuteLine:
      'Florida Statutes § 83.49 and any others triggered by your circumstances ' +
      '— not generic legalese.',
  },
  notes: [
    {
      kind: 'trigger_condition',
      heading: 'Which deadline applies:',
      body:
        'Keeping the entire deposit with only a vague reason still counts as a ' +
        'claim on the whole deposit — that triggers the 30-day certified-notice ' +
        'path, not the 15-day path.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource: 'Fla. Stat. § 83.49 (verified against statute text; Phase 1 audit confirmed)',
};

const ARKANSAS: ScopeGatedJurisdiction = {
  type: 'scope_gated',
  slug: 'arkansas',
  name: 'Arkansas',
  deadlineDays: 60,
  deadlineLabel: '60 days',
  statutes: [
    { label: '§ 18-16-305', full: 'Ark. Code § 18-16-305' },
    { label: '§ 18-16-306', full: 'Ark. Code § 18-16-306' },
  ],
  penalty: {
    kind: 'multiplier',
    multiplier: 2,
    attorneyFees: true,
    short: 'up to 2× + fees',
    long:
      'Where the statute applies, a landlord who wrongfully withholds the deposit ' +
      'is liable for up to twice the amount wrongfully withheld plus reasonable ' +
      "attorney's fees under § 18-16-306.",
  },
  unitThreshold: {
    minUnits: 6,
    description: 'Statute applies only to landlords owning 6+ rental units (or using a management agent for them).',
  },
  scope: {
    appliesTo: 'Landlords who own 6 or more rental units (or use a management agent for them).',
    exemptFallback:
      'If your landlord owns five or fewer units, the deposit statute does not ' +
      'apply — your demand rests on your lease and common-law contract rights instead.',
  },
  statuteCardLabel: '§ 18-16-305',
  statuteCardSubtext: 'Arkansas Code Annotated',
  penaltyCardLabel: 'up to 2×',
  penaltyCardSubtext: 'for wrongful withholding under § 18-16-306',
  copy: {
    heroSummary:
      "A professional demand letter citing Arkansas's security deposit statute " +
      '(Ark. Code § 18-16-305 and § 18-16-306), the 60-day return deadline, and ' +
      'the double-damages penalty. Ready in minutes.',
    lawSummary:
      'Under Ark. Code § 18-16-305, a covered landlord has 60 days after your ' +
      'tenancy ends to return your security deposit or provide a written, ' +
      'itemized statement of any deductions.',
    penaltyLeadIn:
      'Where the statute applies, a landlord who wrongfully withholds your ' +
      'deposit is liable under § 18-16-306 for:',
    penaltyBullets: [
      'Up to twice the amount wrongfully withheld',
      "Reasonable attorney's fees",
    ],
    penaltyExample:
      'So a $1,500 deposit wrongfully withheld can support a court judgment of ' +
      'up to $3,000 plus fees. Most landlords settle quickly once they realize ' +
      'you know the law.',
    statuteLine:
      'Ark. Code § 18-16-305, § 18-16-306 and any others triggered by your ' +
      'circumstances — not generic legalese.',
  },
  notes: [
    {
      kind: 'scope_threshold',
      heading: 'Important scope note:',
      body:
        'The Arkansas security-deposit statute applies only to landlords with 6+ ' +
        'units. If yours owns fewer, your letter relies on contract/common-law ' +
        'rights instead — it reflects whichever applies to your situation.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource: 'Ark. Code §§ 18-16-305, 18-16-306 (verified against statute text; Phase 1 audit confirmed 6+ unit scope gate)',
};

const ALABAMA: SimpleJurisdiction = {
  type: 'simple',
  slug: 'alabama',
  name: 'Alabama',
  deadlineDays: 60,
  deadlineLabel: '60 days',
  statutes: [{ label: '§ 35-9A-201', full: 'Ala. Code § 35-9A-201' }],
  penalty: {
    kind: 'multiplier',
    multiplier: 2,
    attorneyFees: false,
    short: '2× deposit',
    long:
      'If the landlord fails to mail a timely refund or itemized accounting ' +
      'within the 60-day window, you may recover double the amount of your ' +
      'original deposit under § 35-9A-201(f).',
  },
  statuteCardLabel: '§ 35-9A-201',
  statuteCardSubtext: 'Code of Alabama',
  penaltyCardLabel: '2× deposit',
  penaltyCardSubtext: 'for missing the 60-day deadline',
  copy: {
    heroSummary:
      "A professional demand letter citing Alabama's deposit statute (Ala. Code " +
      '§ 35-9A-201), the 60-day return deadline, and the double-deposit penalty ' +
      'for noncompliance. Ready in minutes.',
    lawSummary:
      'Under Ala. Code § 35-9A-201, your landlord has 60 days after your tenancy ' +
      'ends to return your security deposit or provide a written, itemized list ' +
      'of deductions. (Many outdated sources still cite an old 35-day figure — a ' +
      '2014 amendment changed it to 60.)',
    penaltyLeadIn:
      'If the landlord fails to mail a timely refund or itemized accounting within the 60-day window, you may recover:',
    penaltyBullets: [
      'Double the amount of your original security deposit \u2014 the penalty is keyed to the whole deposit, not just the portion withheld',
    ],
    penaltyExample:
      'So on a $1,500 deposit, a landlord who misses the 60-day mailing deadline ' +
      'can owe a $3,000 penalty \u2014 even if only part of the deposit was in ' +
      'dispute. Most landlords settle quickly once they realize you know the law.',
    statuteLine:
      'Ala. Code § 35-9A-201 and any others triggered by your circumstances — ' +
      'not generic legalese.',
  },
  notes: [
    {
      kind: 'deposit_cap',
      heading: 'Good to know:',
      body:
        'Alabama caps security deposits at one month\u2019s rent (with limited ' +
        'exceptions for pets, undue risk, or tenant alterations).',
    },
    {
      kind: 'outdated_figure',
      heading: 'Watch for outdated info:',
      body:
        'Sources citing a 35-day Alabama deadline are stale — a 2014 amendment ' +
        'moved it to 60 days.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource: 'Ala. Code § 35-9A-201 (verified against statute text; Phase 1 audit confirmed 60-day deadline + 1-mo cap)',
};

const ALASKA: ConditionalJurisdiction = {
  type: 'conditional',
  slug: 'alaska',
  name: 'Alaska',
  deadlineLabel: '14 / 30 days',
  branches: [
    { deadlineDays: 14, condition: 'Tenant gave proper termination notice AND the landlord is claiming no deductions' },
    { deadlineDays: 30, condition: 'Tenant did not give notice, or the landlord is deducting for damages (with an itemized statement)' },
  ],
  triggerSummary:
    'The deadline is 14 days if you gave proper termination notice and the ' +
    'landlord claims no deductions; otherwise it is 30 days with an itemized ' +
    'statement. It turns on notice and deductions — not on lease type.',
  statutes: [{ label: '§ 34.03.070', full: 'AS § 34.03.070' }],
  penalty: {
    kind: 'multiplier',
    multiplier: 2,
    attorneyFees: false,
    short: '2× willful',
    long:
      'If the landlord\u2019s noncompliance is willful, you may recover up to ' +
      'twice the amount wrongfully withheld.',
  },
  statuteCardLabel: '§ 34.03.070',
  statuteCardSubtext: 'Alaska Statutes',
  penaltyCardLabel: '2× willful',
  penaltyCardSubtext: 'for willful noncompliance under § 34.03.070',
  copy: {
    heroSummary:
      "A professional demand letter citing Alaska's Uniform Residential Landlord " +
      'and Tenant Act (AS § 34.03.070), the return deadlines, and the ' +
      'double-damages penalty for willful withholding. Ready in minutes.',
    lawSummary:
      'Under AS § 34.03.070, your landlord must return your deposit within 14 ' +
      'days if you gave proper termination notice and no deductions are claimed, ' +
      'or within 30 days if you did not give notice or the landlord is deducting ' +
      'for damages — along with a written, itemized statement.',
    penaltyLeadIn: 'If the landlord\u2019s noncompliance is willful, you may recover:',
    penaltyBullets: ['Up to twice the amount wrongfully withheld'],
    penaltyExample:
      'So a $1,500 deposit willfully withheld can support a court judgment of up ' +
      'to $3,000. Most landlords settle quickly once they realize you know the law.',
    statuteLine:
      'AS § 34.03.070 and any others triggered by your circumstances — not ' +
      'generic legalese.',
  },
  notes: [
    {
      kind: 'trigger_condition',
      heading: 'Note:',
      body:
        'Alaska\u2019s deadline turns on whether you gave proper notice and ' +
        'whether the landlord is claiming damages — not on lease type. Your ' +
        'letter applies the correct deadline for your situation.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource: 'AS § 34.03.070 (verified against statute text; Phase 1 audit confirmed 14/30-day trigger + 2× willful)',
};

const ARIZONA: SimpleJurisdiction = {
  type: 'simple',
  slug: 'arizona',
  name: 'Arizona',
  deadlineDays: 14,
  deadlineLabel: '14 business days',
  statutes: [{ label: '§ 33-1321', full: 'ARS § 33-1321' }],
  penalty: {
    kind: 'multiplier',
    multiplier: 2,
    attorneyFees: false,
    short: '2× damages',
    long:
      'If the landlord wrongfully withholds any part of your deposit, you may ' +
      'recover the property or money owed plus two times the amount wrongfully ' +
      'withheld.',
  },
  statuteCardLabel: '§ 33-1321',
  statuteCardSubtext: 'Arizona Revised Statutes',
  penaltyCardLabel: '2× damages',
  penaltyCardSubtext: 'for wrongful withholding under § 33-1321',
  copy: {
    heroSummary:
      "A professional demand letter citing Arizona's Residential Landlord and " +
      'Tenant Act (ARS § 33-1321), the 14-business-day return deadline, and the ' +
      'double-damages penalty for wrongful withholding. Ready in minutes.',
    lawSummary:
      'Under ARS § 33-1321, your landlord has 14 business days (weekends and ' +
      'holidays do not count) to return your security deposit or provide a ' +
      'written, itemized list of deductions — measured from the later of when ' +
      'your tenancy ends, you hand back possession, and you make a written ' +
      'demand for the deposit.',
    penaltyLeadIn: 'If the landlord wrongfully withholds any part of your deposit, you may recover:',
    penaltyBullets: [
      'The property or money owed to you, plus',
      'Two times the amount wrongfully withheld',
    ],
    penaltyExample:
      'So a $1,500 deposit wrongfully withheld can support a court judgment of ' +
      '$4,500 — the $1,500 back plus $3,000 in damages. Most landlords settle ' +
      'quickly once they realize you know the law.',
    statuteLine:
      'ARS § 33-1321 and any others triggered by your circumstances — not ' +
      'generic legalese.',
  },
  notes: [
    {
      kind: 'general',
      heading: 'Good to know:',
      body:
        'Arizona caps security deposits at one and one-half months\u2019 rent. ' +
        'The 14-business-day clock only starts once you have made a written ' +
        'demand — which your letter provides.',
    },
    {
      kind: 'trigger_condition',
      heading: 'Act within 60 days of the itemized statement:',
      body:
        'Under ARS § 33-1321(D), if your landlord sent you an itemized list of ' +
        'deductions and you do not dispute it in writing within 60 days, you ' +
        'waive any further claim to the amounts withheld. If you received an ' +
        'itemization, send your written objection before that window closes.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource: 'ARS § 33-1321 (verified against statute text; Phase 1 audit confirmed)',
};

// ===========================================================================
// PHASE 2 — BATCH 1 (CA, CO, NY). Priority-tier-six states carrying the
// highest-traffic / most-recently-amended law. Facts verified in Phase 1
// (PROJECT_K_PHASE1_FINDINGS.md); prose migrated from the live state pages
// and corrected against the audit.
// ===========================================================================

const CALIFORNIA: SimpleJurisdiction = {
  type: 'simple',
  slug: 'california',
  name: 'California',
  deadlineDays: 21,
  deadlineLabel: '21 days',
  statutes: [{ label: '§ 1950.5', full: 'California Civil Code § 1950.5' }],
  penalty: {
    kind: 'multiplier',
    multiplier: 2,
    attorneyFees: false,
    short: 'up to 2× + actual damages',
    long:
      'A landlord who retains the deposit in bad faith is liable for statutory ' +
      'damages of up to twice the amount of the security deposit, in addition to ' +
      'the tenant\u2019s actual damages, under § 1950.5(m).',
  },
  statuteCardLabel: '§ 1950.5',
  statuteCardSubtext: 'California Civil Code',
  penaltyCardLabel: 'up to 2×',
  penaltyCardSubtext: 'bad-faith penalty, plus actual damages',
  copy: {
    heroSummary:
      "A professional demand letter citing California's security deposit law " +
      '(Civil Code \u00a7 1950.5), the 21-day return deadline, the bad-faith ' +
      'penalty \u2014 and the new photo-evidence rules most landlords are still ' +
      'violating. Ready in minutes.',
    lawSummary:
      'Under California Civil Code \u00a7 1950.5, your landlord has 21 days after ' +
      'you move out to return your security deposit or provide a written, ' +
      'itemized statement of any deductions, with receipts for work over $125.',
    penaltyLeadIn:
      'If the landlord withholds your deposit in bad faith, you may recover:',
    penaltyBullets: [
      'Up to twice the deposit as a statutory penalty',
      'Your actual damages on top of the penalty',
    ],
    penaltyExample:
      'So a $2,000 deposit wrongfully withheld can support a court judgment of up ' +
      'to $6,000 (the deposit back, plus up to 2\u00d7 as the penalty). Most ' +
      'landlords settle quickly once they realize you know the law.',
    statuteLine:
      'California Civil Code \u00a7 1950.5 and any others triggered by your ' +
      'circumstances \u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'recent_amendment',
      heading: 'New photo-evidence rules (AB 2801):',
      body:
        'For move-outs since April 1, 2025, a landlord deducting for repairs or ' +
        'cleaning must photograph the unit after you leave (before any work) and ' +
        'again after the work is done \u2014 and deliver those photos with the ' +
        'itemized statement. A landlord who in bad faith skips these requirements ' +
        'is barred from making a claim against the deposit. Since January 1, 2026 ' +
        '(AB 414), you can also request your refund electronically when rent was ' +
        'paid electronically.',
    },
    {
      kind: 'deposit_cap',
      heading: 'Deposit cap (AB 12):',
      body:
        'Since July 1, 2024, deposits are capped at one month\u2019s rent for ' +
        'most tenancies. A small-landlord exception (a natural person or LLC ' +
        'owning no more than two properties totaling no more than four units) may ' +
        'charge up to two months\u2019 rent.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'Cal. Civ. Code § 1950.5 (verified against statute text); AB 12, AB 2801, AB 414 confirmed in force (Phase 1 audit)',
};

const COLORADO: SimpleJurisdiction = {
  type: 'simple',
  slug: 'colorado',
  name: 'Colorado',
  deadlineDays: 30,
  deadlineLabel: '30 days',
  statutes: [
    { label: '§ 38-12-103', full: 'Colorado Revised Statutes § 38-12-103' },
    { label: '§ 38-12-104', full: 'Colorado Revised Statutes § 38-12-104' },
  ],
  penalty: {
    kind: 'multiplier',
    multiplier: 3,
    attorneyFees: true,
    short: '3× + fees',
    long:
      'A landlord who willfully retains the deposit without a valid basis is ' +
      'liable for treble (three times) the amount wrongfully withheld, plus ' +
      'reasonable attorney\u2019s fees and court costs, under § 38-12-103.',
  },
  statuteCardLabel: '§ 38-12-103',
  statuteCardSubtext: 'Colorado Revised Statutes',
  penaltyCardLabel: '3× damages',
  penaltyCardSubtext: 'for willful withholding, plus fees',
  copy: {
    heroSummary:
      "A professional demand letter citing Colorado's security deposit statute " +
      '(C.R.S. \u00a7 38-12-103), the 30-day return deadline, the treble-damages ' +
      'penalty, and the 2026 tenant protections under HB25-1249. Ready in minutes.',
    lawSummary:
      'Under C.R.S. \u00a7 38-12-103, your landlord has 30 days after your ' +
      'tenancy ends to return your security deposit or provide a written, ' +
      'itemized statement of any deductions (up to 60 days only if your lease ' +
      'specifically says so).',
    penaltyLeadIn:
      'If the landlord withholds your deposit in bad faith, you may recover:',
    penaltyBullets: [
      'Three times the amount wrongfully withheld',
      "Reasonable attorney's fees and court costs",
    ],
    penaltyExample:
      'So a $1,500 deposit wrongfully withheld can support a court judgment of ' +
      '$4,500 plus fees. Colorado requires you to give the landlord 7 days\u2019 ' +
      'written notice before filing suit for treble damages \u2014 your demand ' +
      'letter is built to serve as exactly that notice, which starts the clock ' +
      'the day it arrives.',
    statuteLine:
      'C.R.S. \u00a7 38-12-103, \u00a7 38-12-104, and any others triggered by ' +
      'your circumstances \u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'recent_amendment',
      heading: 'New for 2026 (HB25-1249):',
      body:
        'For conduct on or after January 1, 2026, "normal wear and tear" now ' +
        'expressly includes ordinary uncleanliness, so routine cleaning charges ' +
        'are off the table, and deductions for pre-existing damage are barred. ' +
        'You can demand supporting documentation within 14 days \u2014 and if the ' +
        'landlord doesn\u2019t produce it, that itself supports a wrongful-' +
        'withholding claim. Withholding 125% or more of actual damages can be ' +
        'treated as bad faith, and a 7-day pre-suit notice is required before ' +
        'suing for treble damages.',
    },
    {
      kind: 'deposit_cap',
      heading: 'Deposit cap:',
      body:
        'Colorado caps security deposits at two months\u2019 rent (SB23-184, ' +
        'effective 2023). HB25-1249 did not change this cap \u2014 sources ' +
        'claiming a new one-month Colorado cap are mistaken.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'C.R.S. §§ 38-12-103, 38-12-104 (verified against statute text); SB23-184 cap + HB25-1249 confirmed (Phase 1 audit)',
};

const NEW_YORK: SimpleJurisdiction = {
  type: 'simple',
  slug: 'new-york',
  name: 'New York',
  deadlineDays: 14,
  deadlineLabel: '14 days',
  statutes: [
    { label: '§ 7-108', full: 'New York General Obligations Law § 7-108' },
    { label: '§ 7-103', full: 'New York General Obligations Law § 7-103' },
  ],
  penalty: {
    kind: 'multiplier',
    multiplier: 2,
    attorneyFees: false,
    short: 'up to 2× (willful)',
    long:
      'A landlord who misses the 14-day deadline forfeits any right to retain the ' +
      'deposit; a willful violation exposes the landlord to punitive damages of ' +
      'up to twice the deposit under § 7-108(1-a).',
  },
  statuteCardLabel: '§ 7-108',
  statuteCardSubtext: 'NY General Obligations Law',
  penaltyCardLabel: 'up to 2×',
  penaltyCardSubtext: 'for willful violation; forfeiture otherwise',
  copy: {
    heroSummary:
      "A professional demand letter citing New York's General Obligations Law " +
      '\u00a7 7-108, the 14-day return deadline \u2014 one of the shortest in the ' +
      'country \u2014 and the 2\u00d7 willful-violation penalty. Ready in minutes.',
    lawSummary:
      'Under New York General Obligations Law \u00a7 7-108, your landlord has ' +
      'only 14 days from the date you vacate to return your security deposit or ' +
      'provide an itemized statement of any deductions. This is one of the ' +
      'shortest deadlines in the country.',
    penaltyLeadIn:
      "New York's 2019 Housing Stability and Tenant Protection Act significantly " +
      'strengthened tenant protections:',
    penaltyBullets: [
      "Security deposits are capped at one month's rent",
      'Missing the 14-day statement-and-return deadline forfeits any right to retain the deposit',
      'Buildings with six or more units must hold deposits in a separate interest-bearing New York account, disclosed to you (§ 7-103)',
      'Willful violations can result in damages of up to 2× the deposit under § 7-108',
    ],
    penaltyExample:
      'So a $2,000 deposit willfully withheld can support a court judgment of up ' +
      'to $4,000. Most landlords return the deposit quickly once they realize the ' +
      '14-day forfeiture rule has already been triggered.',
    statuteLine:
      'New York General Obligations Law \u00a7 7-108, \u00a7 7-103 escrow rules, ' +
      'and rent-stabilization protections where applicable \u2014 not generic ' +
      'legalese.',
  },
  notes: [
    {
      kind: 'recent_amendment',
      heading: 'Rent-stabilized carve-out (§ 7-107):',
      body:
        'Effective November 15, 2025, rent-stabilized tenants gained the 14-day ' +
        'return, itemization, and pre-move-out inspection/cure rights that ' +
        'previously applied more narrowly. Your letter applies these where your ' +
        'tenancy qualifies.',
    },
    {
      kind: 'scope_threshold',
      heading: 'Interest and escrow:',
      body:
        'The separate interest-bearing-account requirement under § 7-103 applies ' +
        'statewide to buildings with six or more units \u2014 not only in New ' +
        'York City. A narrow exception exists for owner-occupied buildings with ' +
        'fewer than three units.',
    },
    {
      kind: 'scope_threshold',
      heading: 'Housing types § 7-108 does not cover:',
      body:
        'The 14-day rules of § 7-108(1-a) do not apply to rent-controlled ' +
        'tenancies or to units in continuing-care retirement communities, ' +
        'assisted-living facilities, adult-care facilities, or certain senior ' +
        'residences for tenants 55 and older. If your unit is one of these, ' +
        'different rules govern your deposit.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'NY Gen. Oblig. Law §§ 7-108, 7-103, 7-107 (verified against statute text); HSTPA cap + § 7-107 carve-out confirmed (Phase 1 audit)',
};

// ===========================================================================
// PHASE 2 — BATCH 2 (CT, DE, GA, HI, ID, IL, IN). Facts verified in Phase 1;
// prose migrated from the live state pages and corrected against the audit.
// Corrections this batch: CT deadline 30→21 days (eff. 10/1/2023); ID penalty
// treble AND fees (not "or"); GA cap confirmed at 2 months (HB 404).
// ===========================================================================

const CONNECTICUT: SimpleJurisdiction = {
  type: 'simple',
  slug: 'connecticut',
  name: 'Connecticut',
  deadlineDays: 21,
  deadlineLabel: '21 days',
  statutes: [{ label: '§ 47a-21', full: 'Connecticut General Statutes § 47a-21' }],
  penalty: {
    kind: 'multiplier',
    multiplier: 2,
    attorneyFees: false,
    short: '2× + interest',
    long:
      'A landlord who violates the return-and-statement requirements is liable ' +
      'under § 47a-21(d)(2) for twice the amount of the full security deposit ' +
      'you paid \u2014 not merely the portion withheld \u2014 plus accrued interest.',
  },
  statuteCardLabel: '§ 47a-21',
  statuteCardSubtext: 'Connecticut General Statutes',
  penaltyCardLabel: '2× deposit',
  penaltyCardSubtext: 'for wrongful withholding under § 47a-21(d)',
  copy: {
    heroSummary:
      "A professional demand letter citing Connecticut's security deposit statute " +
      '(Conn. Gen. Stat. \u00a7 47a-21), the 21-day return deadline, and the ' +
      'double-damages penalty for wrongful withholding. Ready in minutes.',
    lawSummary:
      'Under Conn. Gen. Stat. \u00a7 47a-21, your landlord must return your ' +
      'deposit, with interest, within 21 days of the end of your tenancy or 15 ' +
      'days after you provide a forwarding address \u2014 whichever is later \u2014 ' +
      'along with a written, itemized statement of any deductions.',
    penaltyLeadIn:
      'If the landlord wrongfully withholds your deposit, you may recover:',
    penaltyBullets: [
      'Twice the amount of the security deposit paid, under § 47a-21(d)(2)',
      'All accrued interest on the deposit',
    ],
    penaltyExample:
      'So on a $1,500 deposit, a wrongful withholding can support a court ' +
      'judgment of $3,000 plus interest. Most landlords settle quickly once ' +
      'they realize you know the law.',
    statuteLine:
      'Conn. Gen. Stat. \u00a7 47a-21 and any others triggered by your ' +
      'circumstances \u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'outdated_figure',
      heading: 'Watch for outdated info:',
      body:
        'Connecticut\u2019s return deadline was reduced from 30 days to 21 days ' +
        'effective October 1, 2023. Many sources still cite the old 30-day figure ' +
        '\u2014 your letter uses the current 21-day rule.',
    },
    {
      kind: 'deposit_cap',
      heading: 'Good to know:',
      body:
        'Connecticut caps deposits at two months\u2019 rent (one month if you are ' +
        '62 or older), and your deposit must earn interest at a state-set rate. ' +
        'Your letter computes the correct deadline using the later of the two ' +
        'dates above.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'Conn. Gen. Stat. § 47a-21 (verified against statute text); 21-day deadline (eff. 10/1/2023) confirmed (Phase 1 audit)',
};

const DELAWARE: SimpleJurisdiction = {
  type: 'simple',
  slug: 'delaware',
  name: 'Delaware',
  deadlineDays: 20,
  deadlineLabel: '20 days',
  statutes: [{ label: '§ 5514', full: '25 Del. C. § 5514' }],
  penalty: {
    kind: 'multiplier',
    multiplier: 2,
    attorneyFees: false,
    short: '2× damages',
    long:
      'A landlord who wrongfully withholds any part of the deposit is liable for ' +
      'double the amount wrongfully withheld under § 5514(g)(1); failing to ' +
      'provide an itemized list forfeits the right to withhold. Separately, a ' +
      'landlord who failed to disclose the account holding your deposit can owe ' +
      'double the full deposit under § 5514(g)(2). A tenant who fails to provide ' +
      'a forwarding address relieves the landlord of double-damages liability ' +
      'under § 5514(h), though a one-year claim window remains.',
  },
  statuteCardLabel: '§ 5514',
  statuteCardSubtext: 'Delaware Code, Title 25',
  penaltyCardLabel: '2× damages',
  penaltyCardSubtext: 'double the amount wrongfully withheld, § 5514(g)(1)',
  copy: {
    heroSummary:
      "A professional demand letter citing Delaware's security deposit statute " +
      '(25 Del. C. \u00a7 5514), the 20-day return deadline, and the ' +
      'double-damages penalty for wrongful withholding. Ready in minutes.',
    lawSummary:
      'Under 25 Del. C. \u00a7 5514, your landlord has 20 days after your tenancy ' +
      'ends to return your security deposit or provide a written, itemized list ' +
      'of any deductions.',
    penaltyLeadIn:
      'If the landlord fails to return your deposit or provide the itemized list ' +
      'within 20 days, you may recover:',
    penaltyBullets: [
      'Double the amount wrongfully withheld under § 5514(g)(1)',
      'Double the full deposit under § 5514(g)(2) where the landlord failed to disclose the account holding your deposit',
    ],
    penaltyExample:
      'So a $1,500 deposit wrongfully withheld in full can support a court ' +
      'judgment of $3,000 (twice the amount withheld). Most landlords settle ' +
      'quickly once they realize you know the law.',
    statuteLine:
      '25 Del. C. \u00a7 5514 and any others triggered by your circumstances ' +
      '\u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'general',
      heading: 'Good to know:',
      body:
        'If the landlord failed to disclose the bank or escrow account holding ' +
        'your deposit, that can also forfeit the landlord\u2019s right to keep any ' +
        'of it. Deposits are capped at one month\u2019s rent for leases of one ' +
        'year or longer; higher amounts are allowed for furnished or shorter-term ' +
        'rentals.',
    },
    {
      kind: 'trigger_condition',
      heading: 'Provide a forwarding address:',
      body:
        'Under \u00a7 5514(h), a tenant who does not give a forwarding address ' +
        'relieves the landlord of the double-damages liability (a one-year claim ' +
        'window still remains). Your demand letter supplies your address in ' +
        'writing, which protects that remedy.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    '25 Del. C. § 5514 (verified against statute text); §5514(g)(1) = 2× withheld portion, §5514(g)(2) = 2× deposit (escrow/disclosure failures), §5514(h) address gate + 1-mo cap (≥1-yr leases) confirmed (legal audit, July 2026)',
};

const GEORGIA: SimpleJurisdiction = {
  type: 'simple',
  slug: 'georgia',
  name: 'Georgia',
  deadlineDays: 30,
  deadlineLabel: '30 days',
  statutes: [
    { label: '§ 44-7-34', full: 'O.C.G.A. § 44-7-34' },
    { label: '§ 44-7-35', full: 'O.C.G.A. § 44-7-35' },
  ],
  penalty: {
    kind: 'multiplier',
    multiplier: 3,
    attorneyFees: false,
    short: '3× (bad faith)',
    long:
      'A landlord who withholds the deposit in bad faith can be liable for three ' +
      'times the sum improperly withheld under § 44-7-35(c). The treble penalty ' +
      'is not automatic: a landlord who proves the withholding was unintentional ' +
      'and the result of a bona fide error despite reasonable procedures is ' +
      'liable only for the amount withheld, and landlords who own ten or fewer ' +
      'rental units and manage them personally are exempt from the treble ' +
      'penalty under § 44-7-36.',
  },
  statuteCardLabel: '§ 44-7-35',
  statuteCardSubtext: 'Official Code of Georgia Annotated',
  penaltyCardLabel: 'up to 3×',
  penaltyCardSubtext: 'for bad-faith withholding under § 44-7-35(c)',
  copy: {
    heroSummary:
      "A professional demand letter citing Georgia's security deposit statutes " +
      '(O.C.G.A. \u00a7 44-7-34 and \u00a7 44-7-35), the 30-day return deadline, ' +
      'and the treble-damages penalty for bad-faith withholding. Ready in minutes.',
    lawSummary:
      'Under O.C.G.A. \u00a7 44-7-34, your landlord has 30 days from the date you ' +
      'move out to return your security deposit or provide a written, itemized ' +
      'list of deductions.',
    penaltyLeadIn:
      'If the landlord withholds your deposit in bad faith \u2014 for example, ' +
      'refusing to return it, providing no itemization, or making clearly ' +
      'improper deductions \u2014 O.C.G.A. \u00a7 44-7-35 allows you to recover:',
    penaltyBullets: [
      'Three times the amount improperly withheld, where the withholding was in bad faith',
      'The full forfeiture of any right to withhold (and to sue you for damages) where the landlord missed the § 44-7-34 timelines',
    ],
    penaltyExample:
      'So a $1,500 deposit withheld in bad faith can support a court judgment of ' +
      'up to $4,500. Most landlords settle quickly once they realize you know ' +
      'the law.',
    statuteLine:
      'O.C.G.A. \u00a7 44-7-34, \u00a7 44-7-35, and any others triggered by your ' +
      'circumstances \u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'deposit_cap',
      heading: 'Deposit cap (HB 404):',
      body:
        'As of July 1, 2024, Georgia caps security deposits at two months\u2019 ' +
        'rent (for leases entered or renewed on or after that date). If you were ' +
        'charged more, your letter can raise it. Georgia had no cap before this.',
    },
    {
      kind: 'scope_threshold',
      heading: 'Small-landlord exemption from the treble penalty:',
      body:
        'Under O.C.G.A. \u00a7 44-7-36, a landlord who owns ten or fewer rental ' +
        'units and manages them personally (without a management agent) is not ' +
        'subject to the 3\u00d7 penalty. The 30-day return duty and the ' +
        'forfeiture rule still apply \u2014 your letter reflects whichever ' +
        'applies to your landlord.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'O.C.G.A. §§ 44-7-33, 44-7-34, 44-7-35, 44-7-36 (verified against versioned statute text); 2-mo cap (HB 404, eff. 7/1/2024) + §44-7-36 exemption + §44-7-35(c) good-faith escape confirmed (legal audit, July 2026)',
};

const HAWAII: SimpleJurisdiction = {
  type: 'simple',
  slug: 'hawaii',
  name: 'Hawaii',
  deadlineDays: 14,
  deadlineLabel: '14 days',
  statutes: [{ label: '§ 521-44', full: 'Hawaii Revised Statutes § 521-44' }],
  penalty: {
    kind: 'multiplier',
    multiplier: 3,
    attorneyFees: false,
    short: 'up to 3× (willful)',
    long:
      'Wrongful AND willful retention exposes the landlord to up to treble (three ' +
      'times) the amount wrongfully withheld plus the cost of suit; merely ' +
      'wrongful (not willful) retention is recoverable at single damages plus ' +
      'costs under § 521-44.',
  },
  statuteCardLabel: '§ 521-44',
  statuteCardSubtext: 'Hawaii Revised Statutes',
  penaltyCardLabel: 'up to 3×',
  penaltyCardSubtext: 'for willful withholding under § 521-44',
  copy: {
    heroSummary:
      "A professional demand letter citing Hawaii's security deposit statute " +
      '(HRS \u00a7 521-44), the 14-day return deadline, and the treble-damages ' +
      'penalty for willful withholding. Ready in minutes.',
    lawSummary:
      'Under HRS \u00a7 521-44, your landlord has 14 days after your tenancy ends ' +
      'to return your security deposit or provide a written, itemized statement ' +
      'of any deductions.',
    penaltyLeadIn:
      'If the landlord willfully retains your deposit in violation of the ' +
      'statute, you may recover:',
    penaltyBullets: [
      'Up to three times the amount wrongfully withheld',
      'Plus, where applicable, your costs',
    ],
    penaltyExample:
      'So a $1,500 deposit willfully withheld can support a court judgment of up ' +
      'to $4,500. Most landlords settle quickly once they realize you know the law.',
    statuteLine:
      'HRS \u00a7 521-44 and any others triggered by your circumstances \u2014 ' +
      'not generic legalese.',
  },
  notes: [
    {
      kind: 'trigger_condition',
      heading: 'Note:',
      body:
        'Hawaii\u2019s 3\u00d7 penalty applies specifically to willful retention; ' +
        'merely wrongful withholding is recoverable at single damages plus costs. ' +
        'Attorney fees are not available in these actions. Your letter frames the ' +
        'demand around the facts of your situation.',
    },
    {
      kind: 'deposit_cap',
      heading: 'Good to know:',
      body:
        'Hawaii caps security deposits at one month\u2019s rent, plus an optional ' +
        'pet deposit of up to one month (no pet deposit may be charged for an ' +
        'assistance animal \u2014 a reasonable accommodation under \u00a7 515-3).',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'HRS § 521-44 (verified against statute text); treble-requires-willful + no-attorney-fees confirmed (Phase 1 audit)',
};

const IDAHO: SimpleJurisdiction = {
  type: 'simple',
  slug: 'idaho',
  name: 'Idaho',
  deadlineDays: 21,
  deadlineLabel: '21 days',
  statutes: [
    { label: '§ 6-321', full: 'Idaho Code § 6-321' },
    { label: '§ 6-320', full: 'Idaho Code § 6-320' },
  ],
  penalty: {
    kind: 'multiplier',
    multiplier: 3,
    attorneyFees: false,
    short: 'up to 3× + costs',
    long:
      'A tenant suing over a wrongfully retained deposit proceeds under ' +
      '\u00a7 6-320, which allows recovery of damages and costs; under ' +
      '\u00a7 6-317 the court may, in its discretion, award up to three times ' +
      'the actual damages.',
  },
  statuteCardLabel: '§ 6-321',
  statuteCardSubtext: 'Idaho Code',
  penaltyCardLabel: 'up to 3×',
  penaltyCardSubtext: 'discretionary treble under § 6-317, plus costs',
  copy: {
    heroSummary:
      "A professional demand letter citing Idaho's security deposit statute " +
      '(Idaho Code \u00a7 6-321), the return deadline, and the treble-damages ' +
      'penalty for bad-faith withholding. Ready in minutes.',
    lawSummary:
      'Under Idaho Code \u00a7 6-321, your landlord has 21 days after your ' +
      'tenancy ends to return your security deposit, or up to 30 days if your ' +
      'lease specifies a longer period, along with a written, itemized statement ' +
      'of any deductions.',
    penaltyLeadIn:
      'If the landlord retains your deposit in bad faith, you may recover:',
    penaltyBullets: [
      'Your actual damages, plus up to three times that amount at the court\u2019s discretion under § 6-317',
      'Court costs and disbursements under § 6-320(c)',
    ],
    penaltyExample:
      'So a $1,500 deposit wrongfully withheld can support a court judgment of up ' +
      'to $4,500. Most landlords settle quickly once they realize you know the law.',
    statuteLine:
      'Idaho Code \u00a7 6-321, \u00a7 6-320, and any others triggered by your ' +
      'circumstances \u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'general',
      heading: 'Good to know:',
      body:
        'The treble remedy is discretionary \u2014 the court \u201cmay\u201d ' +
        'award up to 3\u00d7 under \u00a7 6-317; it is not automatic. Idaho sets ' +
        'no statewide deposit cap; a landlord using a management agent must hold ' +
        'the deposit in a separate insured account.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'Idaho Code §§ 6-321, 6-320, 6-317, 12-120(3) (verified against official statute text; treble = §6-317 discretionary on actual damages; §6-320(c) costs only; no reliable residential fee statute — Treasure Valley v. Chason) (legal audit, July 2026)',
};

const ILLINOIS: SimpleJurisdiction = {
  type: 'simple',
  slug: 'illinois',
  name: 'Illinois',
  homepageDeadlineNote:
    '45 days is the return deadline \u2014 30 days is only the itemized-statement window. See the full Illinois rule.',
  deadlineDays: 45,
  deadlineLabel: '30 / 45 days',
  statutes: [
    { label: '765 ILCS 710', full: 'Illinois Security Deposit Return Act, 765 ILCS 710' },
  ],
  penalty: {
    kind: 'multiplier',
    multiplier: 2,
    attorneyFees: true,
    short: '2× + fees (bad faith)',
    long:
      'A landlord who acts in bad faith is liable for twice the amount of the ' +
      'deposit due, plus court costs and reasonable attorney\u2019s fees. Unlike ' +
      'the Chicago ordinance, the state Act\u2019s penalty is not automatic ' +
      '\u2014 it requires a finding of bad faith.',
  },
  statuteCardLabel: '765 ILCS 710',
  statuteCardSubtext: 'Security Deposit Return Act',
  penaltyCardLabel: '2× + fees',
  penaltyCardSubtext: 'on a bad-faith finding',
  copy: {
    heroSummary:
      "A professional demand letter citing Illinois's Security Deposit Return Act " +
      '(765 ILCS 710), the 30-day itemization and 45-day return deadlines, and ' +
      'the double-damages penalty for bad-faith withholding. Ready in minutes.',
    lawSummary:
      'Under the Illinois Security Deposit Return Act (765 ILCS 710), your ' +
      'landlord must give you an itemized statement of any damages within 30 days ' +
      'of move-out, and return your deposit (or the balance) within 45 days of ' +
      'move-out. Since January 1, 2024, the Act applies to residential rentals ' +
      'statewide regardless of building size.',
    penaltyLeadIn:
      'If the landlord withholds your deposit in bad faith \u2014 for example, ' +
      'refusing to return it, providing no itemization, or making clearly ' +
      'improper deductions \u2014 you may recover:',
    penaltyBullets: [
      'Two times the security deposit due (on a bad-faith finding)',
      'Court costs',
      "Reasonable attorney's fees",
    ],
    penaltyExample:
      'So a $1,500 deposit wrongfully withheld can support a court judgment of ' +
      '$3,000 plus court costs and fees. Most landlords settle quickly once they ' +
      'realize you know the law.',
    statuteLine:
      '765 ILCS 710 and any others triggered by your circumstances \u2014 not ' +
      'generic legalese.',
  },
  notes: [
    {
      kind: 'recent_amendment',
      heading: 'The old 5-unit threshold is gone:',
      body:
        'Public Act 103-224 (effective January 1, 2024) removed the Act\u2019s ' +
        'old five-unit building threshold. The Security Deposit Return Act now ' +
        'covers Illinois residential rentals regardless of how many units your ' +
        'building has \u2014 sources still describing a \u201c5+ units only\u201d ' +
        'rule are out of date. Local ordinances (Chicago, Cook County) can add ' +
        'further protections on top.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    '765 ILCS 710 + P.A. 103-224 (verified against statute text; 5-unit gate repealed eff. 1/1/2024; bad-faith-finding requirement confirmed) (legal audit, July 2026)',
};

const INDIANA: SimpleJurisdiction = {
  type: 'simple',
  slug: 'indiana',
  name: 'Indiana',
  deadlineDays: 45,
  deadlineLabel: '45 days',
  statutes: [
    { label: '§ 32-31-3-12', full: 'Indiana Code § 32-31-3-12' },
  ],
  penalty: {
    kind: 'forfeiture',
    attorneyFees: true,
    short: 'Forfeiture + fees',
    long:
      'A landlord who fails to provide the itemized list within 45 days forfeits ' +
      'the right to retain any part of the deposit; the tenant recovers the full ' +
      'deposit due plus reasonable attorney\u2019s fees and court costs. Indiana ' +
      'has no damages multiplier.',
  },
  statuteCardLabel: '§ 32-31-3-12',
  statuteCardSubtext: 'Indiana Code',
  penaltyCardLabel: 'Forfeiture',
  penaltyCardSubtext: 'of the right to withhold, plus fees',
  copy: {
    heroSummary:
      "A professional demand letter citing Indiana's security deposit statute " +
      '(Ind. Code \u00a7 32-31-3-12), the 45-day return deadline, and the ' +
      'forfeiture rule when a landlord skips the itemized list. Ready in minutes.',
    lawSummary:
      'Under Ind. Code \u00a7 32-31-3-12, your landlord has 45 days after your ' +
      'tenancy ends to return your security deposit or provide a written, ' +
      'itemized list of any deductions.',
    penaltyLeadIn:
      'Indiana does not use a 2\u00d7 or 3\u00d7 multiplier. A landlord who fails ' +
      'to provide the itemized list within 45 days forfeits the right to keep any ' +
      'part of your deposit, and you may recover:',
    penaltyBullets: [
      'The full deposit back, regardless of claimed deductions',
      "Reasonable attorney's fees",
    ],
    penaltyExample:
      'So if your landlord misses the 45-day deadline or skips the itemized list, ' +
      'the deductions collapse and you are owed the entire deposit plus your fees. ' +
      'Most landlords return it quickly once they realize their right to withhold ' +
      'is gone.',
    statuteLine:
      'Ind. Code \u00a7 32-31-3-12 and any others triggered by your circumstances ' +
      '\u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'trigger_condition',
      heading: 'Important:',
      body:
        'You must give your landlord a written forwarding address to claim ' +
        'attorney fees \u2014 which your demand letter provides. Indiana sets no ' +
        'statewide deposit cap.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'Ind. Code §§ 32-31-3-12, -14, -15, -16 (verified against statute text); forfeiture/no-multiplier + fee-address gate confirmed (Phase 1 audit)',
};

// ===========================================================================
// PHASE 2 — BATCH 3 (IA, KS, KY, LA, ME, MD, MA, MI, MN, MS). Facts verified
// in Phase 1; prose migrated from live pages and corrected against the audit.
// Notable: IA penalty = 2× MONTHLY RENT (not deposit); KY is URLTA-gated with
// a forfeiture remedy (Phase 5 flag #3 — no clean 30/60 rule); MD cap now 1mo
// for leases on/after 10/1/2024; MI penalty is process-dependent.
// ===========================================================================

const IOWA: SimpleJurisdiction = {
  type: 'simple',
  slug: 'iowa',
  name: 'Iowa',
  deadlineDays: 30,
  deadlineLabel: '30 days',
  statutes: [{ label: '§ 562A.12', full: 'Iowa Code § 562A.12' }],
  penalty: {
    kind: 'multiplier',
    multiplier: 2,
    attorneyFees: false,
    short: 'up to 2× monthly rent',
    long:
      'Bad-faith retention exposes the landlord to punitive damages not to ' +
      'exceed twice the MONTHLY RENT (not twice the deposit), plus the ' +
      'tenant\u2019s actual damages, under § 562A.12(7)\u2013(8).',
  },
  statuteCardLabel: '§ 562A.12',
  statuteCardSubtext: 'Iowa Code',
  penaltyCardLabel: 'up to 2× rent',
  penaltyCardSubtext: 'measured against monthly rent, for bad faith',
  copy: {
    heroSummary:
      "A professional demand letter citing Iowa's security deposit statute " +
      '(Iowa Code \u00a7 562A.12), the 30-day return deadline, and the punitive ' +
      'penalty for bad-faith withholding. Ready in minutes.',
    lawSummary:
      'Under Iowa Code \u00a7 562A.12, your landlord has 30 days after your ' +
      'tenancy ends and you provide a mailing address to return your security ' +
      'deposit or provide a written, itemized statement of any deductions.',
    penaltyLeadIn:
      'If the landlord withholds your deposit in bad faith, you may recover:',
    penaltyBullets: [
      'Punitive damages of up to twice your monthly rent',
      'Your actual damages',
    ],
    penaltyExample:
      'So beyond the return of your deposit, bad-faith withholding exposes the ' +
      'landlord to punitive damages of up to twice your monthly rent. Most ' +
      'landlords settle quickly once they realize you know the law.',
    statuteLine:
      'Iowa Code \u00a7 562A.12 and any others triggered by your circumstances ' +
      '\u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'trigger_condition',
      heading: 'Note:',
      body:
        'Iowa\u2019s punitive penalty is measured against your monthly rent, not ' +
        'the deposit. The 30-day clock starts only once the landlord has your ' +
        'forwarding address \u2014 which your letter provides. A landlord who ' +
        'fails to provide a written statement within 30 days forfeits the right ' +
        'to withhold.',
    },
    {
      kind: 'deposit_cap',
      heading: 'Deposit cap:',
      body: 'Iowa caps security deposits at two months\u2019 rent.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'Iowa Code § 562A.12 (verified against statute text); 2×-monthly-rent penalty + 2-mo cap confirmed (Phase 1 audit)',
};

const KANSAS: SimpleJurisdiction = {
  type: 'simple',
  slug: 'kansas',
  name: 'Kansas',
  deadlineDays: 30,
  deadlineLabel: '14 / 30 days',
  statutes: [{ label: '§ 58-2550', full: 'K.S.A. § 58-2550' }],
  penalty: {
    kind: 'multiplier',
    multiplier: 1.5,
    attorneyFees: false,
    short: '1.5× damages',
    long:
      'A landlord who fails to comply is liable under § 58-2550(c) for the ' +
      'portion of the deposit due PLUS damages equal to one and one-half (1.5) ' +
      'times the amount wrongfully withheld \u2014 the 1.5\u00d7 is added on top ' +
      'of the deposit itself, and Kansas courts treat it as non-discretionary.',
  },
  statuteCardLabel: '§ 58-2550',
  statuteCardSubtext: 'Kansas Statutes Annotated',
  penaltyCardLabel: '1.5× damages',
  penaltyCardSubtext: 'for wrongful withholding',
  copy: {
    heroSummary:
      "A professional demand letter citing Kansas's security deposit statute " +
      '(K.S.A. \u00a7 58-2550), the return deadline, and the 1.5\u00d7 penalty ' +
      'for wrongful withholding. Ready in minutes.',
    lawSummary:
      'Under K.S.A. \u00a7 58-2550, your landlord must return your security ' +
      'deposit within 14 days after determining the amount of any deductions, ' +
      'but no more than 30 days after your tenancy ends, along with a written, ' +
      'itemized statement.',
    penaltyLeadIn:
      'If the landlord wrongfully withholds your deposit, you may recover:',
    penaltyBullets: [
      'The portion of the deposit wrongfully withheld, plus',
      'Damages equal to one and one-half times that amount, on top',
    ],
    penaltyExample:
      'So a $1,500 deposit wrongfully withheld can support a court judgment of ' +
      '$3,750 \u2014 the $1,500 back plus $2,250 in damages. Most landlords ' +
      'settle quickly once they realize you know the law.',
    statuteLine:
      'K.S.A. \u00a7 58-2550 and any others triggered by your circumstances ' +
      '\u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'deposit_cap',
      heading: 'Deposit cap:',
      body:
        'Kansas caps deposits at one month\u2019s rent (unfurnished) or 1.5 ' +
        'months\u2019 rent (furnished), plus an additional pet deposit of up to ' +
        'half a month\u2019s rent.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'K.S.A. §§ 58-2550, 58-2547 (verified against statute text); deposit-due + 1.5× (Geiger v. Wallace), non-discretionary (Love v. Monarch), no fee provision — §58-2547(a)(3) bars rental-agreement fee-shifting (legal audit, July 2026)',
};

const KENTUCKY: ScopeGatedJurisdiction = {
  type: 'scope_gated',
  slug: 'kentucky',
  name: 'Kentucky',
  homepageDeadlineNote:
    'These are notice/response windows, not simple return deadlines \u2014 see the full Kentucky rule.',
  deadlineDays: 30,
  deadlineLabel: '30 / 60 days',
  statutes: [{ label: '§ 383.580', full: 'KRS § 383.580' }],
  penalty: {
    kind: 'forfeiture',
    attorneyFees: false,
    short: 'Forfeiture',
    long:
      'A landlord who fails to hold the deposit in a properly disclosed separate ' +
      'account, or who otherwise fails to comply, forfeits the right to retain ' +
      'any portion of the deposit under § 383.580. Kentucky uses no damages ' +
      'multiplier; the "double damages" some sources cite is not supported by ' +
      'the statute\u2019s text.',
  },
  scope: {
    appliesTo:
      'Tenancies in jurisdictions that have adopted Kentucky\u2019s URLTA \u2014 ' +
      'including Louisville/Jefferson County and Lexington-Fayette.',
    exemptFallback:
      'In jurisdictions that have NOT adopted URLTA, this statute does not apply ' +
      'and weaker common-law and lease-based rules govern instead. Your letter ' +
      'reflects whichever applies to your location.',
  },
  statuteCardLabel: '§ 383.580',
  statuteCardSubtext: 'Kentucky Revised Statutes',
  penaltyCardLabel: 'Forfeiture',
  penaltyCardSubtext: 'of the right to withhold (URLTA areas)',
  copy: {
    heroSummary:
      "A professional demand letter citing Kentucky's security deposit statute " +
      '(KRS \u00a7 383.580), the return timeline, and the separate-account ' +
      'forfeiture rule that most landlords overlook. Ready in minutes.',
    lawSummary:
      'Under KRS \u00a7 383.580, in URLTA jurisdictions your landlord must hold ' +
      'your deposit in a separate Kentucky account disclosed to you, and must ' +
      'account for the deposit after you move out. The statute\u2019s 30- and ' +
      '60-day rules govern how unclaimed refunds and tenant responses are ' +
      'handled \u2014 they are not a simple "30 days no-deduction / 60 days ' +
      'with-deduction" deadline.',
    penaltyLeadIn:
      'Kentucky does not use a 2\u00d7 or 3\u00d7 multiplier. Instead, a landlord ' +
      'who fails to hold your deposit in a properly disclosed separate account ' +
      'forfeits the right to keep any portion of it, and you may recover:',
    penaltyBullets: [
      'The full deposit back, regardless of claimed deductions',
      'Your costs in pursuing the claim',
    ],
    penaltyExample:
      'So if your landlord skipped the separate disclosed account, the deductions ' +
      'collapse and you are owed the entire deposit. Most landlords return it ' +
      'quickly once they realize the law is on your side.',
    statuteLine:
      'KRS \u00a7 383.580 and any others triggered by your circumstances \u2014 ' +
      'not generic legalese.',
  },
  notes: [
    {
      kind: 'scope_threshold',
      heading: 'Two important traps:',
      body:
        '(1) Kentucky\u2019s deposit law applies only in cities and counties that ' +
        'have adopted the URLTA \u2014 including Louisville/Jefferson County and ' +
        'Lexington-Fayette. Elsewhere, weaker common-law rules apply. (2) If the ' +
        'landlord sends an itemized list and you do not respond within the ' +
        'statutory window, the landlord may keep the deposit \u2014 so respond ' +
        'promptly. Your letter is built to be that timely response.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'KRS § 383.580, § 383.500 (verified against statute text; MEDIUM confidence — URLTA-gated, forfeiture remedy, no clean 30/60 rule) (Phase 1 audit)',
};

const LOUISIANA: SimpleJurisdiction = {
  type: 'simple',
  slug: 'louisiana',
  name: 'Louisiana',
  deadlineDays: 30,
  deadlineLabel: '1 month',
  statutes: [
    { label: '§ 9:3251', full: 'La. R.S. § 9:3251' },
    { label: '§ 9:3252', full: 'La. R.S. § 9:3252' },
  ],
  penalty: {
    kind: 'greater_of',
    multiplier: 2,
    fixedAmount: 300,
    attorneyFees: false,
    short: 'greater of $300 or 2×',
    long:
      'Willful failure to return the deposit exposes the landlord, under ' +
      '\u00a7 9:3252, to the wrongfully retained portion PLUS the greater of ' +
      '$300 or twice the amount wrongfully retained. Failure to remit within 30 ' +
      'days after your written demand is itself deemed willful \u2014 which is ' +
      'exactly what this letter establishes.',
  },
  statuteCardLabel: '§ 9:3251',
  statuteCardSubtext: 'Louisiana Revised Statutes',
  penaltyCardLabel: '$300 or 2×',
  penaltyCardSubtext: 'greater of, on top of the retained portion',
  copy: {
    heroSummary:
      "A professional demand letter citing Louisiana's Lessee's Deposit Act " +
      '(La. R.S. \u00a7 9:3251\u20133252), the one-month return deadline, and the ' +
      'greater-of-$300-or-2\u00d7 penalty for willful withholding. Ready in minutes.',
    lawSummary:
      'Under La. R.S. \u00a7 9:3251, your landlord has one month after the lease ' +
      'ends to return your security deposit or provide a written, itemized ' +
      'statement of any deductions. A written demand from you is generally ' +
      'required to trigger the penalty.',
    penaltyLeadIn:
      'If the landlord willfully fails to return your deposit after written ' +
      'demand, La. R.S. \u00a7 9:3252 allows you to recover:',
    penaltyBullets: [
      'The portion of the deposit wrongfully retained, plus',
      'The greater of $300 or two times the amount wrongfully retained, on top',
    ],
    penaltyExample:
      'So a $1,500 deposit wrongfully withheld can support a court judgment of ' +
      '$4,500 \u2014 the $1,500 back plus $3,000 in damages (the 2\u00d7 figure, ' +
      'since it exceeds $300). Most landlords settle quickly once they realize ' +
      'you know the law.',
    statuteLine:
      'La. R.S. \u00a7 9:3251, \u00a7 9:3252, and any others triggered by your ' +
      'circumstances \u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'outdated_figure',
      heading: 'Good to know:',
      body:
        'A 2019 amendment raised this penalty \u2014 outdated sources still cite ' +
        'an old $200 figure. The current floor is $300, or double the amount ' +
        'withheld if that is greater. Louisiana sets no statewide deposit cap.',
    },
    {
      kind: 'trigger_condition',
      heading: 'When the return duty does not apply (§ 9:3251(C)):',
      body:
        'The one-month return duty does not apply if you abandoned the premises ' +
        'without giving notice as required by your lease, or left before the ' +
        'lease ended. In those situations your demand rests on your lease and ' +
        'general contract rights instead \u2014 your letter reflects whichever ' +
        'applies.',
    },
    {
      kind: 'recent_amendment',
      heading: 'Act 63 (effective August 1, 2026):',
      body:
        'For a landlord who retains any part of the deposit, Act 63 of 2026 ' +
        'allows the itemized statement to be sent within one month after the ' +
        'tenancy ends or up to fifteen days after that one-month date. The ' +
        'deadline to RETURN the deposit itself is unchanged \u2014 one month ' +
        'after the lease terminates.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'La. R.S. §§ 9:3251, 9:3252 + 2026 Act 63/HB292 engrossed-and-enacted text (verified against legis.la.gov; §3251(C) exclusion + retained-portion-plus-greater-of penalty + Act 63 itemization window, eff. 8/1/2026) (legal audit, July 2026)',
};

const MAINE: ConditionalJurisdiction = {
  type: 'conditional',
  slug: 'maine',
  name: 'Maine',
  branches: [
    { deadlineDays: 21, condition: 'tenancy at will (21 days after termination or surrender, whichever is later)' },
    { deadlineDays: 30, condition: 'written lease (within the lease-stated time, not to exceed 30 days)' },
  ],
  deadlineLabel: '21 / 30 days',
  triggerSummary:
    'The deadline is 21 days for a tenancy at will, or up to 30 days under a ' +
    'written lease. Your letter applies the correct one for your tenancy.',
  statutes: [
    { label: '§ 6033', full: '14 M.R.S. § 6033' },
    { label: '§ 6034', full: '14 M.R.S. § 6034' },
  ],
  penalty: {
    kind: 'multiplier',
    multiplier: 2,
    attorneyFees: true,
    short: '2× + fees',
    long:
      'Wrongful retention exposes the landlord to double the amount wrongfully ' +
      'withheld plus reasonable attorney fees and court costs under § 6034(2). ' +
      'A tenant gives 7 days\u2019 pre-suit notice; the landlord\u2019s failure ' +
      'to return within 7 days creates a presumption of wrongful retention.',
  },
  statuteCardLabel: '§ 6033',
  statuteCardSubtext: 'Maine Revised Statutes, Title 14',
  penaltyCardLabel: '2× damages',
  penaltyCardSubtext: 'for wrongful retention, plus fees',
  copy: {
    heroSummary:
      "A professional demand letter citing Maine's security deposit statute " +
      '(14 M.R.S. \u00a7 6033), the return deadline, and the double-damages ' +
      'penalty for wrongful retention. Ready in minutes.',
    lawSummary:
      'Under 14 M.R.S. \u00a7 6033, your landlord must return your deposit within ' +
      '21 days if you held a tenancy at will, or within 30 days under a written ' +
      'lease, along with a written, itemized statement of any deductions.',
    penaltyLeadIn:
      'If the landlord wrongfully retains your deposit, you may recover under ' +
      '\u00a7 6034:',
    penaltyBullets: [
      'Double the amount wrongfully withheld',
      "Reasonable attorney's fees and costs",
    ],
    penaltyExample:
      'So a $1,500 deposit wrongfully withheld can support a court judgment of ' +
      '$3,000 plus fees. Most landlords settle quickly once they realize you ' +
      'know the law.',
    statuteLine:
      '14 M.R.S. \u00a7 6033, \u00a7 6034, and any others triggered by your ' +
      'circumstances \u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'trigger_condition',
      heading: 'Note:',
      body:
        'Before suing for double damages, Maine asks you to give the landlord 7 ' +
        'days\u2019 notice of your intent \u2014 your demand letter serves that ' +
        'purpose. Deposits are capped at two months\u2019 rent.',
    },
    {
      kind: 'scope_threshold',
      heading: 'Scope exemption:',
      body:
        'These rules do not apply to tenancies in owner-occupied buildings with ' +
        'five or fewer units (\u00a7 6037). Your letter reflects whichever rules ' +
        'apply to your building.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    '14 M.R.S. §§ 6031\u20136038 (verified against statute text); at-will/lease branch + owner-occ ≤5 exemption confirmed (Phase 1 audit)',
};

const MARYLAND: SimpleJurisdiction = {
  type: 'simple',
  slug: 'maryland',
  name: 'Maryland',
  deadlineDays: 45,
  deadlineLabel: '45 days',
  statutes: [{ label: '§ 8-203', full: 'Md. Code, Real Property § 8-203' }],
  penalty: {
    kind: 'multiplier',
    multiplier: 3,
    attorneyFees: true,
    short: 'up to 3× + fees',
    long:
      'A landlord who, without a reasonable basis, fails to return the deposit ' +
      'within 45 days is liable for up to threefold (3×) the withheld amount ' +
      'plus reasonable attorney fees under § 8-203(e)(4). Failure to send the ' +
      'damage list forfeits the right to withhold for damages.',
  },
  statuteCardLabel: '§ 8-203',
  statuteCardSubtext: 'Md. Code, Real Property',
  penaltyCardLabel: 'up to 3×',
  penaltyCardSubtext: 'for withholding without a reasonable basis, plus fees',
  copy: {
    heroSummary:
      "A professional demand letter citing Maryland's security deposit statute " +
      '(Md. Real Property \u00a7 8-203), the 45-day return deadline, and the ' +
      'treble-damages penalty for withholding without a reasonable basis. Ready ' +
      'in minutes.',
    lawSummary:
      'Under Md. Real Property \u00a7 8-203, your landlord has 45 days after your ' +
      'tenancy ends to return your security deposit, with any accrued interest, ' +
      'along with a written, itemized list of any deductions.',
    penaltyLeadIn:
      'If the landlord withholds your deposit without a reasonable basis, you may ' +
      'recover:',
    penaltyBullets: [
      'Up to three times the amount wrongfully withheld',
      "Reasonable attorney's fees",
    ],
    penaltyExample:
      'So a $1,500 deposit wrongfully withheld can support a court judgment of up ' +
      'to $4,500 plus fees. Most landlords settle quickly once they realize you ' +
      'know the law.',
    statuteLine:
      'Md. Real Property \u00a7 8-203 and any others triggered by your ' +
      'circumstances \u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'deposit_cap',
      heading: 'Deposit cap (updated):',
      body:
        'For leases signed on or after October 1, 2024, Maryland caps deposits ' +
        'at one month\u2019s rent (down from two months). Leases signed before ' +
        'that date remain subject to the two-month maximum, and where the tenant ' +
        'uses a utility- or housing-assistance program the cap can be up to two ' +
        'months\u2019 rent. Charging more than the applicable cap exposes the ' +
        'landlord to up to threefold the excess plus fees.',
    },
    {
      kind: 'general',
      heading: 'Interest:',
      body:
        'Deposits must earn simple interest at the greater of the daily U.S. ' +
        'Treasury one-year yield curve rate or 1.5% per year, accruing monthly, ' +
        'for deposits of $50 or more held at least six months. (Older sources ' +
        'citing a flat 3% figure are stale.)',
    },
    {
      kind: 'trigger_condition',
      heading: 'If you were evicted or abandoned the unit:',
      body:
        'Under \u00a7 8-203(h), the ordinary return rules do not apply to a ' +
        'tenant who was evicted or abandoned the premises. In that situation you ' +
        'must send the landlord a written demand for the deposit within 45 days ' +
        '\u2014 which this letter can serve as \u2014 and the landlord\u2019s ' +
        'obligations then run from your demand.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'Md. Code, Real Prop. §§ 8-203, 8-203.1 (verified at T1 via mgaleg Statute_Web PDFs); 1-mo cap = HB 693/Ch. 124 (2024), eff. 10/1/2024, lease-date applicability from session law; Treasury/1.5% interest; §8-203(h) evicted/abandoned 45-day demand (legal audit, July 2026)',
};

const MASSACHUSETTS: SimpleJurisdiction = {
  type: 'simple',
  slug: 'massachusetts',
  name: 'Massachusetts',
  deadlineDays: 30,
  deadlineLabel: '30 days',
  statutes: [{ label: 'c. 186 § 15B', full: 'M.G.L. c. 186, § 15B' }],
  penalty: {
    kind: 'multiplier',
    multiplier: 3,
    attorneyFees: true,
    short: '3× + interest + fees',
    long:
      'Certain (common) violations trigger MANDATORY treble (3×) damages plus ' +
      'interest, court costs, and attorney fees under § 15B(7) \u2014 no ' +
      'bad-faith proof needed. The treble triggers are the violations in ' +
      '§ 15B(6)(a), (d), and (e): failing to hold the deposit in a separate ' +
      'interest-bearing Massachusetts account, failing to return the deposit ' +
      'within 30 days, and failing to transfer the deposit properly when the ' +
      'property is sold. A missing sworn itemized list forfeits the right to ' +
      'withhold \u2014 the full deposit comes back \u2014 but is not itself a ' +
      'treble trigger.',
  },
  statuteCardLabel: 'c. 186 § 15B',
  statuteCardSubtext: 'Massachusetts General Laws',
  penaltyCardLabel: '3× damages',
  penaltyCardSubtext: 'mandatory for § 15B(7) violations, plus fees',
  copy: {
    heroSummary:
      "A professional demand letter citing Massachusetts's security deposit law " +
      '(M.G.L. c. 186, \u00a7 15B), the 30-day return deadline, and the mandatory ' +
      'treble-damages penalty that attaches to the most common violations. Ready ' +
      'in minutes.',
    lawSummary:
      'Under M.G.L. c. 186, \u00a7 15B, your landlord has 30 days after your ' +
      'tenancy ends to return your security deposit. If any portion is kept for ' +
      'damages, the landlord must provide a sworn, itemized statement within that ' +
      '30-day window.',
    penaltyLeadIn:
      'Massachusetts provides triple damages, but only for the specific ' +
      'violations listed in \u00a7 15B(6)(a), (d), and (e): failing to hold the ' +
      'deposit in a proper interest-bearing escrow account, failing to return ' +
      'the deposit within 30 days, or failing to transfer it properly when the ' +
      'property is sold. (Skipping the sworn itemized statement forfeits the ' +
      'landlord\u2019s right to withhold anything \u2014 the whole deposit comes ' +
      'back \u2014 though that failure alone does not treble.) When a treble ' +
      'trigger applies, you may recover:',
    penaltyBullets: [
      'Three times the deposit amount',
      '5% interest',
      "Reasonable attorney's fees and court costs",
    ],
    penaltyExample:
      'So a $1,500 deposit caught by a \u00a7 15B(7) violation can support a court ' +
      'judgment of $4,500 plus interest and fees. Most landlords settle quickly ' +
      'once they realize you know the law.',
    statuteLine:
      'M.G.L. c. 186, \u00a7 15B and any others triggered by your circumstances ' +
      '\u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'deposit_cap',
      heading: 'Deposit cap:',
      body:
        'Massachusetts caps deposits at one month\u2019s rent, with no separate ' +
        'pet or cleaning deposits allowed. A landlord must give a Statement of ' +
        'Condition within 10 days and hold the deposit in a separate ' +
        'interest-bearing Massachusetts account.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'M.G.L. c. 186, § 15B (verified against statute text; §15B(7) treble runs on §15B(6)(a),(d),(e) only; Mellor v. Berman on mandatory treble) (legal audit, July 2026)',
};

const MICHIGAN: SimpleJurisdiction = {
  type: 'simple',
  slug: 'michigan',
  name: 'Michigan',
  deadlineDays: 30,
  deadlineLabel: '30 days',
  statutes: [
    { label: '§ 554.609', full: 'MCL § 554.609' },
    { label: '§ 554.613', full: 'MCL § 554.613' },
  ],
  penalty: {
    kind: 'multiplier',
    multiplier: 2,
    attorneyFees: false,
    short: '2× (process-gated)',
    long:
      'A landlord retaining the deposit for contested damages must file suit for ' +
      'a money judgment within 45 days of termination; failure both waives all ' +
      'claimed damages AND makes the landlord liable for double the amount ' +
      'wrongfully retained under § 554.613.',
  },
  statuteCardLabel: '§ 554.613',
  statuteCardSubtext: 'Michigan Compiled Laws',
  penaltyCardLabel: '2× damages',
  penaltyCardSubtext: 'if the landlord skips the 45-day suit',
  copy: {
    heroSummary:
      "A professional demand letter citing Michigan's security deposit statute " +
      '(MCL \u00a7 554.609, \u00a7 554.613), the 30-day return deadline, and the ' +
      'double-damages penalty when a landlord skips the required lawsuit. Ready ' +
      'in minutes.',
    lawSummary:
      'Under MCL \u00a7 554.609, your landlord has 30 days after your tenancy ' +
      'ends to mail you an itemized list of any deductions and return the balance ' +
      'of your security deposit. This requires a written forwarding address from ' +
      'you.',
    penaltyLeadIn:
      'If the landlord keeps your deposit improperly \u2014 and fails to file ' +
      'suit within 45 days to justify the deductions \u2014 MCL \u00a7 554.613 ' +
      'allows you to recover:',
    penaltyBullets: [
      'Two times the amount wrongfully withheld',
    ],
    penaltyExample:
      'So a $1,500 deposit wrongfully withheld can support a court judgment of ' +
      '$3,000. Most landlords settle quickly once they realize you know the law.',
    statuteLine:
      'MCL \u00a7 554.609, \u00a7 554.613, and any others triggered by your ' +
      'circumstances \u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'trigger_condition',
      heading: 'Important:',
      body:
        'Michigan requires you to give your landlord a written forwarding address ' +
        'within 4 days of moving out to preserve your rights. Your demand letter ' +
        'supplies your address in writing. Deposits are capped at 1.5 months\u2019 ' +
        'rent.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'MCL §§ 554.601\u2013616 (verified against statute text; §554.613 read in full — no attorney-fee provision exists); process-gated 2× + 4-day address + 1.5-mo cap confirmed (legal audit, July 2026)',
};

const MINNESOTA: SimpleJurisdiction = {
  type: 'simple',
  slug: 'minnesota',
  name: 'Minnesota',
  deadlineDays: 21,
  deadlineLabel: '21 days',
  statutes: [{ label: '§ 504B.178', full: 'Minn. Stat. § 504B.178' }],
  penalty: {
    kind: 'multiplier',
    multiplier: 2,
    attorneyFees: false,
    short: '2× + $500',
    long:
      'Noncompliance makes the landlord liable for the withheld amount plus an ' +
      'equal amount as a penalty (effectively double), and bad-faith retention ' +
      'adds punitive damages of up to $500 per deposit under § 504B.178(4), (7).',
  },
  statuteCardLabel: '§ 504B.178',
  statuteCardSubtext: 'Minnesota Statutes',
  penaltyCardLabel: '2× + $500',
  penaltyCardSubtext: 'double damages plus a bad-faith penalty',
  copy: {
    heroSummary:
      "A professional demand letter citing Minnesota's security deposit statute " +
      '(Minn. Stat. \u00a7 504B.178), the 21-day return deadline, and the double-' +
      'damages-plus-$500 penalty for bad-faith withholding. Ready in minutes.',
    lawSummary:
      'Under Minn. Stat. \u00a7 504B.178, your landlord has 21 days after your ' +
      'tenancy ends and you provide a forwarding address to return your security ' +
      'deposit, with interest, or provide a written statement explaining any ' +
      'amount kept.',
    penaltyLeadIn:
      'If the landlord withholds your deposit in bad faith, you may recover:',
    penaltyBullets: [
      'Two times the amount wrongfully withheld',
      'An additional $500 statutory penalty for bad-faith retention',
    ],
    penaltyExample:
      'So a $1,500 deposit wrongfully withheld can support a court judgment of ' +
      '$3,500 \u2014 $3,000 in double damages plus the $500 penalty. Most ' +
      'landlords settle quickly once they realize you know the law.',
    statuteLine:
      'Minn. Stat. \u00a7 504B.178 and any others triggered by your circumstances ' +
      '\u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'general',
      heading: 'Good to know:',
      body:
        'Minnesota deposits earn 1% simple interest per year. There is no ' +
        'statewide deposit cap, though some cities (such as Minneapolis) impose ' +
        'local caps.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'Minn. Stat. § 504B.178 (verified against complete section text — no attorney-fee provision exists); effective-double + $500 punitive confirmed (legal audit, July 2026)',
};

const MISSISSIPPI: SimpleJurisdiction = {
  type: 'simple',
  slug: 'mississippi',
  name: 'Mississippi',
  deadlineDays: 45,
  deadlineLabel: '45 days',
  statutes: [{ label: '§ 89-8-21', full: 'Miss. Code § 89-8-21' }],
  penalty: {
    kind: 'fixed',
    fixedAmount: 200,
    attorneyFees: false,
    short: 'up to $200 + actual',
    long:
      'Retention in the absence of good faith exposes the landlord to statutory ' +
      'damages not to exceed $200 in addition to the tenant\u2019s actual ' +
      'damages under § 89-8-21(4). Failure to provide an itemized list within 45 ' +
      'days can be evidence of bad faith.',
  },
  statuteCardLabel: '§ 89-8-21',
  statuteCardSubtext: 'Mississippi Code',
  penaltyCardLabel: 'up to $200',
  penaltyCardSubtext: 'statutory damages, plus actual damages',
  copy: {
    heroSummary:
      "A professional demand letter citing Mississippi's security deposit statute " +
      '(Miss. Code \u00a7 89-8-21), the 45-day return deadline, and the ' +
      'bad-faith penalty. Ready in minutes.',
    lawSummary:
      'Under Miss. Code \u00a7 89-8-21, your landlord has 45 days after your ' +
      'tenancy ends and you make a demand to return your security deposit or ' +
      'provide a written, itemized list of any deductions.',
    penaltyLeadIn:
      'If the landlord wrongfully withholds your deposit in bad faith, you may ' +
      'recover:',
    penaltyBullets: [
      'Up to $200 in statutory damages',
      'Your actual damages',
    ],
    penaltyExample:
      'So a $1,500 deposit wrongfully withheld can support a judgment for the ' +
      'deposit plus up to $200 in statutory damages. Most landlords settle ' +
      'quickly once they realize you know the law.',
    statuteLine:
      'Miss. Code \u00a7 89-8-21 and any others triggered by your circumstances ' +
      '\u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'trigger_condition',
      heading: 'Note:',
      body:
        'The 45-day clock runs from the later of termination, delivery of ' +
        'possession, and your written demand \u2014 which your letter provides. ' +
        'Mississippi has no deposit cap and no interest or escrow requirement.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'Miss. Code § 89-8-21 (verified against complete section text — runs (1)–(4); no attorney-fee or court-cost provision anywhere in the RLTA); $200 statutory cap + demand trigger confirmed (legal audit, July 2026)',
};

// ===========================================================================
// PHASE 2 — BATCH 4 (MO, MT, NE, NV, NH, NJ, NM, NC, ND, OH). Facts verified
// in Phase 1; prose migrated from live pages. Notable: NE penalty = LESSER of
// 1-mo rent or 2× deposit (checklist "up to 2×" imprecise); NC has tiered caps
// (2wk / 1.5mo / 2mo); NV confirmed 2× NOT 3×; NH scope-gated with a 60+ carve;
// NM forfeiture + $250, no multiplier; OH damages gated on forwarding address.
// ===========================================================================

const MISSOURI: SimpleJurisdiction = {
  type: 'simple',
  slug: 'missouri',
  name: 'Missouri',
  deadlineDays: 30,
  deadlineLabel: '30 days',
  statutes: [{ label: '§ 535.300', full: 'RSMo § 535.300' }],
  penalty: {
    kind: 'multiplier',
    multiplier: 2,
    attorneyFees: false,
    short: '2× damages',
    long:
      'Wrongful withholding makes the landlord liable for twice the amount ' +
      'wrongfully withheld under § 535.300.6 \u2014 a flat, non-discretionary ' +
      'remedy that applies even where the landlord had some legitimate damages ' +
      'but withheld improperly.',
  },
  statuteCardLabel: '§ 535.300',
  statuteCardSubtext: 'Missouri Revised Statutes',
  penaltyCardLabel: '2× damages',
  penaltyCardSubtext: 'for wrongful withholding',
  copy: {
    heroSummary:
      "A professional demand letter citing Missouri's security deposit statute " +
      '(RSMo \u00a7 535.300), the 30-day return deadline, and the double-damages ' +
      'penalty for wrongful withholding. Ready in minutes.',
    lawSummary:
      'Under RSMo \u00a7 535.300, your landlord has 30 days after your tenancy ' +
      'ends to return your security deposit or provide a written, itemized list ' +
      'of any deductions.',
    penaltyLeadIn:
      'If the landlord wrongfully withholds any part of your deposit, you may ' +
      'recover:',
    penaltyBullets: ['Twice the amount wrongfully withheld \u2014 the doubling is mandatory, not discretionary'],
    penaltyExample:
      'So a $1,500 deposit wrongfully withheld supports a court judgment of ' +
      '$3,000. Missouri courts enforce \u00a7 535.300 strictly as a ' +
      'consumer-protection statute \u2014 lease clauses that try to waive these ' +
      'rights are unenforceable \u2014 so most landlords settle quickly once they ' +
      'realize you know the law.',
    statuteLine:
      'RSMo \u00a7 535.300 and any others triggered by your circumstances \u2014 ' +
      'not generic legalese.',
  },
  notes: [
    {
      kind: 'deposit_cap',
      heading: 'Good to know:',
      body:
        'Missouri caps security deposits at two months\u2019 rent (pet deposits ' +
        'excluded from the cap), and you have the right to request to be present ' +
        'at the move-out inspection.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'RSMo § 535.300 (verified against complete section text (1)–(8) — flat mandatory 2× per subsec. 6; no fee/cost provision, American rule); 2-mo cap confirmed (legal audit, July 2026)',
};

const MONTANA: ConditionalJurisdiction = {
  type: 'conditional',
  slug: 'montana',
  name: 'Montana',
  branches: [
    { deadlineDays: 10, condition: 'no damages, no cleaning required, and no unpaid rent or utilities' },
    { deadlineDays: 30, condition: 'any deductions are claimed (itemized list + balance required)' },
  ],
  deadlineLabel: '10 / 30 days',
  triggerSummary:
    'The deadline is 10 days if nothing is owed and no cleaning is required, or ' +
    '30 days when the landlord claims any deductions. Your letter applies the ' +
    'correct one.',
  statutes: [
    { label: '§ 70-25-202', full: 'Mont. Code Ann. § 70-25-202' },
    { label: '§ 70-25-204', full: 'Mont. Code Ann. § 70-25-204' },
  ],
  penalty: {
    kind: 'forfeiture',
    attorneyFees: false,
    short: 'Forfeiture + recovery',
    long:
      'A landlord who misses the deadline or skips the required itemized list ' +
      'forfeits all rights to withhold any portion of the deposit under ' +
      '\u00a7 70-25-203, and is liable under \u00a7 70-25-204 for the full ' +
      'amount wrongfully withheld or deducted. Montana\u2019s statute has no ' +
      'damages multiplier \u2014 sources claiming a 2\u00d7 penalty are wrong.',
  },
  statuteCardLabel: '§ 70-25-202',
  statuteCardSubtext: 'Montana Code Annotated',
  penaltyCardLabel: 'Forfeiture',
  penaltyCardSubtext: 'of the right to withhold, under § 70-25-203',
  copy: {
    heroSummary:
      "A professional demand letter citing Montana's security deposit statute " +
      '(Mont. Code \u00a7 70-25-202), the return deadline, and the forfeiture ' +
      'rule when a landlord misses it. Ready in minutes.',
    lawSummary:
      'Under Mont. Code \u00a7 70-25-202, your landlord must return your deposit ' +
      'within 10 days if there are no deductions, or within 30 days with a ' +
      'written, itemized statement if any deductions are claimed.',
    penaltyLeadIn:
      'If the landlord misses the deadline or withholds improperly, Montana law ' +
      'provides:',
    penaltyBullets: [
      'Forfeiture of all rights to withhold any portion of the deposit (§ 70-25-203) where the deadline or itemized-list duty was missed',
      'Recovery of the full amount wrongfully withheld or deducted (§ 70-25-204)',
    ],
    penaltyExample:
      'So a landlord who misses Montana\u2019s deadline loses the right to keep ' +
      'any of a $1,500 deposit \u2014 the entire amount comes back. Most ' +
      'landlords return it quickly once they realize their right to withhold is ' +
      'gone.',
    statuteLine:
      'Mont. Code \u00a7 70-25-202, \u00a7 70-25-204, and any others triggered by ' +
      'your circumstances \u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'trigger_condition',
      heading: 'Cleaning charges:',
      body:
        'Before deducting for cleaning, a Montana landlord must give written ' +
        'notice and a 24-hour opportunity for you to cure. Montana sets no deposit ' +
        'cap and requires no interest.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'Mont. Code §§ 70-25-202, 203, 204 (verified verbatim on mca.legmt.gov); §70-25-204(1) = amount wrongfully withheld, NO multiplier; §70-25-203 forfeiture T1-verified (legal audit, July 2026)',
};

const NEBRASKA: SimpleJurisdiction = {
  type: 'simple',
  slug: 'nebraska',
  name: 'Nebraska',
  deadlineDays: 14,
  deadlineLabel: '14 days',
  statutes: [{ label: '§ 76-1416', full: 'Neb. Rev. Stat. § 76-1416' }],
  penalty: {
    kind: 'multiplier',
    multiplier: 2,
    attorneyFees: true,
    short: 'lesser of 1-mo rent or 2×',
    long:
      'Willful non-compliance (not merely a good-faith error) exposes the ' +
      'landlord to liquidated damages equal to the LESSER of one month\u2019s ' +
      'rent or twice the security deposit, plus court costs and attorney fees ' +
      '(mandatory for a prevailing tenant) under § 76-1416(3).',
  },
  statuteCardLabel: '§ 76-1416',
  statuteCardSubtext: 'Nebraska Revised Statutes',
  penaltyCardLabel: '1-mo rent or 2×',
  penaltyCardSubtext: 'the lesser of, for willful withholding, plus fees',
  copy: {
    heroSummary:
      "A professional demand letter citing Nebraska's security deposit statute " +
      '(Neb. Rev. Stat. \u00a7 76-1416), the 14-day return deadline, and the ' +
      'liquidated-damages penalty for willful withholding. Ready in minutes.',
    lawSummary:
      'Under Neb. Rev. Stat. \u00a7 76-1416, your landlord has 14 days after your ' +
      'tenancy ends and you demand the deposit and designate where it should be ' +
      'sent to return it or provide a written, itemized statement.',
    penaltyLeadIn:
      'If the landlord\u2019s withholding is willful and not in good faith, you ' +
      'may recover:',
    penaltyBullets: [
      "Liquidated damages equal to the lesser of one month's rent or twice the deposit",
      "Reasonable attorney's fees",
    ],
    penaltyExample:
      'So willful withholding exposes the landlord to liquidated damages plus your ' +
      'fees, on top of returning the deposit. Most landlords settle quickly once ' +
      'they realize you know the law.',
    statuteLine:
      'Neb. Rev. Stat. \u00a7 76-1416 and any others triggered by your ' +
      'circumstances \u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'trigger_condition',
      heading: 'Note:',
      body:
        'The 14-day clock starts only after you demand the deposit and tell the ' +
        'landlord where to send it \u2014 which your letter does. Nebraska caps ' +
        'deposits at one month\u2019s rent, plus a pet deposit of up to a quarter ' +
        'month.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'Neb. Rev. Stat. § 76-1416 (verified against statute text); LESSER-OF penalty structure + 1-mo cap confirmed (Phase 1 audit)',
};

const NEVADA: SimpleJurisdiction = {
  type: 'simple',
  slug: 'nevada',
  name: 'Nevada',
  deadlineDays: 30,
  deadlineLabel: '30 days',
  statutes: [{ label: '§ 118A.242', full: 'NRS § 118A.242' }],
  penalty: {
    kind: 'multiplier',
    multiplier: 2,
    attorneyFees: false,
    short: 'up to 2×',
    long:
      'A landlord who fails or refuses to return the deposit within 30 days is ' +
      'liable for the entire deposit plus a court-fixed additional sum of up to ' +
      'another full deposit under § 118A.242(6)\u2013(7) \u2014 up to 2× total, ' +
      'not 3×.',
  },
  statuteCardLabel: '§ 118A.242',
  statuteCardSubtext: 'Nevada Revised Statutes',
  penaltyCardLabel: 'up to 2×',
  penaltyCardSubtext: 'the deposit, for failure to return in 30 days',
  copy: {
    heroSummary:
      "A professional demand letter citing Nevada's security deposit statute " +
      '(NRS \u00a7 118A.242), the 30-day return deadline, and the double-damages ' +
      'penalty for withholding. Ready in minutes.',
    lawSummary:
      'Under NRS \u00a7 118A.242, your landlord has 30 days after your tenancy ' +
      'ends to return your security deposit or provide a written, itemized ' +
      'accounting of any deductions.',
    penaltyLeadIn:
      'If the landlord wrongfully withholds your deposit, you may recover your ' +
      'deposit plus damages of up to an equal amount:',
    penaltyBullets: [
      'An amount equal to your entire security deposit (§ 118A.242(6)(a)), plus',
      'A court-fixed additional sum of up to another full deposit (§ 118A.242(6)(b)) \u2014 up to 2\u00d7 the deposit in total',
    ],
    penaltyExample:
      'So a $1,500 deposit wrongfully withheld can support a court judgment of up ' +
      'to $3,000. Most landlords settle quickly once they realize you know the law.',
    statuteLine:
      'NRS \u00a7 118A.242 and any others triggered by your circumstances \u2014 ' +
      'not generic legalese.',
  },
  notes: [
    {
      kind: 'outdated_figure',
      heading: 'Note:',
      body:
        'Nevada\u2019s penalty is double damages \u2014 outdated sources sometimes ' +
        'claim 3\u00d7, but the statute caps it at the deposit plus an equal ' +
        'additional sum. Deposits are capped at three months\u2019 rent (combined ' +
        'with any prepaid rent).',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'NRS § 118A.242 (verified against statute text); up-to-2×-NOT-3× + 3-mo cap confirmed (Phase 1 audit)',
};

const NEW_HAMPSHIRE: ScopeGatedJurisdiction = {
  type: 'scope_gated',
  slug: 'new-hampshire',
  name: 'New Hampshire',
  deadlineDays: 30,
  deadlineLabel: '30 days',
  statutes: [
    { label: 'RSA 540-A:7', full: 'N.H. RSA 540-A:7' },
    { label: 'RSA 540-A:8', full: 'N.H. RSA 540-A:8' },
  ],
  penalty: {
    kind: 'multiplier',
    multiplier: 2,
    attorneyFees: false,
    short: '2× damages',
    long:
      'A landlord who wrongfully retains any part of the deposit is liable for ' +
      'twice the amount wrongfully withheld, plus any interest due, under RSA ' +
      '540-A:8 \u2014 the doubling is mandatory under the statute\u2019s text, ' +
      'not discretionary.',
  },
  scope: {
    appliesTo:
      'Most residential tenancies in New Hampshire.',
    exemptFallback:
      'The rules do NOT apply to (1) a single-family rental where the landlord ' +
      'owns no other rental property, or (2) an owner-occupied building of five ' +
      'or fewer units \u2014 EXCEPT that any unit occupied by a tenant age 60 or ' +
      'older keeps full protection. Your letter reflects whichever applies to ' +
      'your situation.',
  },
  statuteCardLabel: 'RSA 540-A:7',
  statuteCardSubtext: 'New Hampshire Revised Statutes',
  penaltyCardLabel: '2× damages',
  penaltyCardSubtext: 'mandatory, for wrongful retention under RSA 540-A:8',
  copy: {
    heroSummary:
      "A professional demand letter citing New Hampshire's security deposit law " +
      '(RSA 540-A:7), the 30-day return deadline, and the mandatory ' +
      'double-damages penalty for wrongful retention. Ready in minutes.',
    lawSummary:
      'Under RSA 540-A:7, your landlord has 30 days after your tenancy ends to ' +
      'return your security deposit, with interest, along with a written, ' +
      'itemized statement of any deductions.',
    penaltyLeadIn:
      'If the landlord wrongfully retains any part of your deposit, you may ' +
      'recover under RSA 540-A:8:',
    penaltyBullets: ['Double the amount of the deposit wrongfully withheld \u2014 mandatory under the statute'],
    penaltyExample:
      'So a $1,500 deposit wrongfully withheld can support a court judgment of ' +
      '$3,000. Most landlords settle quickly once they realize you know the law.',
    statuteLine:
      'RSA 540-A:7, RSA 540-A:8, and any others triggered by your circumstances ' +
      '\u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'scope_threshold',
      heading: 'Scope exemptions:',
      body:
        'These rules do not apply to a single-family rental where the landlord ' +
        'owns no other rental property, or to an owner-occupied building of five ' +
        'or fewer units \u2014 except that a tenant age 60 or older keeps full ' +
        'protection regardless. Your letter applies the rules that fit your ' +
        'building.',
    },
    {
      kind: 'deposit_cap',
      heading: 'Deposit cap:',
      body:
        'New Hampshire caps deposits at one month\u2019s rent or $100, whichever ' +
        'is greater (all deposits combined). Interest is owed if the deposit is ' +
        'held one year or longer.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'N.H. RSA 540-A:5\u20138 (verified against statute text; §540-A:8 I(b) flat mandatory 2×, no bad-faith element; no fee provision at the deposit remedy — CPA fees run only via RSA 358-A:10 on §540-A:6 procedural violations); scope exemptions + 60+ carve-out confirmed (legal audit, July 2026)',
};

const NEW_JERSEY: SimpleJurisdiction = {
  type: 'simple',
  slug: 'new-jersey',
  name: 'New Jersey',
  deadlineDays: 30,
  deadlineLabel: '30 days',
  statutes: [{ label: '§ 46:8-21.1', full: 'N.J.S.A. § 46:8-21.1' }],
  penalty: {
    kind: 'multiplier',
    multiplier: 2,
    attorneyFees: false,
    short: '2× (mandatory)',
    long:
      'Wrongful withholding requires the court to award ("shall") double the ' +
      'amount wrongfully withheld under § 46:8-21.1; a special $500\u2013$2,000 ' +
      'penalty applies where the deposit came from a government agency.',
  },
  statuteCardLabel: '§ 46:8-21.1',
  statuteCardSubtext: 'New Jersey Statutes Annotated',
  penaltyCardLabel: '2× damages',
  penaltyCardSubtext: 'mandatory, for wrongful withholding',
  copy: {
    heroSummary:
      "A professional demand letter citing New Jersey's security deposit statute " +
      '(N.J.S.A. \u00a7 46:8-21.1), the 30-day return deadline, and the mandatory ' +
      'double-damages penalty. Ready in minutes.',
    lawSummary:
      'Under N.J.S.A. \u00a7 46:8-21.1, your landlord has 30 days after your ' +
      'tenancy ends to return your security deposit, with interest, along with a ' +
      'written, itemized statement of any deductions.',
    penaltyLeadIn:
      'If the landlord wrongfully withholds any part of your deposit, the court ' +
      'must award you:',
    penaltyBullets: [
      'Double the amount wrongfully withheld \u2014 the doubling itself is mandatory',
    ],
    penaltyExample:
      'So a $1,500 deposit wrongfully withheld can support a court judgment of ' +
      "$3,000. New Jersey's double-damages award is mandatory, not discretionary " +
      '\u2014 most landlords settle quickly once they realize that.',
    statuteLine:
      'N.J.S.A. \u00a7 46:8-21.1 and any others triggered by your circumstances ' +
      '\u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'deposit_cap',
      heading: 'Good to know:',
      body:
        'New Jersey caps security deposits at one and one-half months\u2019 rent ' +
        '(any annual increase capped at 10% of the current deposit) and requires ' +
        'the deposit to be held in an interest-bearing account, with interest ' +
        'paid or credited to you annually.',
    },
    {
      kind: 'trigger_condition',
      heading: 'Faster deadlines:',
      body:
        'The deadline shortens to 5 days for displacement by fire, flood, ' +
        'condemnation, or evacuation, and to 15 business days following a ' +
        'domestic-violence lease termination.',
    },
    {
      kind: 'scope_threshold',
      heading: 'Owner-occupied buildings with 2 or fewer rental units:',
      body:
        'Under \u00a7 46:8-26, the Security Deposit Act does not apply to an ' +
        'owner-occupied building with two or fewer rental units \u2014 unless ' +
        'the tenant sends the landlord a written notice invoking the Act, which ' +
        'takes effect 30 days later. If that describes your building, your ' +
        'letter can serve as that notice, and your immediate demand rests on ' +
        'your lease and contract rights.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'N.J.S.A. §§ 46:8-19 to 46:8-26 (verified against statute text); mandatory 2× (fees discretionary, not asserted) + §46:8-26 owner-occupied ≤2-unit gate + 1.5-mo cap + interest confirmed (legal audit, July 2026)',
};

const NEW_MEXICO: SimpleJurisdiction = {
  type: 'simple',
  slug: 'new-mexico',
  name: 'New Mexico',
  deadlineDays: 30,
  deadlineLabel: '30 days',
  statutes: [{ label: '§ 47-8-18', full: 'NMSA § 47-8-18' }],
  penalty: {
    kind: 'forfeiture',
    attorneyFees: true,
    short: 'Forfeiture + $250',
    long:
      'Failure to provide the itemized statement and balance within 30 days ' +
      'forfeits the landlord\u2019s right to withhold any portion of the deposit ' +
      '(and to assert related counterclaims) under § 47-8-18(D), and bad-faith ' +
      'retention adds a $250 civil penalty plus attorney fees and costs. New ' +
      'Mexico uses no damages multiplier.',
  },
  statuteCardLabel: '§ 47-8-18',
  statuteCardSubtext: 'New Mexico Statutes Annotated',
  penaltyCardLabel: 'Forfeiture + $250',
  penaltyCardSubtext: 'plus fees; no multiplier',
  copy: {
    heroSummary:
      "A professional demand letter citing New Mexico's security deposit statute " +
      '(NMSA \u00a7 47-8-18), the 30-day return deadline, and the forfeiture-plus-' +
      '$250-penalty remedy. Ready in minutes.',
    lawSummary:
      'Under NMSA \u00a7 47-8-18, your landlord has 30 days after your tenancy ' +
      'ends to return your security deposit or provide a written, itemized ' +
      'statement of any deductions.',
    penaltyLeadIn:
      'New Mexico does not use a 2\u00d7 or 3\u00d7 multiplier. A landlord who ' +
      'fails to provide the itemized refund within 30 days:',
    penaltyBullets: [
      'Forfeits the right to withhold any part of the deposit',
      'Owes a $250 civil penalty',
      "Owes your reasonable attorney's fees and costs",
    ],
    penaltyExample:
      'So a $1,500 deposit wrongfully withheld can support a judgment for the ' +
      'full deposit, plus a $250 penalty and your fees. Most landlords settle ' +
      'quickly once they realize you know the law.',
    statuteLine:
      'NMSA \u00a7 47-8-18 and any others triggered by your circumstances \u2014 ' +
      'not generic legalese.',
  },
  notes: [
    {
      kind: 'general',
      heading: 'Good to know:',
      body:
        'If your deposit was more than one month\u2019s rent, New Mexico requires ' +
        'the landlord to pay you interest on it annually. For leases under one ' +
        'year the deposit is capped at one month\u2019s rent.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'NMSA § 47-8-18 (verified against statute text); 4-part forfeiture + $250 + no-multiplier confirmed (Phase 1 audit)',
};

const NORTH_CAROLINA: SimpleJurisdiction = {
  type: 'simple',
  slug: 'north-carolina',
  name: 'North Carolina',
  deadlineDays: 30,
  deadlineLabel: '30 days',
  statutes: [
    { label: '§ 42-52', full: 'N.C.G.S. § 42-52' },
    { label: '§ 42-55', full: 'N.C.G.S. § 42-55' },
  ],
  penalty: {
    kind: 'forfeiture',
    attorneyFees: false,
    short: 'Forfeiture',
    long:
      'Willful failure to comply with the deposit, bond, or notice requirements ' +
      'of the Article voids the landlord\u2019s right to retain any portion of ' +
      'the deposit under § 42-55, and the tenant may recover the deposit due ' +
      'along with any damages. North Carolina uses no damages multiplier.',
  },
  statuteCardLabel: '§ 42-55',
  statuteCardSubtext: 'North Carolina General Statutes',
  penaltyCardLabel: 'Forfeiture',
  penaltyCardSubtext: 'of the right to withhold, for willful violations',
  copy: {
    heroSummary:
      "A professional demand letter citing North Carolina's security deposit " +
      'statutes (N.C.G.S. \u00a7 42-52 and \u00a7 42-55), the 30-day return ' +
      'deadline, and the forfeiture remedy for willful noncompliance. Ready in ' +
      'minutes.',
    lawSummary:
      'Under N.C.G.S. \u00a7 42-52, your landlord has 30 days after your tenancy ' +
      'ends to return your security deposit or provide a written, itemized ' +
      'accounting of deductions. If repairs genuinely cannot be assessed within ' +
      '30 days, the landlord must send an interim accounting at 30 days and a ' +
      'final accounting within 60 days.',
    penaltyLeadIn:
      'North Carolina does not use a 2\u00d7 or 3\u00d7 multiplier. Instead, the ' +
      'remedy under N.C.G.S. \u00a7 42-55 works like this: a landlord who ' +
      'willfully fails to comply with the deposit, bond, or notice requirements ' +
      'of the Article forfeits the right to keep any portion of your deposit, ' +
      'and you may recover:',
    penaltyBullets: [
      'The full deposit back, regardless of any claimed deductions, where a willful violation is shown',
      'Your damages for the wrongful withholding',
    ],
    penaltyExample:
      'So a landlord who willfully mishandles the deposit \u2014 for example, ' +
      'never placing it in the required trust account or bond, or withholding it ' +
      'for charges the statute does not permit \u2014 loses the right to keep ' +
      'any of it. Most landlords return it quickly once they realize their right ' +
      'to withhold is at risk.',
    statuteLine:
      'N.C.G.S. \u00a7 42-52, \u00a7 42-55, and any others triggered by your ' +
      'circumstances \u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'deposit_cap',
      heading: 'Deposit cap (tiered):',
      body:
        'North Carolina caps deposits by tenancy type: two weeks\u2019 rent for ' +
        'week-to-week, one and one-half months\u2019 rent for month-to-month, and ' +
        'two months\u2019 rent for terms longer than month-to-month. The deposit ' +
        'must be held in a North Carolina trust account or covered by a bond, and ' +
        'the landlord must disclose the location within 30 days.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'N.C.G.S. §§ 42-50 to 42-56 (verified against statute text; §42-55 forfeiture scoped to deposit/bond/notice requirements — a missed deadline alone is not a listed trigger; fees discretionary and willfulness-gated, not asserted); tiered caps confirmed (legal audit, July 2026)',
};

const NORTH_DAKOTA: SimpleJurisdiction = {
  type: 'simple',
  slug: 'north-dakota',
  name: 'North Dakota',
  deadlineDays: 30,
  deadlineLabel: '30 days',
  statutes: [{ label: '§ 47-16-07.1', full: 'N.D.C.C. § 47-16-07.1' }],
  penalty: {
    kind: 'multiplier',
    multiplier: 3,
    attorneyFees: false,
    short: 'up to 3×',
    long:
      'Deposit money withheld without reasonable justification exposes the ' +
      'landlord to treble (three times) damages under § 47-16-07.1(4).',
  },
  statuteCardLabel: '§ 47-16-07.1',
  statuteCardSubtext: 'North Dakota Century Code',
  penaltyCardLabel: 'up to 3×',
  penaltyCardSubtext: 'for withholding without reasonable justification',
  copy: {
    heroSummary:
      "A professional demand letter citing North Dakota's security deposit " +
      'statute (N.D.C.C. \u00a7 47-16-07.1), the 30-day return deadline, and the ' +
      'treble-damages penalty for unjustified withholding. Ready in minutes.',
    lawSummary:
      'Under N.D.C.C. \u00a7 47-16-07.1, your landlord has 30 days after your ' +
      'tenancy ends to return your security deposit or provide a written, ' +
      'itemized statement of any deductions.',
    penaltyLeadIn:
      'If the landlord retains your deposit without reasonable justification, you ' +
      'may recover:',
    penaltyBullets: ['Up to three times the amount wrongfully withheld'],
    penaltyExample:
      'So a $1,500 deposit wrongfully withheld can support a court judgment of up ' +
      'to $4,500. Most landlords settle quickly once they realize you know the law.',
    statuteLine:
      'N.D.C.C. \u00a7 47-16-07.1 and any others triggered by your circumstances ' +
      '\u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'deposit_cap',
      heading: 'Good to know:',
      body:
        'North Dakota caps deposits at one month\u2019s rent (two months allowed ' +
        'in limited cases, such as a prior lease-violation judgment). Interest is ' +
        'required if occupancy lasts nine months or longer.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'N.D.C.C. § 47-16-07.1 (verified against full Ch. 47-16 codified text — §47-16-07.1(4) grants treble only, no fee provision reaches a deposit claim); 1-mo cap + 9-mo interest trigger confirmed (legal audit, July 2026)',
};

const OHIO: SimpleJurisdiction = {
  type: 'simple',
  slug: 'ohio',
  name: 'Ohio',
  deadlineDays: 30,
  deadlineLabel: '30 days',
  statutes: [{ label: '§ 5321.16', full: 'Ohio Rev. Code § 5321.16' }],
  penalty: {
    kind: 'multiplier',
    multiplier: 2,
    attorneyFees: true,
    short: '2× + fees',
    long:
      'A landlord who fails to comply is liable for the money due plus damages ' +
      'equal to the amount wrongfully withheld (effectively 2×) plus reasonable ' +
      'attorney fees under § 5321.16(C) \u2014 but those damages and fees require ' +
      'the tenant to have given a written forwarding address.',
  },
  statuteCardLabel: '§ 5321.16',
  statuteCardSubtext: 'Ohio Revised Code',
  penaltyCardLabel: '2× damages',
  penaltyCardSubtext: 'plus fees, if a forwarding address was given',
  copy: {
    heroSummary:
      "A professional demand letter citing Ohio's security deposit statute " +
      '(Ohio Rev. Code \u00a7 5321.16), the 30-day return deadline, and the ' +
      'double-damages penalty for wrongful withholding. Ready in minutes.',
    lawSummary:
      'Under Ohio Rev. Code \u00a7 5321.16, your landlord has 30 days after your ' +
      'tenancy ends and you hand back possession to return your security deposit ' +
      'or provide a written, itemized list of deductions.',
    penaltyLeadIn:
      'If the landlord wrongfully withholds any part of your deposit, you may ' +
      'recover:',
    penaltyBullets: [
      'The amount wrongfully withheld, plus damages equal to that amount (effectively two times)',
      "Reasonable attorney's fees",
    ],
    penaltyExample:
      'So a $1,500 deposit wrongfully withheld can support a court judgment of ' +
      '$3,000 plus fees. Most landlords settle quickly once they realize you know ' +
      'the law.',
    statuteLine:
      'Ohio Rev. Code \u00a7 5321.16 and any others triggered by your ' +
      'circumstances \u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'trigger_condition',
      heading: 'Important:',
      body:
        'In Ohio, you must give your landlord a written forwarding address to ' +
        'preserve your right to the double damages and attorney fees \u2014 ' +
        'without it, you still get the deposit back but not the extra damages. ' +
        'Your demand letter includes your address in writing, which protects that ' +
        'right. Ohio sets no deposit cap.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'Ohio Rev. Code § 5321.16 (verified against statute text); effective-2× + forwarding-address forfeiture gate confirmed (Phase 1 audit)',
};

// ===========================================================================
// PHASE 2 — BATCH 5 (OK, OR, PA, RI, SC, SD, TN, UT, VT, VA). Facts verified
// in Phase 1; prose migrated from live pages. Notable: OK civil multiplier
// UNRESOLVED (medium confidence — modeled as forfeiture floor, flagged); SC
// confirmed treble (3×) + fees; TN forfeiture + full deposit + costs, NO
// multiplier (Phase 5 flag #4 — checklist "2×" is wrong); SD $200 cap NOT 2×
// (the "2×" trap is commercial-lease law); VA actual damages, NO multiplier.
// ===========================================================================

const OKLAHOMA: SimpleJurisdiction = {
  type: 'simple',
  slug: 'oklahoma',
  name: 'Oklahoma',
  deadlineDays: 45,
  deadlineLabel: '45 days',
  statutes: [{ label: '41 O.S. § 115', full: 'Okla. Stat. tit. 41, § 115' }],
  penalty: {
    kind: 'forfeiture',
    attorneyFees: false,
    short: 'Full deposit + costs',
    long:
      'A landlord who in bad faith retains the deposit must return it in full and ' +
      'is liable for court costs; escrow is mandatory, and actual misappropriation ' +
      'can trigger criminal liability under § 115(A). Oklahoma\u2019s statute ' +
      'carries no damages multiplier \u2014 the civil remedy is the full deposit ' +
      'plus costs.',
  },
  statuteCardLabel: '41 O.S. § 115',
  statuteCardSubtext: 'Oklahoma Statutes, Title 41',
  penaltyCardLabel: 'Full deposit',
  penaltyCardSubtext: 'plus costs, for bad-faith retention',
  copy: {
    heroSummary:
      "A professional demand letter citing Oklahoma's security deposit statute " +
      '(41 O.S. \u00a7 115), the 45-day return deadline, and the bad-faith ' +
      'remedy. Ready in minutes.',
    lawSummary:
      'Under 41 O.S. \u00a7 115, your landlord has 45 days after your tenancy ' +
      'ends, you deliver possession, and you make a written demand to return your ' +
      'security deposit or provide a written, itemized accounting of any ' +
      'deductions.',
    penaltyLeadIn:
      'Oklahoma does not use a clear 2\u00d7 or 3\u00d7 multiplier. A landlord ' +
      'who in bad faith retains your deposit must return it and is also liable ' +
      'for:',
    penaltyBullets: [
      'The full deposit wrongfully withheld',
      'Your court costs',
    ],
    penaltyExample:
      'So a landlord who keeps your deposit in bad faith owes it back in full, ' +
      'plus your costs. Most landlords return it quickly once they realize you ' +
      'know the law.',
    statuteLine:
      '41 O.S. \u00a7 115 and any others triggered by your circumstances \u2014 ' +
      'not generic legalese.',
  },
  notes: [
    {
      kind: 'trigger_condition',
      heading: 'Good to know:',
      body:
        'A landlord who misuses deposit funds \u2014 failing to keep them in a ' +
        'separate Oklahoma escrow account \u2014 can face criminal liability under ' +
        '\u00a7 115. Your letter raises this only where actual misappropriation is ' +
        'alleged. The 45-day clock starts only after your written demand, which ' +
        'your letter provides. Oklahoma sets no deposit cap.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'Okla. Stat. tit. 41, §§ 115, 105 (verified against statute text; no multiplier exists; §105(B) fee route is two-way prevailing-party and is not asserted) (legal audit, July 2026)',
};

const OREGON: SimpleJurisdiction = {
  type: 'simple',
  slug: 'oregon',
  name: 'Oregon',
  deadlineDays: 31,
  deadlineLabel: '31 days',
  statutes: [{ label: '§ 90.300', full: 'ORS § 90.300' }],
  penalty: {
    kind: 'multiplier',
    multiplier: 2,
    attorneyFees: false,
    short: '2× damages',
    long:
      'A landlord who wrongfully withholds is liable for twice the amount ' +
      'wrongfully withheld under ORS 90.300(16) \u2014 Oregon courts treat the ' +
      'doubling as flat and non-discretionary \u2014 and failure to give the ' +
      'itemized accounting forfeits the right to withhold.',
  },
  statuteCardLabel: '§ 90.300',
  statuteCardSubtext: 'Oregon Revised Statutes',
  penaltyCardLabel: '2× damages',
  penaltyCardSubtext: 'flat, for wrongful withholding under ORS 90.300(16)',
  copy: {
    heroSummary:
      "A professional demand letter citing Oregon's security deposit statute " +
      '(ORS \u00a7 90.300), the 31-day return deadline, and the double-damages ' +
      'penalty for wrongful withholding. Ready in minutes.',
    lawSummary:
      'Under ORS \u00a7 90.300, your landlord has 31 days after your tenancy ends ' +
      'and you deliver possession to return your security deposit or provide a ' +
      'written, itemized accounting of any deductions.',
    penaltyLeadIn:
      'If the landlord wrongfully or in bad faith withholds your deposit, you may ' +
      'recover:',
    penaltyBullets: ['Twice the amount wrongfully withheld'],
    penaltyExample:
      'So a $1,500 deposit wrongfully withheld can support a court judgment of ' +
      '$3,000. Most landlords settle quickly once they realize you know the law.',
    statuteLine:
      'ORS \u00a7 90.300 and any others triggered by your circumstances \u2014 ' +
      'not generic legalese.',
  },
  notes: [
    {
      kind: 'scope_threshold',
      heading: 'Living in Portland?',
      body:
        'The city adds its own deposit protections (PCC 30.01.087) on top of the ' +
        'state rule \u2014 a separate penalty of up to $250 per violation plus ' +
        'actual damages and fees, distinct from the state\u2019s 2\u00d7. Your ' +
        'letter applies both layers when they fit your situation.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'ORS § 90.300 + Portland PCC 30.01.087 (verified against text; 90.300(16) flat 2× per Beckett/Waldvogel; fee route is ORS 90.255, discretionary two-way, not asserted); two-layer state/city distinction confirmed (legal audit, July 2026)',
};

const PENNSYLVANIA: SimpleJurisdiction = {
  type: 'simple',
  slug: 'pennsylvania',
  name: 'Pennsylvania',
  deadlineDays: 30,
  deadlineLabel: '30 days',
  statutes: [
    { label: '§ 250.512', full: '68 P.S. § 250.512' },
    { label: '§ 250.511a', full: '68 P.S. § 250.511a' },
  ],
  penalty: {
    kind: 'multiplier',
    multiplier: 2,
    attorneyFees: false,
    short: '2× the excess',
    long:
      'No written list within 30 days forfeits all right to withhold; failure to ' +
      'pay the difference within 30 days makes the landlord liable for double the ' +
      'amount by which the deposit exceeds actual damages under § 250.512(c), ' +
      'with the landlord bearing the burden of proving those damages.',
  },
  statuteCardLabel: '§ 250.512',
  statuteCardSubtext: 'Pennsylvania Landlord and Tenant Act',
  penaltyCardLabel: '2× damages',
  penaltyCardSubtext: 'of the amount exceeding actual damages',
  copy: {
    heroSummary:
      "A professional demand letter citing Pennsylvania's security deposit law " +
      '(68 P.S. \u00a7 250.512), the 30-day return deadline, and the ' +
      'double-damages penalty for wrongful withholding. Ready in minutes.',
    lawSummary:
      'Under 68 P.S. \u00a7 250.512, your landlord has 30 days after your tenancy ' +
      'ends to return your security deposit or provide a written, itemized list ' +
      'of any deductions for damages.',
    penaltyLeadIn:
      'If the landlord fails to provide that written list and refund within 30 ' +
      'days, the landlord loses the right to keep any of the deposit and becomes ' +
      'liable for double the amount wrongfully withheld:',
    penaltyBullets: [
      "Two times the amount by which the deposit exceeds the landlord's actual, properly documented damages",
    ],
    penaltyExample:
      'So a $1,500 deposit wrongfully withheld can support a court judgment of ' +
      '$3,000. Most landlords settle quickly once they realize you know the law.',
    statuteLine:
      '68 P.S. \u00a7 250.512, \u00a7 250.511a, and any others triggered by your ' +
      'circumstances \u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'deposit_cap',
      heading: 'Good to know:',
      body:
        'Pennsylvania caps deposits at two months\u2019 rent in the first year ' +
        'and one month\u2019s rent thereafter (no increase after five years).',
    },
    {
      kind: 'trigger_condition',
      heading: 'The forwarding-address rule is strict (§ 250.512(e)):',
      body:
        'A tenant who fails to provide the landlord with a new address in ' +
        'writing upon moving out is relieved from ALL liability under the ' +
        'section \u2014 meaning the landlord owes neither the list, the refund, ' +
        'nor the double-damages penalty. Your demand letter supplies your ' +
        'forwarding address in writing, which is essential to preserving these ' +
        'rights.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    '68 P.S. §§ 250.511a, 250.512 (verified against statute text; §250.512(e) address failure relieves the landlord of all §250.512 liability); 2×-of-excess + tiered cap confirmed (legal audit, July 2026)',
};

const RHODE_ISLAND: SimpleJurisdiction = {
  type: 'simple',
  slug: 'rhode-island',
  name: 'Rhode Island',
  deadlineDays: 20,
  deadlineLabel: '20 days',
  statutes: [{ label: '§ 34-18-19', full: 'R.I. Gen. Laws § 34-18-19' }],
  penalty: {
    kind: 'multiplier',
    multiplier: 2,
    attorneyFees: true,
    short: '2× + fees',
    long:
      'A landlord who fails to comply with the return-and-itemization duty owes ' +
      'the amount due plus twice the amount wrongfully withheld, plus reasonable ' +
      'attorney fees, under § 34-18-19(c). The trigger is non-compliance itself ' +
      '\u2014 the statute requires no showing of bad faith.',
  },
  statuteCardLabel: '§ 34-18-19',
  statuteCardSubtext: 'Rhode Island General Laws',
  penaltyCardLabel: '2× damages',
  penaltyCardSubtext: 'for wrongful withholding, plus fees',
  copy: {
    heroSummary:
      "A professional demand letter citing Rhode Island's security deposit " +
      'statute (R.I. Gen. Laws \u00a7 34-18-19), the 20-day return deadline, and ' +
      'the double-damages penalty for non-compliance. Ready in minutes.',
    lawSummary:
      'Under R.I. Gen. Laws \u00a7 34-18-19, your landlord has 20 days after your ' +
      'tenancy ends and you provide a forwarding address to return your security ' +
      'deposit or provide a written, itemized statement of any deductions.',
    penaltyLeadIn:
      'If the landlord fails to comply with the return-and-itemization duty, you ' +
      'may recover:',
    penaltyBullets: [
      'The amount due, plus twice the amount wrongfully withheld',
      "Your reasonable attorney's fees",
    ],
    penaltyExample:
      'So a $1,500 deposit wrongfully withheld can support a court judgment of ' +
      '$3,000 plus fees. Most landlords settle quickly once they realize you know ' +
      'the law.',
    statuteLine:
      'R.I. Gen. Laws \u00a7 34-18-19 and any others triggered by your ' +
      'circumstances \u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'deposit_cap',
      heading: 'Good to know:',
      body:
        'Rhode Island caps deposits at one month\u2019s rent; no pet deposit may ' +
        'push the total past that cap. A separate furniture deposit is allowed for ' +
        'furnished units where the furnishings exceed $5,000 in value.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'R.I. Gen. Laws § 34-18-19 (verified against statute text; §34-18-19(c) strict trigger — no bad-faith element; fees in-statute one-way) (legal audit, July 2026)',
};

const SOUTH_CAROLINA: SimpleJurisdiction = {
  type: 'simple',
  slug: 'south-carolina',
  name: 'South Carolina',
  deadlineDays: 30,
  deadlineLabel: '30 days',
  statutes: [{ label: '§ 27-40-410', full: 'S.C. Code Ann. § 27-40-410' }],
  penalty: {
    kind: 'multiplier',
    multiplier: 3,
    attorneyFees: true,
    short: '3× + fees',
    long:
      'A landlord who fails to return the deposit with the required notice is ' +
      'liable for the property or money due plus three times (treble) the amount ' +
      'wrongfully withheld, plus reasonable attorney fees, under § 27-40-410(b).',
  },
  statuteCardLabel: '§ 27-40-410',
  statuteCardSubtext: 'South Carolina Code',
  penaltyCardLabel: '3× damages',
  penaltyCardSubtext: 'for wrongful withholding, plus fees',
  copy: {
    heroSummary:
      "A professional demand letter citing South Carolina's security deposit " +
      'statute (S.C. Code \u00a7 27-40-410), the 30-day return deadline, and the ' +
      'treble-damages penalty for wrongful withholding. Ready in minutes.',
    lawSummary:
      'Under S.C. Code \u00a7 27-40-410, your landlord has 30 days after your ' +
      'tenancy ends to return your security deposit or provide a written, ' +
      'itemized list of deductions.',
    penaltyLeadIn:
      'If the landlord wrongfully withholds your deposit or fails to provide the ' +
      'required written notice, you may recover:',
    penaltyBullets: [
      'Three times the amount wrongfully withheld',
      "Reasonable attorney's fees",
    ],
    penaltyExample:
      'So a $1,500 deposit wrongfully withheld can support a court judgment of ' +
      '$4,500 plus fees. Most landlords settle quickly once they realize you ' +
      'know the law.',
    statuteLine:
      'S.C. Code \u00a7 27-40-410 and any others triggered by your circumstances ' +
      '\u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'trigger_condition',
      heading: 'Good to know:',
      body:
        'South Carolina sets no deposit cap and requires no interest. If you do ' +
        'not provide a written forwarding address, the damages remedy can be lost ' +
        'where the landlord had no notice of your whereabouts and mailed to your ' +
        'last known address \u2014 so your letter supplies your address in writing.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'S.C. Code Ann. § 27-40-410 (verified against statute text; resolves checklist "verify"); treble + fees + address gate confirmed (Phase 1 audit)',
};

const SOUTH_DAKOTA: SimpleJurisdiction = {
  type: 'simple',
  slug: 'south-dakota',
  name: 'South Dakota',
  deadlineDays: 14,
  deadlineLabel: '14 days',
  statutes: [{ label: '§ 43-32-24', full: 'SDCL § 43-32-24' }],
  penalty: {
    kind: 'fixed',
    fixedAmount: 200,
    attorneyFees: false,
    short: 'Forfeiture + up to $200',
    long:
      'A landlord who fails to comply forfeits the right to withhold; bad-faith ' +
      'retention (including failing to provide the statement or accounting) adds ' +
      'punitive damages not to exceed $200 under § 43-32-24. There is no damages ' +
      'multiplier for residential leases.',
  },
  statuteCardLabel: '§ 43-32-24',
  statuteCardSubtext: 'South Dakota Codified Laws',
  penaltyCardLabel: 'up to $200',
  penaltyCardSubtext: 'punitive, plus forfeiture; no multiplier',
  copy: {
    heroSummary:
      "A professional demand letter citing South Dakota's security deposit " +
      'statute (SDCL \u00a7 43-32-24), the 14-day return deadline, and the ' +
      'forfeiture-plus-$200 remedy for bad-faith retention. Ready in minutes.',
    lawSummary:
      'Under SDCL \u00a7 43-32-24, your landlord must return your deposit, or a ' +
      'written statement of what is withheld and why, within 14 days of the end ' +
      'of your tenancy (measured from the later of move-out or your forwarding ' +
      'address). On request, a full itemized accounting is due within 45 days.',
    penaltyLeadIn:
      'South Dakota does not use a 2\u00d7 multiplier. A landlord who fails to ' +
      'comply forfeits the right to withhold, and bad-faith retention exposes the ' +
      'landlord to:',
    penaltyBullets: [
      'The full deposit wrongfully withheld',
      'Up to $200 in punitive damages, plus court costs',
    ],
    penaltyExample:
      'So a $1,500 deposit wrongfully withheld can support a judgment for the ' +
      'deposit plus up to $200 and costs. Most landlords settle quickly once they ' +
      'realize you know the law.',
    statuteLine:
      'SDCL \u00a7 43-32-24 and any others triggered by your circumstances \u2014 ' +
      'not generic legalese.',
  },
  notes: [
    {
      kind: 'outdated_figure',
      heading: 'Note:',
      body:
        'Outdated sources sometimes claim a 2\u00d7 penalty \u2014 that figure ' +
        'describes commercial leases, not residential. The residential statute ' +
        'provides forfeiture plus a $200 punitive cap, not a multiplier. Deposits ' +
        'are capped at one month\u2019s rent absent a written special-condition ' +
        'agreement.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'SDCL §§ 43-32-24, 43-32-6.1 (verified against statute text); $200-cap-NOT-2× (residential) + 1-mo cap confirmed (Phase 1 audit)',
};

const TENNESSEE: ScopeGatedJurisdiction = {
  type: 'scope_gated',
  slug: 'tennessee',
  name: 'Tennessee',
  deadlineDays: 30,
  deadlineLabel: '30 days',
  statutes: [{ label: '§ 66-28-301', full: 'Tenn. Code Ann. § 66-28-301' }],
  penalty: {
    kind: 'forfeiture',
    attorneyFees: false,
    short: 'Forfeiture + full deposit',
    long:
      'A landlord who fails to comply with the escrow and accounting requirements ' +
      'forfeits the right to retain any portion of the deposit; the tenant ' +
      'recovers the full deposit plus court costs and any actual damages. ' +
      'Tennessee\u2019s TURLTA provides no damages multiplier \u2014 sources ' +
      'citing "2×" are mistaken.',
  },
  scope: {
    appliesTo:
      'Tenancies in counties with a population above roughly 75,000 \u2014 ' +
      'including the major metros (Davidson/Nashville, Shelby/Memphis, ' +
      'Knox/Knoxville, Hamilton/Chattanooga, and others).',
    exemptFallback:
      'In smaller counties, TURLTA does not apply and your demand rests on your ' +
      'lease and common-law contract rights. Your letter reflects whichever ' +
      'applies to you.',
  },
  statuteCardLabel: '§ 66-28-301',
  statuteCardSubtext: 'Tennessee Code (TURLTA)',
  penaltyCardLabel: 'Forfeiture',
  penaltyCardSubtext: 'of the right to withhold; no multiplier',
  copy: {
    heroSummary:
      "A professional demand letter citing Tennessee's security deposit statute " +
      '(Tenn. Code \u00a7 66-28-301), the 30-day accounting deadline, and the ' +
      'forfeiture remedy for escrow and accounting failures. Ready in minutes.',
    lawSummary:
      'Under Tenn. Code \u00a7 66-28-301, your landlord must hold your deposit in ' +
      'a separate account and, after your tenancy ends, account for it within 30 ' +
      'days \u2014 measured from the later of when you vacate or provide a ' +
      'forwarding address.',
    penaltyLeadIn:
      'Tennessee does not use a 2\u00d7 or 3\u00d7 multiplier. Instead, a ' +
      'landlord who fails to comply with the statute\u2019s escrow and accounting ' +
      'requirements forfeits the right to keep any portion of your deposit, and ' +
      'you may recover:',
    penaltyBullets: [
      'The full deposit back, regardless of claimed deductions',
      'Any actual damages you suffered',
    ],
    penaltyExample:
      'So if your landlord skips the separate account or the required accounting, ' +
      'the deductions collapse and you are owed the entire deposit. Most landlords ' +
      'return it quickly once they realize the law is on your side.',
    statuteLine:
      'Tenn. Code \u00a7 66-28-301 and any others triggered by your ' +
      'circumstances \u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'scope_threshold',
      heading: 'Important scope note:',
      body:
        'Tennessee\u2019s URLTA applies only in counties with a population of ' +
        'more than 75,000 (which includes the major metro areas \u2014 ' +
        'Davidson/Nashville, Shelby/Memphis, Knox/Knoxville, Hamilton/Chattanooga, ' +
        'and others). In smaller counties, your demand rests on your lease and ' +
        'common-law contract rights. There is also a 60-day tenant-response window ' +
        '\u2014 respond promptly to any refund notice. Your letter reflects ' +
        'whichever applies to you.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'Tenn. Code Ann. § 66-28-301 (verified against statute text); forfeiture-NO-multiplier (Phase 5 flag #4 — checklist "2×" wrong) + county-pop gate confirmed (Phase 1 audit)',
};

const UTAH: SimpleJurisdiction = {
  type: 'simple',
  slug: 'utah',
  name: 'Utah',
  deadlineDays: 30,
  deadlineLabel: '30 days',
  statutes: [
    { label: '§ 57-17-5', full: 'Utah Code § 57-17-5' },
    { label: '§ 57-17-3', full: 'Utah Code § 57-17-3' },
  ],
  penalty: {
    kind: 'fixed',
    fixedAmount: 100,
    attorneyFees: false,
    short: 'Deposit + $100',
    long:
      'Utah uses a notice-first mechanic: if the deposit is not returned within ' +
      '30 days, the tenant serves a statutorily formatted notice and the landlord ' +
      'has 5 business days to comply. Continued failure forfeits the deposit and ' +
      'makes the landlord liable for the full deposit, any prepaid rent, and a ' +
      'fixed $100 civil penalty under § 57-17-5. There is no damages multiplier.',
  },
  statuteCardLabel: '§ 57-17-5',
  statuteCardSubtext: 'Utah Code',
  penaltyCardLabel: 'Deposit + $100',
  penaltyCardSubtext: 'plus prepaid rent and fees; no multiplier',
  copy: {
    heroSummary:
      "A professional demand letter citing Utah's security deposit statute " +
      '(Utah Code \u00a7 57-17-5), the 30-day return deadline, and the ' +
      'notice-first remedy that adds a $100 civil penalty. Ready in minutes.',
    lawSummary:
      'Under Utah Code \u00a7 57-17-3, your landlord must return your deposit ' +
      'within 30 days after your tenancy ends, delivered or mailed to your last ' +
      'known address, along with a written, itemized statement of any deductions.',
    penaltyLeadIn:
      'If the landlord fails to comply or acts in bad faith, you may recover:',
    penaltyBullets: [
      'Your full deposit and any prepaid rent',
      'A $100 civil penalty',
    ],
    penaltyExample:
      'So a $1,500 deposit wrongfully withheld can support a judgment of $1,600 ' +
      'plus prepaid rent. Most landlords settle quickly once they realize you ' +
      'know the law.',
    statuteLine:
      'Utah Code \u00a7 57-17-5, \u00a7 57-17-3, and any others triggered by ' +
      'your circumstances \u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'outdated_figure',
      heading: 'Note:',
      body:
        'Utah does not use a 2\u00d7 or 3\u00d7 multiplier \u2014 outdated sources ' +
        'sometimes claim treble damages, but the statute provides your deposit ' +
        'back plus a fixed $100 civil penalty. A landlord must give written notice ' +
        'within five days of your moving out before deducting for damages.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'Utah Code §§ 57-17-3, 57-17-5 (verified against statute text; §57-17-3(2) = flat 30 days to last known address — no forwarding-address extension; §57-17-5(2) fee route two-way prevailing-party, not asserted); notice-first + $100-NOT-3× confirmed (legal audit, July 2026)',
};

const VERMONT: SimpleJurisdiction = {
  type: 'simple',
  slug: 'vermont',
  name: 'Vermont',
  deadlineDays: 14,
  deadlineLabel: '14 days',
  statutes: [{ label: '§ 4461', full: '9 V.S.A. § 4461' }],
  penalty: {
    kind: 'multiplier',
    multiplier: 2,
    attorneyFees: true,
    short: 'Forfeiture / 2× (willful)',
    long:
      'Missing the 14-day deadline forfeits the right to withhold any portion of ' +
      'the deposit under § 4461(e); a willful violation adds double the amount ' +
      'wrongfully withheld plus reasonable attorney fees and costs.',
  },
  statuteCardLabel: '§ 4461',
  statuteCardSubtext: 'Vermont Statutes, Title 9',
  penaltyCardLabel: '2× (willful)',
  penaltyCardSubtext: 'plus forfeiture for missing the deadline',
  copy: {
    heroSummary:
      "A professional demand letter citing Vermont's security deposit statute " +
      '(9 V.S.A. \u00a7 4461), the 14-day return deadline, and the double-damages ' +
      'penalty for willful withholding. Ready in minutes.',
    lawSummary:
      'Under 9 V.S.A. \u00a7 4461, your landlord has 14 days after your tenancy ' +
      'ends to return your security deposit along with a written, itemized ' +
      'statement of any deductions. Missing that deadline forfeits the right to ' +
      'withhold.',
    penaltyLeadIn:
      'If the landlord willfully fails to comply, you may recover:',
    penaltyBullets: [
      'Twice the amount wrongfully withheld',
      "Reasonable attorney's fees and costs",
    ],
    penaltyExample:
      'So a $1,500 deposit willfully withheld can support a court judgment of ' +
      '$3,000 plus fees. Most landlords settle quickly once they realize you know ' +
      'the law.',
    statuteLine:
      '9 V.S.A. \u00a7 4461 and any others triggered by your circumstances ' +
      '\u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'trigger_condition',
      heading: 'Note:',
      body:
        'Even short of willful conduct, missing the 14-day deadline forfeits the ' +
        'landlord\u2019s right to keep any part of your deposit. Seasonal or ' +
        'non-primary residences carry a 60-day deadline instead. Some Vermont ' +
        'municipalities (such as Burlington) add their own ordinances.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    '9 V.S.A. § 4461 (verified against statute text); forfeiture + willful-2× + 60-day seasonal confirmed (Phase 1 audit)',
};

const VIRGINIA: SimpleJurisdiction = {
  type: 'simple',
  slug: 'virginia',
  name: 'Virginia',
  deadlineDays: 45,
  deadlineLabel: '45 days',
  statutes: [{ label: '§ 55.1-1226', full: 'Va. Code § 55.1-1226' }],
  penalty: {
    kind: 'none',
    attorneyFees: false,
    short: 'Return + actual damages',
    long:
      'On a willful failure to comply, the court is required ("shall") to order ' +
      'return of the deposit plus your actual damages under § 55.1-1226(E) ' +
      '\u2014 unless you owe the landlord rent, in which case the court instead ' +
      'credits the deposit against the rent due. There is no statutory ' +
      'multiplier \u2014 sources citing "double the deposit" are mistaken.',
  },
  statuteCardLabel: '§ 55.1-1226',
  statuteCardSubtext: 'Virginia Code (VRLTA)',
  penaltyCardLabel: 'Actual damages',
  penaltyCardSubtext: 'plus mandatory return, for willful failure; no multiplier',
  copy: {
    heroSummary:
      "A professional demand letter citing Virginia's security deposit statute " +
      '(Va. Code \u00a7 55.1-1226), the 45-day return deadline, and the ' +
      'mandatory return-plus-actual-damages remedy for willful failure. Ready in ' +
      'minutes.',
    lawSummary:
      'Under Va. Code \u00a7 55.1-1226, your landlord has 45 days \u2014 ' +
      'measured from the later of the termination of your tenancy or the date ' +
      'you vacate \u2014 to return your security deposit along with a written, ' +
      'itemized statement of any deductions. (A narrow 15-day extension exists, ' +
      'but only where the damages exceed the amount of the deposit AND require a ' +
      'third-party contractor, and the landlord notifies you in writing within ' +
      'the 45 days.)',
    penaltyLeadIn:
      'Virginia does not apply a flat 2\u00d7 or 3\u00d7 multiplier. Where the ' +
      'failure to comply is willful, the court must order:',
    penaltyBullets: [
      'Return of the security deposit to you',
      'Your actual damages on top',
    ],
    penaltyExample:
      'So a landlord who willfully sits on your deposit past the 45-day deadline ' +
      'faces a mandatory order to return it, plus your actual damages. Most ' +
      'landlords return it quickly once they realize the exposure.',
    statuteLine:
      'Va. Code \u00a7 55.1-1226 and any others triggered by your circumstances ' +
      '\u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'deposit_cap',
      heading: 'Good to know:',
      body:
        'Virginia caps security deposits at two months\u2019 rent. Interest is ' +
        'owed only if the landlord owns more than ten units and holds the deposit ' +
        'longer than 13 months. Unclaimed deposits pass to the State Treasurer ' +
        'after one year.',
    },
    {
      kind: 'trigger_condition',
      heading: 'If you owe rent:',
      body:
        'Under \u00a7 55.1-1226(E), where the tenant owes rent, the court ' +
        'credits the deposit against the rent due instead of ordering it ' +
        'returned \u2014 so unpaid rent changes what a Virginia deposit claim ' +
        'can recover. Provide your forwarding address in writing (your letter ' +
        'does): without one, the landlord may simply continue holding the ' +
        'deposit in escrow, and after a year may remit it to the State Treasurer ' +
        'as unclaimed property.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'Va. Code §§ 55.1-1226, 55.1-1201 (verified against statute text at law.lis.virginia.gov; §(E) willful remedy + rent-credit carve-out + 15-day-extension preconditions + later-of anchor; no express forfeiture provision found in (A)–(J), not asserted; fees willful-gated with rent carve-out, not asserted) (legal audit, July 2026)',
};

// ===========================================================================
// PHASE 2 — BATCH 6 (WA, WV, WI, WY, DC). Final state batch — completes all
// 50 states + DC. Facts verified in Phase 1; prose migrated from live pages.
// Notable: WA deadline now 30 days (HB 1074, eff. 7/23/2023 — resolves the
// "was 21" flag); WV penalty = 1.5× (not double); WY full deposit + costs, NO
// multiplier; DC treble (3×) for bad faith with the narrow bad-faith test.
// ===========================================================================

const WASHINGTON: SimpleJurisdiction = {
  type: 'simple',
  slug: 'washington',
  name: 'Washington',
  deadlineDays: 30,
  deadlineLabel: '30 days',
  statutes: [{ label: '§ 59.18.280', full: 'RCW § 59.18.280' }],
  penalty: {
    kind: 'multiplier',
    multiplier: 2,
    attorneyFees: false,
    short: 'up to 2× the deposit',
    long:
      'Missing the 30-day deadline makes the landlord liable for the full deposit ' +
      'and bars any retention claim or defense; for an intentional refusal, a ' +
      'court may additionally award up to twice the amount of the DEPOSIT itself ' +
      '\u2014 not merely the portion withheld \u2014 under § 59.18.280(2).',
  },
  statuteCardLabel: '§ 59.18.280',
  statuteCardSubtext: 'Revised Code of Washington',
  penaltyCardLabel: 'up to 2×',
  penaltyCardSubtext: 'the deposit, for intentional refusal',
  copy: {
    heroSummary:
      "A professional demand letter citing Washington's security deposit statute " +
      '(RCW \u00a7 59.18.280), the 30-day return deadline, and the double-damages ' +
      'penalty for intentional refusal. Ready in minutes.',
    lawSummary:
      'Under RCW \u00a7 59.18.280, your landlord has 30 days after the ' +
      'termination of your rental agreement AND your vacating the premises ' +
      '\u2014 both events \u2014 to return your security deposit or provide a ' +
      'written, itemized statement of any deductions. (This deadline was ' +
      'extended from 21 to 30 days by a 2023 amendment \u2014 many outdated ' +
      'sources still cite the old figure.)',
    penaltyLeadIn:
      'If the landlord fails to meet the deadline or withholds your deposit ' +
      'improperly, you may recover:',
    penaltyBullets: [
      'The full deposit back \u2014 a landlord who misses the deadline is barred from asserting any claim or defense to keep it',
      'Up to two times the amount of the deposit itself, for an intentional refusal',
    ],
    penaltyExample:
      'So a $1,500 deposit intentionally withheld can support a court judgment ' +
      'of up to $3,000 \u2014 and the 2\u00d7 is measured against the whole ' +
      'deposit even if only part was withheld. Most landlords settle quickly ' +
      'once they realize you know the law.',
    statuteLine:
      'RCW \u00a7 59.18.280 and any others triggered by your circumstances ' +
      '\u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'outdated_figure',
      heading: 'Watch for outdated info:',
      body:
        'Washington\u2019s deadline was extended from 21 to 30 days by HB 1074, ' +
        'effective July 23, 2023. Many secondary sources still cite the old ' +
        '21-day figure \u2014 your letter uses the current 30-day rule. A move-in ' +
        'checklist and documentation of deductions are required, or the landlord ' +
        'loses the right to retain.',
    },
    {
      kind: 'general',
      heading: 'Good to know:',
      body:
        'There is no statewide deposit cap, though Seattle caps deposits and ' +
        'move-in fees at one month\u2019s rent. Deposits must be held in a trust ' +
        'account.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'RCW §§ 59.18.280, 59.18.260 (verified against statute text; two-event trigger; 2× base = the deposit; fee provision is two-way prevailing-party, not asserted); 30-day deadline (HB 1074, eff. 7/23/2023) confirmed (legal audit, July 2026)',
};

const WEST_VIRGINIA: SimpleJurisdiction = {
  type: 'simple',
  slug: 'west-virginia',
  name: 'West Virginia',
  homepageDeadlineNote:
    'Shortens to 45 days if the unit is re-rented to a new tenant sooner \u2014 see the full West Virginia rule.',
  deadlineDays: 60,
  deadlineLabel: '60 days',
  statutes: [
    { label: '§ 37-6A-1', full: 'W. Va. Code § 37-6A-1' },
    { label: '§ 37-6A-5', full: 'W. Va. Code § 37-6A-5' },
  ],
  penalty: {
    kind: 'multiplier',
    multiplier: 1.5,
    attorneyFees: false,
    short: 'Deposit + 1.5×',
    long:
      'Willful or not-good-faith noncompliance exposes the landlord, under ' +
      '§ 37-6A-5(a), to the unreturned portion of the deposit PLUS damages equal ' +
      'to one and one-half (1.5) times the amount wrongfully withheld. The ' +
      '"double damages" some sources cite is wrong \u2014 the statute says 1.5×.',
  },
  statuteCardLabel: '§ 37-6A-5',
  statuteCardSubtext: 'West Virginia Code',
  penaltyCardLabel: '1.5× damages',
  penaltyCardSubtext: 'on top of the deposit due, for willful noncompliance',
  copy: {
    heroSummary:
      "A professional demand letter citing West Virginia's security deposit law " +
      '(W. Va. Code \u00a7 37-6A), the return deadline, and the 1.5\u00d7 penalty ' +
      'for willful noncompliance. Ready in minutes.',
    lawSummary:
      'Under W. Va. Code \u00a7 37-6A, your landlord has 60 days after your ' +
      'tenancy ends (or 45 days if a new tenant moves in sooner) to return your ' +
      'security deposit or provide a written, itemized statement of any ' +
      'deductions.',
    penaltyLeadIn:
      'If the landlord deliberately fails to comply, you may recover:',
    penaltyBullets: [
      'The portion of the deposit wrongfully withheld (§ 37-6A-5(a)(1)), plus',
      'Damages equal to one and one-half times that amount, on top (§ 37-6A-5(a)(2))',
    ],
    penaltyExample:
      'So a $1,500 deposit wrongfully withheld can support a court judgment of ' +
      '$3,750 \u2014 the $1,500 back plus $2,250 in damages. Most landlords ' +
      'settle quickly once they realize you know the law.',
    statuteLine:
      'W. Va. Code \u00a7 37-6A-1, \u00a7 37-6A-5, and any others triggered by ' +
      'your circumstances \u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'trigger_condition',
      heading: 'Note:',
      body:
        'The deadline is the shorter of 60 days after termination or 45 days ' +
        'after a new tenant takes possession, extended by 15 days if damages ' +
        'exceed the deposit and a third-party contractor is needed. West Virginia ' +
        'sets no deposit cap and requires no interest.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'W. Va. Code §§ 37-6A-1 to 37-6A-6 (full article fetched T1; remedies = §37-6A-5, which grants NO fees or costs — the only fee provision, §37-6A-4, runs in the landlord-enforcement posture); 1.5×-NOT-double + shorter-of-60/45 + 15-day extension confirmed (legal audit, July 2026)',
};

const WISCONSIN: SimpleJurisdiction = {
  type: 'simple',
  slug: 'wisconsin',
  name: 'Wisconsin',
  deadlineDays: 21,
  deadlineLabel: '21 days',
  statutes: [
    { label: 'ATCP 134.06', full: 'Wis. Admin. Code ATCP 134.06' },
    { label: '§ 704.28', full: 'Wis. Stat. § 704.28' },
    { label: '§ 100.20(5)', full: 'Wis. Stat. § 100.20(5)' },
  ],
  penalty: {
    kind: 'multiplier',
    multiplier: 2,
    attorneyFees: true,
    short: '2× + fees',
    long:
      'A violation of ATCP 134 \u2014 no return or withholdings statement within ' +
      '21 days, or wrongful withholding \u2014 makes the landlord liable for ' +
      'double the amount wrongfully withheld plus court costs and reasonable ' +
      'attorney fees via Wis. Stat. § 100.20(5). A landlord can also face ' +
      'criminal liability under § 100.26(3).',
  },
  statuteCardLabel: 'ATCP 134.06',
  statuteCardSubtext: 'Wisconsin Administrative Code',
  penaltyCardLabel: '2× damages',
  penaltyCardSubtext: 'via § 100.20(5), plus costs and fees',
  copy: {
    heroSummary:
      "A professional demand letter citing Wisconsin's security deposit rules " +
      '(ATCP 134.06 with Wis. Stat. \u00a7 704.28 and \u00a7 100.20(5)), the ' +
      '21-day return deadline, and the double-damages penalty. Ready in minutes.',
    lawSummary:
      'Under Wis. Admin. Code ATCP 134.06, your landlord has 21 days after your ' +
      'tenancy ends to return your security deposit or provide a written, ' +
      'itemized statement of any deductions.',
    penaltyLeadIn:
      'If the landlord wrongfully withholds any part of your deposit, you may ' +
      'recover the following under Wis. Stat. \u00a7 100.20(5):',
    penaltyBullets: [
      'Two times the amount wrongfully withheld',
      "Reasonable attorney's fees and court costs",
    ],
    penaltyExample:
      'So a $1,500 deposit wrongfully withheld can support a court judgment of ' +
      '$3,000 plus fees. Most landlords settle quickly once they realize you know ' +
      'the law.',
    statuteLine:
      'ATCP 134.06, Wis. Stat. \u00a7 704.28, \u00a7 100.20(5), and any others ' +
      'triggered by your circumstances \u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'general',
      heading: 'Good to know:',
      body:
        'Wisconsin\u2019s double-damages remedy comes from the pairing of ATCP ' +
        '134.06 with Wis. Stat. \u00a7 100.20(5) \u2014 the two must be cited ' +
        'together. A landlord must provide a check-in sheet within 7 days or lose ' +
        'the right to make deductions. There is no statewide cap.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'Wis. Stat. §§ 704.28, 100.20(5) + ATCP 134.06 (verified against text; Paulik v. Coombs); 2× via §100.20(5) confirmed (Phase 1 audit)',
};

const WYOMING: SimpleJurisdiction = {
  type: 'simple',
  slug: 'wyoming',
  name: 'Wyoming',
  deadlineDays: 30,
  deadlineLabel: '30 days',
  statutes: [{ label: '§ 1-21-1208', full: 'Wyo. Stat. § 1-21-1208' }],
  penalty: {
    kind: 'forfeiture',
    attorneyFees: false,
    short: 'Full deposit + costs',
    long:
      'An owner who unreasonably fails to comply is liable for the full deposit ' +
      'plus court costs under § 1-21-1208(c); Wyoming uses no multiplier. A ' +
      'two-way fee provision means an owner who prevails against an unreasonable ' +
      'renter may recover costs.',
  },
  statuteCardLabel: '§ 1-21-1208',
  statuteCardSubtext: 'Wyoming Statutes',
  penaltyCardLabel: 'Full deposit',
  penaltyCardSubtext: 'plus court costs; no multiplier',
  copy: {
    heroSummary:
      "A professional demand letter citing Wyoming's security deposit statute " +
      '(Wyo. Stat. \u00a7 1-21-1208), the return deadline, and the full-deposit-' +
      'plus-costs remedy for unreasonable withholding. Ready in minutes.',
    lawSummary:
      'Under Wyo. Stat. \u00a7 1-21-1208, your landlord must return your deposit ' +
      'within 30 days of the end of your tenancy, or within 15 days after you ' +
      'provide a forwarding address if that is later. If the landlord claims ' +
      'property damage, an additional 30 days may apply with a written itemized ' +
      'list.',
    penaltyLeadIn:
      'Wyoming does not use a 2\u00d7 or 3\u00d7 multiplier. A landlord who ' +
      'wrongfully withholds your deposit is liable for:',
    penaltyBullets: [
      'The full deposit wrongfully withheld',
      'Your court costs',
    ],
    penaltyExample:
      'So a landlord who wrongfully keeps your deposit owes it back in full, plus ' +
      'your costs. Most landlords return it quickly once they realize you know ' +
      'the law.',
    statuteLine:
      'Wyo. Stat. \u00a7 1-21-1208 and any others triggered by your ' +
      'circumstances \u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'outdated_figure',
      heading: 'Note:',
      body:
        'Outdated sources sometimes claim a bad-faith multiplier \u2014 ' +
        'Wyoming\u2019s statute provides the return of your full deposit plus ' +
        'court costs, with no 2\u00d7 or 3\u00d7. A landlord may keep a disclosed ' +
        'nonrefundable portion; Wyoming sets no deposit cap.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'Wyo. Stat. § 1-21-1208 (verified against statute text); full-deposit + costs, NO multiplier confirmed (Phase 1 audit)',
};

const DISTRICT_OF_COLUMBIA: SimpleJurisdiction = {
  type: 'simple',
  slug: 'district-of-columbia',
  name: 'District of Columbia',
  deadlineDays: 45,
  deadlineLabel: '45 days',
  statutes: [
    { label: '14 DCMR § 308', full: '14 DCMR § 308' },
    { label: '14 DCMR § 309', full: '14 DCMR § 309' },
  ],
  penalty: {
    kind: 'multiplier',
    multiplier: 3,
    attorneyFees: false,
    short: 'up to 3× (bad faith)',
    long:
      'Failure to return a deposit rightfully owed makes the landlord liable for ' +
      'the amount withheld; withholding in bad faith exposes the landlord to ' +
      'treble (three times) damages under § 309.5. "Bad faith" is defined ' +
      'narrowly \u2014 frivolous, fraudulent, dishonest, or self-serving conduct, ' +
      'not mere negligence or an honest mistake.',
  },
  statuteCardLabel: '14 DCMR § 309',
  statuteCardSubtext: 'D.C. Municipal Regulations',
  penaltyCardLabel: 'up to 3×',
  penaltyCardSubtext: 'for bad-faith withholding',
  copy: {
    heroSummary:
      "A professional demand letter citing the District's security deposit rules " +
      '(14 DCMR \u00a7\u00a7 308\u2013311), the 45-day return deadline, and the ' +
      'treble-damages penalty for bad-faith withholding. Ready in minutes.',
    lawSummary:
      'Under 14 DCMR \u00a7 308, your landlord has 45 days after your tenancy ' +
      'ends to return your deposit or send written notice of any deductions, and ' +
      'then 30 days to refund the balance after that notice.',
    penaltyLeadIn:
      'If the landlord withholds your deposit in bad faith, you may recover under ' +
      '\u00a7 309:',
    penaltyBullets: [
      'Treble (three times) the amount wrongfully withheld',
      'Plus forfeiture of the right to withhold for procedural violations',
    ],
    penaltyExample:
      'So a $1,500 deposit withheld in bad faith can support a court judgment of ' +
      'up to $4,500. Most landlords settle quickly once they realize you know the ' +
      'law.',
    statuteLine:
      '14 DCMR \u00a7\u00a7 308\u2013311 and any others triggered by your ' +
      'circumstances \u2014 not generic legalese.',
  },
  notes: [
    {
      kind: 'deposit_cap',
      heading: 'Good to know:',
      body:
        'The District caps deposits at one month\u2019s rent, charged once, and ' +
        'requires deposits to be held in an interest-bearing D.C. account. ' +
        'Interest is paid for tenancies of 12 months or longer; a bad-faith ' +
        'failure to pay owed interest can itself support treble damages.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    '14 DCMR §§ 308\u2013311 (D.C. Code § 42-3502.17) (verified against text); two-step deadline + treble-for-bad-faith + 1-mo cap confirmed (Phase 1 audit)',
};

/** All 51 jurisdictions (50 states + DC) now populated and Phase-1-audited.
 *  Batches 1\u20135 plus Batch 6 (WA, WV, WI, WY, DC) complete the states.
 *  Remaining Phase 2 work: the 10 city overlays (Batch 7), tracked in the
 *  separate CITY_OVERLAYS array below. */
export const JURISDICTIONS: Jurisdiction[] = [
  TEXAS,
  FLORIDA,
  ARKANSAS,
  ALABAMA,
  ALASKA,
  ARIZONA,
  CALIFORNIA,
  COLORADO,
  NEW_YORK,
  CONNECTICUT,
  DELAWARE,
  GEORGIA,
  HAWAII,
  IDAHO,
  ILLINOIS,
  INDIANA,
  IOWA,
  KANSAS,
  KENTUCKY,
  LOUISIANA,
  MAINE,
  MARYLAND,
  MASSACHUSETTS,
  MICHIGAN,
  MINNESOTA,
  MISSISSIPPI,
  MISSOURI,
  MONTANA,
  NEBRASKA,
  NEVADA,
  NEW_HAMPSHIRE,
  NEW_JERSEY,
  NEW_MEXICO,
  NORTH_CAROLINA,
  NORTH_DAKOTA,
  OHIO,
  OKLAHOMA,
  OREGON,
  PENNSYLVANIA,
  RHODE_ISLAND,
  SOUTH_CAROLINA,
  SOUTH_DAKOTA,
  TENNESSEE,
  UTAH,
  VERMONT,
  VIRGINIA,
  WASHINGTON,
  WEST_VIRGINIA,
  WISCONSIN,
  WYOMING,
  DISTRICT_OF_COLUMBIA,
];

/** Lookup helper the page components will use. */
export function getJurisdiction(slug: string): Jurisdiction | undefined {
  return JURISDICTIONS.find((j) => j.slug === slug);
}

// ---------------------------------------------------------------------------
// THREE WORKED CITY EXAMPLES (one per relationship type, hardest real cases).
// Values mirror systemPrompt.ts; still primary-source RE-VERIFIED in Phase 1.
// ---------------------------------------------------------------------------

/** AUGMENTS — the two-layer canonical. State ORS 90.300 (2x) and city PCC
 *  30.01.087 ($250/violation) BOTH apply and are kept strictly distinct. */
const PORTLAND_OR: AugmentingCity = {
  type: 'augments',
  slug: 'portland-or',
  name: 'Portland, Oregon',
  homepageSummary:
    'Portland layers extra duties on Oregon\'s 31-day state rules \u2014 deposit caps in some cases, a separate interest-bearing account, condition reports, and notice requirements, at $250 per violation.',
  parentStateSlug: 'oregon',
  statutes: [
    { label: 'PCC § 30.01.087', full: 'Portland City Code § 30.01.087' },
  ],
  cityPenalty: {
    kind: 'fixed',
    fixedAmount: 250,
    attorneyFees: true,
    short: '$250 per violation',
    long:
      'Under PCC § 30.01.087 (amended through Ordinance 191973, eff. January 1, ' +
      '2025), a landlord who violates any of the section\u2019s duties is liable ' +
      'for up to $250 per violation, plus actual damages and reasonable attorney ' +
      'fees and costs.',
  },
  cityDuties: [
    'Caps the deposit: one full month\u2019s rent if last month\u2019s rent was NOT collected (§ A.2), or half a month\u2019s rent additional if last month\u2019s rent WAS collected (§ A.1)',
    'Where the tenant was conditionally approved under the screening ordinance, permits an additional deposit of up to half a month\u2019s rent \u2014 but the landlord MUST offer to accept it in installments over up to three months (§ A.3, added eff. 1/1/2025)',
    'Requires a separate financial-institution account within two weeks of receipt (interest to the tenant)',
    'Requires a signed condition report at move-in',
    'Requires a notice of rights with the final accounting and a rent-payment-history form on request',
  ],
  stateStillApplies:
    'Oregon state law (ORS 90.300) also applies independently: a 31-day return ' +
    'deadline and up to 2\u00d7 the wrongfully withheld deposit. This 2\u00d7 is ' +
    'the STATE penalty on the deposit money itself \u2014 separate from, and ' +
    'stackable with, the city\u2019s $250-per-violation penalty for procedural failures.',
  notes: [
    {
      kind: 'general',
      heading: 'Two independent layers:',
      body:
        'A Portland letter can invoke both \u2014 ORS 90.300\u2019s 2\u00d7 on the ' +
        'wrongfully withheld deposit AND PCC 30.01.087\u2019s $250 for each ' +
        'procedural failure. The $250-per-violation figure is the city penalty; ' +
        'the 2\u00d7 lives only at the state level.',
    },
    {
      kind: 'general',
      heading: 'Not Portland, Maine:',
      body: 'These Oregon rules do not apply to Portland, Maine \u2014 Maine tenants follow Maine state law only.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource: 'PCC § 30.01.087 fetched T1 in full (A–G; history through Ord. 191973, eff. 1/1/2025 — all three cap branches); ORS 90.300 re-verified; two-layer confirmed distinct (legal audit, July 2026)',
};

/** REPLACES — Evanston's own ordinance governs the timeline/penalty; the
 *  Illinois 765 ILCS 710 timeline does NOT apply here. */
/** NOT YET COVERED — Evanston has its own security-deposit ordinance that
 *  applies instead of the Illinois default, and our verification of it against
 *  the ordinance text is not complete. By product decision (July 2026), no
 *  Evanston letters are offered (the letter path is blocked client- and
 *  server-side) and the site carries an honest note instead of unverified
 *  numbers. Typed 'defers' so no city page is generated; the `apply` field is
 *  inert while the letter block stands. Do NOT re-publish the old 21-day /
 *  1.5×-cap / 2×-penalty figures — they were never verified. */
const EVANSTON_IL: DeferringCity = {
  type: 'defers',
  slug: 'evanston-il',
  name: 'Evanston, Illinois',
  cardLabel: 'Not yet covered',
  homepageSummary:
    'We don\u2019t cover Evanston yet \u2014 Evanston has its own security deposit ordinance that applies instead of the standard Illinois rules, and our verification of it against the ordinance text isn\u2019t complete. Evanston letters aren\u2019t offered until it is.',
  parentStateSlug: 'illinois',
  statutes: [
    { label: 'City Code Title 5, Ch. 3', full: 'Evanston Residential Landlord and Tenant Ordinance (City Code Title 5, Chapter 3)' },
  ],
  apply:
    'Do not generate Evanston letters \u2014 the letter path is blocked. ' +
    'Evanston has its own Residential Landlord and Tenant Ordinance that ' +
    'applies instead of the standard Illinois rules, and it has not been ' +
    'verified against the ordinance text.',
  notes: [
    {
      kind: 'general',
      heading: 'Why Evanston is different:',
      body:
        'Evanston maintains its own Residential Landlord and Tenant Ordinance ' +
        'covering security deposits \u2014 it follows neither the Chicago RLTO ' +
        'nor the default Illinois state rules. Until our verification of the ' +
        'ordinance text is complete, we don\u2019t publish Evanston deadlines ' +
        'or penalties and don\u2019t offer Evanston letters. Evanston tenants ' +
        'can consult the City of Evanston\u2019s housing office or local legal ' +
        'aid in the meantime.',
    },
  ],
  lastVerified: '2026-07-05',
  primarySource:
    'RESOLVED BY DECISION, not by statutory read (Batch 27–28, July 2026) — municode publisher wall never cleared; no Evanston provision is on file. Prior 21-day/1.5×/2× figures were unverified Phase-1 claims and are retired.',
};

/** DEFERS — Cambridge has no exceeding ordinance; Massachusetts state law
 *  controls and should be applied prominently. */
const CAMBRIDGE_MA: DeferringCity = {
  type: 'defers',
  slug: 'cambridge-ma',
  name: 'Cambridge, Massachusetts',
  homepageSummary:
    'No separate Cambridge deposit ordinance \u2014 Massachusetts\'s strict MGL c.186 \u00a7 15B framework applies in full (30-day return, treble damages plus fees).',
  parentStateSlug: 'massachusetts',
  statutes: [
    { label: 'MGL c.186 § 15B', full: 'Massachusetts General Laws ch. 186, § 15B' },
  ],
  apply:
    'Apply Massachusetts state law (MGL c.186 § 15B) prominently: 30-day return, ' +
    'and 3\u00d7 damages plus interest plus attorney fees for wrongful withholding.',
  notes: [
    {
      kind: 'general',
      heading: 'No exceeding local ordinance:',
      body:
        'Cambridge has a Rent Stabilization Board legacy but no current municipal ' +
        'security-deposit ordinance beyond state law \u2014 the strong MA state ' +
        'remedy is what governs.',
    },
  ],
  lastVerified: '2026-07-05',
  primarySource: 'MGL c.186 § 15B (verified); confirmed no exceeding Cambridge deposit ordinance (Phase 1 audit)',
};

// ===========================================================================
// PHASE 2 — BATCH 7 (the 10 remaining city overlays). Completes all 13 cities.
// Verified in Phase 1's city audit. Classification: Chicago + Cook County
// REPLACE the IL timeline; SF/Berkeley/LA/WeHo/Seattle AUGMENT their state law
// (mostly interest layers on CA §1950.5, plus Seattle's cap/fee rules on RCW);
// NYC/Baltimore/Philadelphia DEFER to state law (NYC's distinctive layer is the
// §7-107 carve-out already carried in the NY state entry; Philadelphia is
// medium-confidence — no distinct ordinance surfaced).
//
// DATA-FILE RULE (from the Phase 1 findings): CA-city deposit-interest rates
// (SF / Berkeley / LA / WeHo) and Chicago's rate republish annually — these
// entries reference the PUBLISHING BODY and never hardcode a rate.
// ===========================================================================

/** REPLACES — the Chicago RLTO governs the deposit timeline/penalty; Illinois
 *  765 ILCS 710 does NOT apply within its scope. */
const CHICAGO_IL: ReplacingCity = {
  type: 'replaces',
  slug: 'chicago-il',
  name: 'Chicago, Illinois',
  homepageSummary:
    'The Chicago RLTO governs covered Chicago rentals \u2014 deposit plus interest due within 45 days of vacating (itemized statement with receipts within 30 days when deducting), with a strict-liability 2\u00d7 penalty plus interest. Owner-occupied buildings of six or fewer units are exempt.',
  parentStateSlug: 'illinois',
  deadlineDays: 45,
  deadlineLabel: '30 / 45 days',
  statutes: [
    { label: 'RLTO § 5-12-080', full: 'Chicago Residential Landlord and Tenant Ordinance § 5-12-080' },
    { label: 'RLTO § 5-12-180', full: 'Chicago Residential Landlord and Tenant Ordinance § 5-12-180' },
  ],
  penalty: {
    kind: 'multiplier',
    multiplier: 2,
    attorneyFees: false,
    short: '2× (strict liability)',
    long:
      'A violation of § 5-12-080 makes the landlord liable for twice the deposit ' +
      'amount plus interest under § 5-12-180 \u2014 strict liability, with no ' +
      'good-faith defense (a limited cure provision exists only for a ' +
      'merely-deficient interest payment). Fee-shifting exists under § 5-12-180 ' +
      'but carries a carve-out for forcible entry and detainer actions, so it is ' +
      'not asserted here.',
  },
  displaces:
    'For covered Chicago units, the RLTO \u2014 not the state default \u2014 ' +
    'sets the deposit timeline and the automatic (strict-liability) 2\u00d7 ' +
    'penalty; it is stricter than the Illinois Security Deposit Return Act (765 ' +
    'ILCS 710) on both. State-law rights remain available in parallel where they ' +
    'apply \u2014 the ordinance adds protection rather than erasing state law. ' +
    'Lead with the RLTO.',
  notes: [
    {
      kind: 'scope_threshold',
      heading: 'Scope:',
      body:
        'The RLTO covers most Chicago rentals EXCEPT owner-occupied buildings of ' +
        'six or fewer units. Within scope it requires return of the deposit plus ' +
        'interest within 45 days of vacating (7 days for a fire/casualty ' +
        'termination), and an itemized statement with paid receipts within 30 ' +
        'days when deducting.',
    },
    {
      kind: 'general',
      heading: 'Interest:',
      body:
        'Deposits must be held in a separate Illinois interest-bearing account, ' +
        'with annual interest if held more than six months. Chicago\u2019s ' +
        'required rate is set and republished annually by the City Comptroller ' +
        '\u2014 your letter references the current published rate rather than a ' +
        'stale figure.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'Chicago RLTO §§ 5-12-080, 5-12-180 (verified against ordinance text); strict-liability 2× + 45-day + owner-occ ≤6 carve-out confirmed (Phase 1 audit)',
};

/** REPLACES — the Cook County RTLO governs where it applies (unincorporated
 *  county + municipalities without their own comprehensive ordinance). */
const COOK_COUNTY_IL: ReplacingCity = {
  type: 'replaces',
  slug: 'cook-county-il',
  name: 'Cook County, Illinois',
  homepageSummary:
    'The Cook County RTLO governs suburban Cook County outside Chicago \u2014 30-day return, with a 2\u00d7-plus-fees penalty for violations.',
  parentStateSlug: 'illinois',
  deadlineDays: 30,
  deadlineLabel: '30 days',
  statutes: [
    { label: 'RTLO § 42-111', full: 'Cook County Residential Tenant and Landlord Ordinance § 42-111 (adopted as § 42-811, Ord. 20-3562)' },
  ],
  penalty: {
    kind: 'multiplier',
    multiplier: 2,
    attorneyFees: true,
    short: '2× + fees',
    long:
      'The tenant \u201cshall be awarded\u201d twice the security deposit plus ' +
      'reasonable attorney\u2019s fees for a violation of the deposit cap, the ' +
      'installment right, or the 30-day return-and-itemization duty \u2014 the ' +
      'three strict-liability duties under § 42-111(M)(1). The separate-account ' +
      'and bank-disclosure duties are enforceable too, but only after the tenant ' +
      'serves written notice and the landlord fails to cure within two business ' +
      'days (§ 42-111(M)(2)).',
  },
  displaces:
    'For units the RTLO covers, its own 30-day deadline and automatic 2\u00d7 ' +
    'penalty govern the deposit \u2014 lead with the RTLO. The ordinance ' +
    'expressly preserves rights under Illinois state law and other local ' +
    'ordinances (§ 42-115), so state-law claims remain available in parallel; ' +
    'the only state provision it supersedes outright is § 18 of the Mobile Home ' +
    'Landlord and Tenant Rights Act.',
  notes: [
    {
      kind: 'scope_threshold',
      heading: 'Scope:',
      body:
        'Enacted in 2021, the RTLO covers unincorporated Cook County plus ' +
        'municipalities that lack their own comprehensive ordinance \u2014 it does ' +
        'NOT apply in Chicago, Evanston, Oak Park, or other cities with their own ' +
        'rules. It caps deposits at 1.5 months\u2019 rent and requires a separate ' +
        'Illinois account, written bank disclosure, and a signed receipt.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'Cook County RTLO Art. IV, adopted §§ 42-801–816 (Ord. 20-3562, full Board text) — codified §§ 42-101–116, live deposit section § 42-111; (M)(1) strict trio = cap/installments/30-day return, (M)(2) notice + 2-business-day cure for account/disclosure duties; § 42-115 preservation + § 42-103(A)(1) MHLTRA-§18-only supersession (legal audit, July 2026)',
};

/** AUGMENTS — San Francisco layers a deposit-interest requirement on top of
 *  California Civil Code § 1950.5, which still fully applies. */
const SAN_FRANCISCO_CA: AugmentingCity = {
  type: 'augments',
  slug: 'san-francisco-ca',
  name: 'San Francisco, California',
  homepageSummary:
    'San Francisco adds an annual deposit-interest requirement (with a penalty if unpaid) on top of California\'s \u00a7 1950.5 rules.',
  parentStateSlug: 'california',
  statutes: [
    { label: 'SF Admin Code Ch. 49', full: 'San Francisco Administrative Code Chapter 49' },
  ],
  cityPenalty: {
    kind: 'none',
    attorneyFees: false,
    short: 'Interest owed',
    long:
      'San Francisco\u2019s overlay is a deposit-interest requirement rather than ' +
      'a separate withholding penalty: Chapter 49 imposes no multiplier or late ' +
      'fee of its own \u2014 its remedies section (§ 49.3) simply applies the ' +
      'state remedies of Civil Code § 1950.5. A landlord who fails to pay the ' +
      'required interest owes that interest, and the tenant may pursue it ' +
      'directly.',
  },
  cityDuties: [
    'Pay annual interest on deposits held longer than one year, for ALL residential units except government-subsidized ones',
    'Use the interest rate published annually by the SF Rent Board (rate year runs March 1\u2013February 28)',
    'Pay the interest on the tenant\u2019s annual due date, by direct payment or rent credit (the landlord chooses the method)',
    'On move-out, pay any unpaid accrued interest pro-rata no later than two weeks after the tenant vacates (§ 49.2(c)) \u2014 a city clock shorter than the state\u2019s 21 days',
  ],
  stateStillApplies:
    'California Civil Code § 1950.5 applies in full: a 21-day return deadline, up ' +
    'to 2\u00d7 the deposit for bad-faith withholding plus actual damages, the ' +
    'one-month cap (AB 12), and the AB 2801 photo-evidence rules. The city layer ' +
    'adds interest on top \u2014 it does not replace the state remedy.',
  notes: [
    {
      kind: 'general',
      heading: 'Interest rate — published annually:',
      body:
        'The SF Rent Board publishes the deposit-interest rate each March; it ' +
        'changes every year. Your letter references the currently published SF ' +
        'Rent Board rate rather than a hardcoded number. For Rent-Ordinance units, ' +
        'a landlord may deduct 50% of the annual Rent Board fee from the interest.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'SF Admin Code Ch. 49 read in full (§§ 49.1–49.5; codified current); § 49.3 imports Civ. Code § 1950.5 remedies — NO city penalty exists; § 49.2(c) 14-day post-vacancy interest clock; § 49.4 waiver void (legal audit, July 2026)',
};

/** AUGMENTS — Berkeley layers a deposit-interest requirement on § 1950.5. */
const BERKELEY_CA: AugmentingCity = {
  type: 'augments',
  slug: 'berkeley-ca',
  name: 'Berkeley, California',
  homepageSummary:
    'Berkeley requires annual deposit interest at the city-published Berkeley Bank Rate \u2014 and if last year\u2019s interest is unpaid by Jan 31, it is recomputed at a 10% rate and deductible from rent \u2014 on top of California\'s \u00a7 1950.5 rules.',
  parentStateSlug: 'california',
  statutes: [
    { label: 'BMC § 13.76', full: 'Berkeley Municipal Code § 13.76' },
  ],
  cityPenalty: {
    kind: 'fixed',
    fixedAmount: 750,
    attorneyFees: false,
    short: '10% rate + overcharge route',
    long:
      'Two city-level mechanisms exist. First, deposit interest: if the annual ' +
      'interest has not been refunded by January 31, the tenant may recover it ' +
      'by deducting it from rent \u2014 automatically, with no notice required ' +
      '\u2014 and the immediately preceding year\u2019s interest is recomputed ' +
      'at a 10% rate instead of the published Berkeley rate (Regulation 704; ' +
      'earlier years use the published table rates). Second, wrongful retention ' +
      'of the deposit itself: Regulation 706(A) deems a deposit retained in ' +
      'violation of Civil Code § 1950.5 a rent overcharge, recoverable through ' +
      'the Rent Board\u2019s petition process within three years \u2014 with ' +
      'remedies including recovery of the overcharge and, on a bad-faith claim ' +
      'or retention, up to $750 in addition to actual damages. State § 1950.5 ' +
      'remedies also remain fully available.',
  },
  cityDuties: [
    'Pay annual security-deposit interest, due by December each year',
    'Use the annually-published Berkeley Bank Rate',
    'Refund any unpaid interest by January 31 \u2014 after that date the tenant may deduct it from rent, with the preceding year\u2019s interest recomputed at a 10% rate (Reg. 704)',
  ],
  stateStillApplies:
    'California Civil Code § 1950.5 applies in full: a 21-day return deadline, up ' +
    'to 2\u00d7 for bad-faith withholding plus actual damages, the one-month cap ' +
    '(AB 12), and the AB 2801 photo-evidence rules. Berkeley adds the interest ' +
    'layer on top.',
  notes: [
    {
      kind: 'general',
      heading: 'Interest rate — published annually:',
      body:
        'Berkeley sets a "Berkeley Bank Rate" each year; your letter references ' +
        'the current published rate rather than a hardcoded number. The 10% in ' +
        'Regulation 704 is a substitute RATE for the immediately preceding ' +
        'year\u2019s unpaid interest \u2014 not a 10%-of-deposit penalty added ' +
        'on top \u2014 and it attaches automatically after January 31 with no ' +
        'notice required.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'Berkeley Rent Board Regs. 704/705/706 re-fetched T1 (Batch 30; Reg. 704 as amended 9/19/2019 — substitute rate, automatic, rent-deduction self-help; Reg. 706(A) overcharge route → Reg. 1271, unchanged since 1999) + BMC § 13.76.150(A) (Board petition, up to $750 bad-faith, 3-yr window) (legal audit, July 2026)',
};

/** AUGMENTS — Los Angeles layers a deposit-interest requirement on § 1950.5. */
const LOS_ANGELES_CA: AugmentingCity = {
  type: 'augments',
  slug: 'los-angeles-ca',
  name: 'Los Angeles, California',
  homepageSummary:
    'For rent-stabilized units, Los Angeles requires annual interest on deposits held a year or longer, at the rate set by the Rent Adjustment Commission \u2014 on top of California\'s \u00a7 1950.5 rules.',
  parentStateSlug: 'california',
  statutes: [
    { label: 'LAMC § 151.06.02', full: 'Los Angeles Municipal Code § 151.06.02 (Rent Stabilization Ordinance)' },
  ],
  cityPenalty: {
    kind: 'none',
    attorneyFees: false,
    short: 'Interest layer',
    long:
      'Los Angeles\u2019s overlay is a deposit-interest requirement rather than a ' +
      'separate withholding multiplier: a landlord subject to § 1950.5 must pay ' +
      'annual interest on deposits held at least one year, with unpaid accrued ' +
      'interest due at the end of the tenancy. State § 1950.5 governs wrongful ' +
      'withholding of the deposit itself.',
  },
  cityDuties: [
    'Pay annual interest on deposits held one year or longer (accruing monthly since Nov 1, 1990)',
    'Use the rate set annually by the Rent Adjustment Commission (RAC), or the actual interest earned',
    'Pay by direct payment or rent credit; pay any unpaid accrued interest at the end of the tenancy',
  ],
  stateStillApplies:
    'California Civil Code § 1950.5 applies in full: a 21-day return deadline, up ' +
    'to 2\u00d7 for bad-faith withholding plus actual damages, the one-month cap ' +
    '(AB 12), and the AB 2801 photo-evidence rules. Los Angeles adds the interest ' +
    'layer on top.',
  notes: [
    {
      kind: 'general',
      heading: 'Interest rate — published annually:',
      body:
        'The LA Rent Adjustment Commission publishes the deposit-interest rate ' +
        'each year; your letter references the current RAC rate rather than a ' +
        'hardcoded number.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'LAMC § 151.06.02 (RSO; overlay on § 1950.5) (verified); RAC-published annual interest confirmed (Phase 1 audit)',
};

/** AUGMENTS — West Hollywood layers a rent-stabilized deposit-interest
 *  requirement on § 1950.5. */
const WEST_HOLLYWOOD_CA: AugmentingCity = {
  type: 'augments',
  slug: 'west-hollywood-ca',
  name: 'West Hollywood, California',
  homepageSummary:
    'For rent-stabilized units, West Hollywood requires annual deposit interest at the city-published rate \u2014 on top of California\'s \u00a7 1950.5 rules.',
  parentStateSlug: 'california',
  statutes: [
    { label: 'WHMC RSO', full: 'West Hollywood Municipal Code, Rent Stabilization Ordinance' },
  ],
  cityPenalty: {
    kind: 'multiplier',
    multiplier: 3,
    attorneyFees: false,
    short: 'Treble (willful) + $1,000 route',
    long:
      'West Hollywood\u2019s general-remedies chapter reaches the deposit rules. ' +
      'Under WHMC § 17.68.010(c), a person who willfully demands, accepts, or ' +
      'retains any payment in violation of Title 17 is liable for three times ' +
      'the unlawful excess, with attorney\u2019s fees and costs available to the ' +
      'tenant, and retention is a continuing violation until refunded. Under ' +
      '§ 17.68.010(d), any Title 17 violation \u2014 including failure to pay ' +
      'the required deposit interest \u2014 separately supports actual damages ' +
      'or $1,000 (whichever is greater) plus potential punitive damages. State ' +
      '§ 1950.5 remedies also remain fully available.',
  },
  cityDuties: [
    'Pay annual security-deposit interest on rent-stabilized units',
    'Use the rate published annually by the city (historically low \u2014 0% in some years)',
  ],
  stateStillApplies:
    'California Civil Code § 1950.5 applies in full: a 21-day return deadline, up ' +
    'to 2\u00d7 for bad-faith withholding plus actual damages, the one-month cap ' +
    '(AB 12), and the AB 2801 photo-evidence rules. West Hollywood adds the ' +
    'interest layer on top for rent-stabilized units.',
  notes: [
    {
      kind: 'general',
      heading: 'Interest rate — published annually:',
      body:
        'West Hollywood publishes the deposit-interest rate each year (it has been ' +
        '0% in some years); your letter references the current published rate ' +
        'rather than a hardcoded number.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'WHMC Ch. 17.32 (§§ 17.32.010–.100) + § 17.24.010 exemptions + § 17.68.010 remedies (a)–(l), all fetched T1 (ecode360); §17.68.010(c) treble + fees on willful unlawful payments, (d) $1,000-or-actual + punitive + fees for any Title 17 violation (legal audit, July 2026)',
};

/** AUGMENTS — Seattle layers cap and fee rules on top of RCW 59.18.280. */
const SEATTLE_WA: AugmentingCity = {
  type: 'augments',
  slug: 'seattle-wa',
  name: 'Seattle, Washington',
  homepageSummary:
    'Seattle caps the deposit plus nonrefundable move-in fees at one month\'s rent (pet deposits at 25%) and requires installment plans \u2014 Washington\'s 30-day return rules still govern the deposit itself.',
  parentStateSlug: 'washington',
  statutes: [
    { label: 'SMC 7.24', full: 'Seattle Municipal Code Chapter 7.24' },
  ],
  cityPenalty: {
    kind: 'multiplier',
    multiplier: 2,
    attorneyFees: true,
    short: '2× unlawful charge + fees',
    long:
      'Seattle\u2019s ordinance carries its own private right of action: a ' +
      'landlord who violates the deposit, fee-cap, or installment requirements ' +
      'is liable to the tenant under SMC 7.24.060 for actual damages plus ' +
      'interest, double any penalties imposed by the City, DOUBLE the amount of ' +
      'any prohibited fee or security deposit unlawfully charged or withheld, ' +
      'and reasonable attorney fees and costs. This city remedy is separate ' +
      'from \u2014 and stacks with \u2014 the state RCW 59.18.280 remedies for ' +
      'wrongful withholding.',
  },
  cityDuties: [
    'Cap the deposit plus nonrefundable move-in fees at one month\u2019s rent',
    'Limit any pet damage deposit to 25% of one month\u2019s rent',
    'Offer mandatory installment payment plans for move-in costs',
  ],
  stateStillApplies:
    'Washington RCW 59.18.280 applies in full: a 30-day return deadline, the full ' +
    'deposit owed if the deadline is missed, up to 2\u00d7 for an intentional ' +
    'refusal, trust-account holding, and a required move-in checklist. Seattle ' +
    'adds the cap and fee rules on top.',
  notes: [
    {
      kind: 'general',
      heading: 'Local caps:',
      body:
        'Seattle\u2019s distinctive layer is on the front end \u2014 how much can ' +
        'be charged and how it can be collected \u2014 rather than the return ' +
        'penalty, which remains the state\u2019s.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'Seattle SMC 7.24 — Ord. 125222 §§ 1–14 fetched in full (seattle.legistar.com); § 7.24.060 current text confirmed against the City\'s own 2026 redline baseline (last amended Ord. 125334): actual damages + interest, 2× City penalties, 2× unlawful fee/deposit, mandatory fees; § 7.24.050 separate fee award; caps + installment plans verified (legal audit, July 2026)',
};

/** DEFERS — New York City's deposit framework IS the New York State framework;
 *  the distinctive NYC layer (the § 7-107 rent-stabilized carve-out) is already
 *  carried in the New York state entry. */
/** AUGMENTS — New York City adds no deposit-RETURN ordinance of its own (the
 *  state 14-day rules govern the ordinary withheld-deposit case), but for
 *  rent-stabilized units an EXCESS deposit at collection is a rent overcharge
 *  under the Rent Stabilization Code, reaching the DHCR overcharge machinery —
 *  a real, NYC-specific remedy channel. Bounded per the CC-35 decision: site
 *  content + DHCR Form RA-89 pointer only; nothing letter-facing. */
const NEW_YORK_CITY_NY: AugmentingCity = {
  type: 'augments',
  slug: 'new-york-city-ny',
  name: 'New York City, New York',
  homepageSummary:
    'NYC adds no separate deposit-return ordinance \u2014 the state 14-day rules govern \u2014 but for rent-stabilized units an excess deposit above the one-month cap is a rent overcharge recoverable through DHCR (Form RA-89), with treble damages for willful overcharges.',
  parentStateSlug: 'new-york',
  statutes: [
    { label: 'GOL § 7-108', full: 'New York General Obligations Law § 7-108' },
    { label: '9 NYCRR § 2520.6(c)', full: 'Rent Stabilization Code, 9 NYCRR § 2520.6(c)' },
    { label: 'Admin Code § 26-516', full: 'NYC Administrative Code § 26-516' },
  ],
  cityPenalty: {
    kind: 'multiplier',
    multiplier: 3,
    attorneyFees: false,
    short: 'Overcharge route (rent-stabilized)',
    long:
      'For rent-stabilized units, the Rent Stabilization Code folds an excess ' +
      'security deposit into the definition of \u201crent,\u201d so a deposit ' +
      'collected above the one-month cap can be pursued as a rent overcharge ' +
      '(9 NYCRR \u00a7 2520.6(c)) \u2014 filed with DHCR on Form RA-89, with ' +
      'treble damages where the overcharge was willful (willfulness is ' +
      'presumed and the owner bears the burden of rebutting it), a six-year ' +
      'recovery window, and costs in that proceeding (Admin Code ' +
      '\u00a7 26-516). Important limit: this channel attaches to an EXCESS ' +
      'deposit at collection \u2014 it is not a remedy for the ordinary ' +
      'failure to return a lawful one-month deposit at move-out, which the ' +
      'state \u00a7 7-108 rules govern.',
  },
  cityDuties: [
    'For rent-stabilized units, treat any deposit demanded above one month\u2019s rent as a rent overcharge under the Rent Stabilization Code \u2014 the tenant can file DHCR Form RA-89',
  ],
  stateStillApplies:
    'New York State law governs the deposit itself throughout the city: GOL ' +
    '\u00a7 7-108\u2019s 14-day return-or-itemize deadline (missing it ' +
    'forfeits any right to retain), up to 2\u00d7 the deposit for a willful ' +
    'violation, the statewide one-month cap, \u00a7 7-103\u2019s ' +
    'interest/trust-account rules for six-plus-unit buildings, and the ' +
    '\u00a7 7-107 rent-stabilized carve-out (eff. Nov 15, 2025).',
  notes: [
    {
      kind: 'scope_threshold',
      heading: 'A narrow legacy exception:',
      body:
        'Under Admin Code \u00a7 26-511(c)(5), certain legacy rent-stabilized ' +
        'tenancies involving tenants 62 and older or SSI/SSDI recipients may ' +
        'lawfully retain a pre-existing two-month deposit \u2014 so an ' +
        'above-one-month deposit is not automatically an overcharge in every ' +
        'case.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'NYC Admin Code §§ 26-511, 26-516 fetched in full T1 (codelibrary.amlegal.com); 9 NYCRR § 2520.6(c) T1 off DHCR\u2019s own rule-text PDF; mechanism confirmed by four DHCR-published documents incl. Fact Sheet #9 / Form RA-89 (legal audit, July 2026)',
};

/** DEFERS — Baltimore applies Maryland state law; its distinctive local law is
 *  the habitability Rent Escrow Law, not a deposit-return ordinance. */
const BALTIMORE_MD: DeferringCity = {
  type: 'defers',
  slug: 'baltimore-md',
  name: 'Baltimore, Maryland',
  homepageSummary:
    'No separate Baltimore deposit ordinance \u2014 Maryland state law applies: 45-day return, up to treble damages plus fees for withholding without a reasonable basis.',
  parentStateSlug: 'maryland',
  statutes: [
    { label: 'Md. Real Prop. § 8-203', full: 'Maryland Code, Real Property § 8-203' },
  ],
  apply:
    'Apply Maryland state law (Md. Real Property § 8-203): a 45-day return, up to ' +
    'treble (3\u00d7) plus fees for a failure "without a reasonable basis," escrow ' +
    'within 30 days, interest at the greater of the U.S. Treasury one-year rate ' +
    'or 1.5% (for deposits held six months or more), and a one-month cap for ' +
    'leases entered on or after October 1, 2024 (previously two months). Tenants ' +
    'may attend a final inspection with 15 days\u2019 notice.',
  notes: [
    {
      kind: 'general',
      heading: 'No separate Baltimore deposit-return ordinance:',
      body:
        'Baltimore adds no deposit-return timeline or penalty of its own \u2014 ' +
        'deposit returns follow Maryland state law. Baltimore\u2019s distinctive ' +
        'local layers are the Rent Escrow Law (§ 8-211, habitability) and one ' +
        'narrow city remedy: under Balt. City Public Local Laws § 9-14.1(a)(2), ' +
        'a tenant whose dwelling was unfit for habitation at the start of ' +
        'occupancy may rescind the lease within 30 days of moving in and recover ' +
        'all deposits \u2014 a non-waivable right, though it does not reach the ' +
        'ordinary end-of-tenancy withheld-deposit dispute.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'Baltimore City Code/Charter/PLL corpus read in full off the publisher\'s canonical mirror (baltimore-legref/law-xml, 2026-07-17); defers verified; PLL § 9-14.1(a)(2) rescission remedy noted; Md. Real Prop. § 8-203 state layer re-verified (legal audit, July 2026)',
};

/** DEFERS — Philadelphia: no distinct city deposit-return ordinance surfaced in
 *  the Phase 1 pass; medium confidence. Applies Pennsylvania state law. */
/** AUGMENTS — Philadelphia's Unfair Rental Practices code (§ 9-804) layers a
 *  city retention prohibition, cap prohibition, installment right, and a city
 *  damages remedy on top of Pennsylvania law, which still fully applies. */
const PHILADELPHIA_PA: AugmentingCity = {
  type: 'augments',
  slug: 'philadelphia-pa',
  name: 'Philadelphia, Pennsylvania',
  homepageSummary:
    'Philadelphia\u2019s Unfair Rental Practices code (\u00a7 9-804) bars unlawfully retaining any security deposit \u2014 with a city remedy of actual damages or one month\u2019s rent \u2014 on top of Pennsylvania\u2019s 30-day / double-damages rules, which still fully apply.',
  parentStateSlug: 'pennsylvania',
  statutes: [
    { label: 'Phila. Code § 9-804', full: 'Philadelphia Code § 9-804 (Unfair Rental Practices)' },
  ],
  cityPenalty: {
    kind: 'fixed',
    attorneyFees: false,
    short: "1 month's rent (elected)",
    long:
      'Under Phila. Code \u00a7 9-804(4)(c), no landlord may \u201cunlawfully ' +
      'retain any security deposit, however styled in a lease\u201d \u2014 the ' +
      'prohibition reaches deposits relabelled as non-refundable fees. A person ' +
      'aggrieved by a violation of subsection (4) may recover, under ' +
      '\u00a7 9-804(16), actual damages or \u2014 at the tenant\u2019s ' +
      'election before judgment \u2014 statutory damages equal to one ' +
      'month\u2019s rent. These rights cannot be waived by lease (\u00a7 ' +
      '9-804(15)), and a tenant may complain to the Fair Housing Commission or ' +
      'plead the violation in court (\u00a7 9-804(14)).',
  },
  cityDuties: [
    'No security deposit may exceed what 68 P.S. \u00a7 250.511a permits \u2014 a city-level prohibition on top of the state cap, separately enforceable under \u00a7 9-804(16)',
    'Where a first-year deposit exceeds one month\u2019s rent, the landlord must accept, at the tenant\u2019s choice, either a lump sum or one month up front with the remainder in three equal monthly payments (landlords of two or fewer rental units are exempt from this installment rule only, with ownership aggregated across related entities)',
    'No unlawful retention of any security deposit, \u201chowever styled in a lease\u201d (\u00a7 9-804(4)(c))',
  ],
  stateStillApplies:
    'Pennsylvania law (68 P.S. \u00a7 250.512) applies in full: a 30-day ' +
    'deadline for the written list and refund, double the amount by which the ' +
    'deposit exceeds actual damages, and the strict \u00a7 250.512(e) rule ' +
    'that a tenant who fails to provide a written forwarding address at ' +
    'move-out relieves the landlord of all liability under the section. The ' +
    'city remedy is separate and additional.',
  notes: [
    {
      kind: 'general',
      heading: 'Attorney\u2019s fees are discretionary:',
      body:
        'Under \u00a7 9-804(16) the court MAY award reasonable attorney\u2019s ' +
        'fees and costs \u2014 it is not an entitlement, so this page does not ' +
        'promise them.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'Phila. Code § 9-804 fetched in full at T1 (codelibrary.amlegal.com, 2026 Code current, runs (1)–(16); hist. ends Bill No. 250044-A, eff. 12/2/2025); §9-804(4)(a)–(c) duties + (16) remedy + (15) no-waiver + (14) enforcement routes verified (legal audit, July 2026)',
};

// ===========================================================================
// PHASE 1b — city cleanup (Santa Monica, Boston). These two existed in
// systemPrompt.ts but were outside the original 13-city Phase 1 scope and had
// never been primary-source audited. Verified July 7, 2026 against the Santa
// Monica Rent Control Charter (§ 1803(s), current codified text + Action
// Apartment Assn. v. SMRCB (2001)) and MGL c.186 § 15B / mass.gov / MassLegalHelp.
// Added here so the data file matches the prompt's 15-city coverage.
// ===========================================================================

/** AUGMENTS — Santa Monica layers a deposit-interest/escrow requirement on top
 *  of California Civil Code § 1950.5, which still fully governs deadline and
 *  penalty. */
const SANTA_MONICA_CA: AugmentingCity = {
  type: 'augments',
  slug: 'santa-monica-ca',
  name: 'Santa Monica, California',
  homepageSummary:
    'Santa Monica\'s rent-control charter (\u00a7 1803(s)) requires deposits for controlled units to sit in an interest-bearing account, and Board Reg. \u00a7 14002 adds a city deposit ceiling \u2014 on top of California\'s \u00a7 1950.5 rules.',
  parentStateSlug: 'california',
  statutes: [
    { label: 'SM Charter § 1803(s)', full: 'Santa Monica Rent Control Charter Amendment § 1803(s)' },
  ],
  cityPenalty: {
    kind: 'none',
    attorneyFees: false,
    short: 'Escrow + city ceiling',
    long:
      'Santa Monica\u2019s overlay is an escrow-and-ceiling layer rather than a ' +
      'separate withholding multiplier: deposits for controlled units must be ' +
      'held in an interest-bearing account at a federally insured institution ' +
      '(Charter \u00a7 1803(s) / Reg. \u00a7 14001(a)), and Board Reg. ' +
      '\u00a7 14002 caps the deposit itself. The state \u00a7 1950.5 penalties ' +
      'remain the route for wrongful withholding of the deposit.',
  },
  cityDuties: [
    'Hold the deposit in an interest-bearing account at a federally insured financial institution (\u00a7 1803(s) / Reg. \u00a7 14001(a))',
    'Keep the deposit within the city ceiling of Reg. \u00a7 14002 (roughly one month\u2019s maximum-allowable rent, with a small-landlord exception of up to two months)',
    'Do not raise an established deposit during the tenancy (Reg. \u00a7 14002(c)) \u2014 a Santa Monica protection with no state-law counterpart',
  ],
  stateStillApplies:
    'California Civil Code § 1950.5 applies in full: a 21-day return deadline, up ' +
    'to 2\u00d7 the deposit for bad-faith withholding plus actual damages, the ' +
    'statewide AB 12 cap, and the AB 2801 photo-evidence rules. For controlled ' +
    'units Santa Monica adds its own, separate deposit ceiling (Reg. § 14002) ' +
    'and escrow rule on top \u2014 it does not replace the state remedy.',
  notes: [
    {
      kind: 'general',
      heading: 'Interest payment is not currently required:',
      body:
        'The Board regulation that once set an interest-payment mechanic (Reg. ' +
        '\u00a7 14001(b)\u2013(f)) has been suspended since 2002, and under ' +
        'Charter \u00a7 1803(s) paying the account\u2019s interest to the ' +
        'tenant is at the landlord\u2019s option. What remains mandatory is the ' +
        'interest-bearing-account placement itself. (Santa Monica\u2019s former ' +
        'flat 3% rate was struck down in Action Apartment Assn. v. Santa Monica ' +
        'Rent Control Bd. (2001) \u2014 no published city rate currently exists.)',
    },
    {
      kind: 'general',
      heading: 'Correct section cite:',
      body:
        'The deposit-interest provision is Charter § 1803(s) in the current ' +
        'codified text \u2014 not § 1803(f), which some older secondary sources ' +
        '(and an earlier draft) cited in error.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'SM Charter Art. XVIII (§§ 1800–1821) + Rent Control Board Regs. Ch. 14 (§§ 14000–14003, amendments eff. 8/17/24) fetched T1; Reg. §14001(b)–(f) suspended since 6/22/02 (payment landlord-optional per §1803(s)); Reg. §14002 city ceiling + small-landlord 2-mo exception + no-mid-tenancy-increase (legal audit, July 2026)',
};

/** DEFERS — Boston applies Massachusetts state law; it has NO separate
 *  municipal security-deposit ordinance. */
const BOSTON_MA: DeferringCity = {
  type: 'defers',
  slug: 'boston-ma',
  name: 'Boston, Massachusetts',
  homepageSummary:
    'No separate Boston deposit ordinance \u2014 Massachusetts\'s strict MGL c.186 \u00a7 15B framework applies in full (30-day return, treble damages plus fees).',
  parentStateSlug: 'massachusetts',
  statutes: [
    { label: 'MGL c.186 § 15B', full: 'Massachusetts General Laws Chapter 186, § 15B' },
  ],
  apply:
    'Apply Massachusetts state law (MGL c.186 § 15B): a 30-day return, a separate ' +
    'interest-bearing Massachusetts account, 5% (or lesser bank-rate) interest, ' +
    'and a one-month cap. For the three triggering violations (no separate ' +
    'interest-bearing account, failure to return within 30 days with the required ' +
    'statement, or failure to transfer to a successor), treble (3\u00d7) damages ' +
    'plus interest, costs, and attorney fees are MANDATORY and non-discretionary ' +
    '(Mellor v. Berman).',
  notes: [
    {
      kind: 'general',
      heading: 'No separate Boston deposit ordinance:',
      body:
        'Boston has no municipal security-deposit ordinance beyond state law ' +
        '(verified against mass.gov, MassLegalHelp, and MassLandlords). The City ' +
        'of Boston\u2019s Office of Housing Stability provides enforcement and ' +
        'tenant education but adds no deposit escrow, interest, or return rules. ' +
        'Deposit returns follow MGL c.186 § 15B.',
    },
  ],
  lastVerified: '2026-07-20',
  primarySource:
    'MGL c.186 § 15B (verified against mass.gov + MassLegalHelp + MassLandlords); confirmed Boston has NO separate municipal deposit ordinance (Phase 1b audit)',
};

/** All 15 city overlays now populated and audited: 3 originally seeded
 *  (Portland, Evanston, Cambridge) + Batch 7 (Chicago, Cook County, SF, Berkeley,
 *  LA, West Hollywood, Seattle, NYC, Baltimore, Philadelphia) + Phase 1b
 *  cleanup (Santa Monica, Boston). */
export const CITY_OVERLAYS: CityOverlay[] = [
  PORTLAND_OR,
  EVANSTON_IL,
  CAMBRIDGE_MA,
  CHICAGO_IL,
  COOK_COUNTY_IL,
  SAN_FRANCISCO_CA,
  BERKELEY_CA,
  LOS_ANGELES_CA,
  WEST_HOLLYWOOD_CA,
  SEATTLE_WA,
  NEW_YORK_CITY_NY,
  BALTIMORE_MD,
  PHILADELPHIA_PA,
  SANTA_MONICA_CA,
  BOSTON_MA,
];

/** Lookup helper for city overlay pages. */
export function getCityOverlay(slug: string): CityOverlay | undefined {
  return CITY_OVERLAYS.find((c) => c.slug === slug);
}

// ---------------------------------------------------------------------------
// Homepage lookup helpers
// ---------------------------------------------------------------------------
// Added when lib/stateDeadlines.ts (a third, manually-synced copy of the legal
// data) was retired. The homepage deadline lookup now derives from THIS file,
// so the homepage and the /states pages can never drift apart. These helpers
// return small serializable rows computed server-side (app/page.tsx) and
// passed to the client component as props, so the full data file never ships
// in the client bundle.

export interface HomepageStateRow {
  slug: string;
  name: string;
  days: string;
  statute: string;
  deadlineNote?: string;
}

export interface HomepageCityRow {
  name: string;
  ordinance: string;
  summary: string;
}

export function getHomepageStates(): HomepageStateRow[] {
  return [...JURISDICTIONS]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((j) => ({
      slug: j.slug,
      name: j.name,
      days: j.deadlineLabel,
      statute: `${j.statuteCardLabel} \u00b7 ${j.statuteCardSubtext}`,
      ...(j.homepageDeadlineNote ? { deadlineNote: j.homepageDeadlineNote } : {}),
    }));
}

/** Map of parent-state display name -> that state's city overlay rows. */
export function getHomepageCityMap(): Record<string, HomepageCityRow[]> {
  const map: Record<string, HomepageCityRow[]> = {};
  for (const c of CITY_OVERLAYS) {
    const parent = JURISDICTIONS.find((j) => j.slug === c.parentStateSlug);
    if (!parent) continue;
    (map[parent.name] ??= []).push({
      name: c.name,
      ordinance: c.statutes[0]?.label ?? '',
      summary: c.homepageSummary,
    });
  }
  return map;
}
