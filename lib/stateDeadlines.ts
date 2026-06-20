// lib/stateDeadlines.ts
// Single source of truth for the homepage "Know your deadline" lookup.
//
// IMPORTANT: This file mirrors the legal data in lib/systemPrompt.ts. When a
// deadline, statute citation, or city rule changes in systemPrompt.ts, update
// the matching entry HERE as well so the public-facing lookup stays in sync.
// Nothing on the homepage hardcodes deadline data anymore — it all flows from
// the two exported arrays below.

export interface StateDeadline {
  /** Full state name, e.g. "California". Matches the form's US_STATES list. */
  state: string;
  /** Human-readable return window, e.g. "21 days" or "14–30 days". */
  days: string;
  /** Primary statute citation shown to the visitor. */
  statute: string;
}

export interface CityOverlay {
  /** City label. Matches the verbatim city strings used in systemPrompt.ts. */
  city: string;
  /** Parent state (full name) so we can group overlays under their state. */
  state: string;
  /** One- or two-sentence summary of how the city differs from the state baseline. */
  summary: string;
  /** Local ordinance / authority citation. */
  ordinance: string;
}

// ---- STATE BASELINE DEADLINES (51 jurisdictions: 50 states + DC) ----
export const STATE_DEADLINES: StateDeadline[] = [
  { state: 'Alabama', days: '60 days', statute: 'Ala. Code § 35-9A-201' },
  { state: 'Alaska', days: '14–30 days', statute: 'Alaska Stat. § 34.03.070' },
  { state: 'Arizona', days: '14 business days', statute: 'A.R.S. § 33-1321' },
  { state: 'Arkansas', days: '60 days', statute: 'Ark. Code § 18-16-305' },
  { state: 'California', days: '21 days', statute: 'Cal. Civ. Code § 1950.5' },
  { state: 'Colorado', days: '30–60 days', statute: 'Colo. Rev. Stat. § 38-12-103' },
  { state: 'Connecticut', days: '15–30 days', statute: 'Conn. Gen. Stat. § 47a-21' },
  { state: 'Delaware', days: '20 days', statute: '25 Del. C. § 5514' },
  { state: 'District of Columbia', days: '45 days', statute: '14 DCMR § 309' },
  { state: 'Florida', days: '15–30 days', statute: 'Fla. Stat. § 83.49' },
  { state: 'Georgia', days: '30 days', statute: 'O.C.G.A. § 44-7-34' },
  { state: 'Hawaii', days: '14 days', statute: 'Haw. Rev. Stat. § 521-44' },
  { state: 'Idaho', days: '21 days', statute: 'Idaho Code § 6-321' },
  { state: 'Illinois', days: '30–45 days', statute: '765 ILCS 710' },
  { state: 'Indiana', days: '45 days', statute: 'Ind. Code § 32-31-3-12' },
  { state: 'Iowa', days: '30 days', statute: 'Iowa Code § 562A.12' },
  { state: 'Kansas', days: '30 days', statute: 'Kan. Stat. § 58-2550' },
  { state: 'Kentucky', days: '30–60 days', statute: 'Ky. Rev. Stat. § 383.580' },
  { state: 'Louisiana', days: '30 days', statute: 'La. R.S. § 9:3251' },
  { state: 'Maine', days: '21–30 days', statute: '14 M.R.S. § 6033' },
  { state: 'Maryland', days: '45 days', statute: 'Md. Real Prop. § 8-203' },
  { state: 'Massachusetts', days: '30 days', statute: 'Mass. Gen. Laws ch. 186, § 15B' },
  { state: 'Michigan', days: '30 days', statute: 'Mich. Comp. Laws § 554.609' },
  { state: 'Minnesota', days: '21 days', statute: 'Minn. Stat. § 504B.178' },
  { state: 'Mississippi', days: '45 days', statute: 'Miss. Code § 89-8-21' },
  { state: 'Missouri', days: '30 days', statute: 'Mo. Rev. Stat. § 535.300' },
  { state: 'Montana', days: '10–30 days', statute: 'Mont. Code § 70-25-202' },
  { state: 'Nebraska', days: '14 days', statute: 'Neb. Rev. Stat. § 76-1416' },
  { state: 'Nevada', days: '30 days', statute: 'NRS § 118A.242' },
  { state: 'New Hampshire', days: '30 days', statute: 'N.H. Rev. Stat. § 540-A:7' },
  { state: 'New Jersey', days: '30 days', statute: 'N.J. Stat. § 46:8-21.1' },
  { state: 'New Mexico', days: '30 days', statute: 'N.M. Stat. § 47-8-18' },
  { state: 'New York', days: '14 days', statute: 'N.Y. Gen. Oblig. Law § 7-108' },
  { state: 'North Carolina', days: '30 days', statute: 'N.C. Gen. Stat. § 42-52' },
  { state: 'North Dakota', days: '30 days', statute: 'N.D. Cent. Code § 47-16-07.1' },
  { state: 'Ohio', days: '30 days', statute: 'Ohio Rev. Code § 5321.16' },
  { state: 'Oklahoma', days: '45 days', statute: '41 Okla. Stat. § 115' },
  { state: 'Oregon', days: '31 days', statute: 'ORS § 90.300' },
  { state: 'Pennsylvania', days: '30 days', statute: '68 Pa. C.S. § 250.512' },
  { state: 'Rhode Island', days: '20 days', statute: 'R.I. Gen. Laws § 34-18-19' },
  { state: 'South Carolina', days: '30 days', statute: 'S.C. Code § 27-40-410' },
  { state: 'South Dakota', days: '14–45 days', statute: 'S.D. Codified Laws § 43-32-24' },
  { state: 'Tennessee', days: '30 days', statute: 'Tenn. Code § 66-28-301' },
  { state: 'Texas', days: '30 days', statute: 'Tex. Prop. Code § 92.103' },
  { state: 'Utah', days: '30 days', statute: 'Utah Code § 57-17-3' },
  { state: 'Vermont', days: '14 days', statute: '9 V.S.A. § 4461' },
  { state: 'Virginia', days: '45 days', statute: 'Va. Code § 55.1-1226' },
  { state: 'Washington', days: '30 days', statute: 'RCW § 59.18.280' },
  { state: 'West Virginia', days: '60 days', statute: 'W. Va. Code § 37-6A-2' },
  { state: 'Wisconsin', days: '21 days', statute: 'Wis. Admin. Code ATCP 134.06' },
  { state: 'Wyoming', days: '30 days', statute: 'Wyo. Stat. § 1-21-1208' },
];

// ---- CITY OVERLAYS (13 jurisdictions with rules that differ from the state) ----
// City strings match the verbatim values used in lib/systemPrompt.ts.
export const CITY_OVERLAYS: CityOverlay[] = [
  {
    city: 'Chicago',
    state: 'Illinois',
    summary:
      'Interest-bearing accounts required, with annual interest paid to the tenant and an itemized statement within 30 days. Violations expose the landlord to 2× the deposit plus interest and attorney fees.',
    ordinance: 'Chicago RLTO § 5-12-080',
  },
  {
    city: 'Cook County (outside Chicago)',
    state: 'Illinois',
    summary:
      'Covers unincorporated Cook County and suburbs without their own ordinance. 30-day return, deposit capped at 1.5× monthly rent, separate Illinois account required, and 2× the deposit plus attorney fees for violations.',
    ordinance: 'Cook County RTLO § 42-800 et seq.',
  },
  {
    city: 'Evanston',
    state: 'Illinois',
    summary:
      'Evanston runs its own ordinance with a 21-day return deadline (not the Illinois 30/45-day timeline), a 1.5× rent deposit cap, and up to 2× the wrongfully withheld amount plus attorney fees.',
    ordinance: 'Evanston RLTO (City Code Title 5, Ch. 3)',
  },
  {
    city: 'New York City',
    state: 'New York',
    summary:
      'Rent-stabilized tenants whose lease or renewal began on or after Nov. 15, 2025 gain GOL § 7-107 protections: 14-day return, itemized statement, forfeiture for missing the deadline, and up to 2× for willful withholding.',
    ordinance: 'N.Y. Gen. Oblig. Law § 7-107 (S952B, eff. Nov. 15, 2025)',
  },
  {
    city: 'Seattle',
    state: 'Washington',
    summary:
      'Adds a deposit cap (1 month unfurnished), a mandatory move-in checklist — if missing, the landlord must return the full deposit — and installment-payment rights. The 30-day return matches state law.',
    ordinance: 'Seattle Municipal Code § 7.24',
  },
  {
    city: 'Portland',
    state: 'Oregon',
    summary:
      'On top of the state penalty, Portland adds up to $250 per violation plus attorney fees for procedural failures (separate account, condition report, required notices), and caps deposits where last month\u2019s rent is collected.',
    ordinance: 'Portland City Code § 30.01.087',
  },
  {
    city: 'San Francisco',
    state: 'California',
    summary:
      'Annual interest is required on deposits held more than one year, at a rate set each March by the SF Rent Board. State penalties (Cal. Civ. Code § 1950.5) still apply on top.',
    ordinance: 'SF Administrative Code Ch. 49.2',
  },
  {
    city: 'Los Angeles',
    state: 'California',
    summary:
      'For RSO/rent-stabilized units, annual interest is required on deposits held over a year, at a rate published by the LA Housing Department. Non-RSO units follow Cal. Civ. Code § 1950.5 only.',
    ordinance: 'LAMC § 151.06.02',
  },
  {
    city: 'Berkeley',
    state: 'California',
    summary:
      'Annual interest is required on covered units, the deposit is capped at one month\u2019s rent (eff. July 1, 2024), and a tenant can recover 10% of the deposit by rent deduction if interest goes unpaid.',
    ordinance: 'Berkeley Municipal Code § 13.76.070',
  },
  {
    city: 'West Hollywood',
    state: 'California',
    summary:
      'For RSO-covered units, annual interest is required on the deposit at a rate set each year by the Rent Stabilization Commission. State remedies under Cal. Civ. Code § 1950.5 also apply.',
    ordinance: 'WHMC § 17.32.020',
  },
  {
    city: 'Santa Monica',
    state: 'California',
    summary:
      'The deposit must be held in an interest-bearing account. The return deadline (21 days) and bad-faith penalty (up to 2×) are governed by California state law.',
    ordinance: 'Santa Monica Rent Control Charter Amendment § 1803(f)',
  },
  {
    city: 'Boston',
    state: 'Massachusetts',
    summary:
      'Standard Massachusetts law applies, including the strong triple-damages remedy plus interest and attorney fees. Boston actively enforces tenant protections through its Office of Housing Stability.',
    ordinance: 'MGL c. 186 § 15B (state law)',
  },
  {
    city: 'Cambridge',
    state: 'Massachusetts',
    summary:
      'Standard Massachusetts law applies, including triple damages plus interest and attorney fees. Cambridge has no current municipal deposit ordinance exceeding state law.',
    ordinance: 'MGL c. 186 § 15B (state law)',
  },
];

/** Look up the baseline deadline entry for a full state name. */
export function getStateDeadline(state: string): StateDeadline | undefined {
  return STATE_DEADLINES.find((s) => s.state === state);
}

/** Return any city overlays that belong to the given full state name. */
export function getCityOverlaysForState(state: string): CityOverlay[] {
  return CITY_OVERLAYS.filter((o) => o.state === state);
}
