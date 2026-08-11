// SecurityDepositForm.tsx  (repo root)
'use client';

import { useEffect, useState } from 'react';
import { getAttribution } from './lib/attribution';

// Basic email format check. Kept byte-for-byte identical to the server mirror
// in app/api/create-checkout-session/route.ts so client and server never drift.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois',
  'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts',
  'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota',
  'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

// Two-letter codes for composing address strings (USPS-style).
const STATE_ABBR: { [key: string]: string } = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
  'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'District of Columbia': 'DC',
  'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL',
  'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA',
  'Maine': 'ME', 'Maryland': 'MD', 'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN',
  'Mississippi': 'MS', 'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK', 'Oregon': 'OR',
  'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC', 'South Dakota': 'SD',
  'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT', 'Virginia': 'VA',
  'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
};

// City dropdown source.
// IMPORTANT: The special-jurisdiction city strings below are matched verbatim
// by lib/systemPrompt.ts (Chicago RLTO, NYC escrow, Philadelphia § 9-804, etc.)
// and by the showRentStabilized logic (=== 'New York City'). DO NOT alter these
// strings:
//   San Francisco, Los Angeles, Berkeley, West Hollywood, Santa Monica,
//   Chicago, Cook County (outside Chicago), Evanston, New York City, Seattle,
//   Portland, Boston, Cambridge, Washington DC, Philadelphia, Baltimore
// (Philadelphia + Baltimore added to this list July 22, 2026 — both gained
// their own systemPrompt.ts city sections in the correction batch; Evanston is
// matched by the C0 coverage block, not a prompt section.)
// General cities are added alongside them and carry no special legal logic.
// An "Other city" option is appended to every state and reveals a write-in.
const CITIES_BY_STATE: { [key: string]: string[] } = {
  'Alabama': ['Birmingham', 'Montgomery', 'Huntsville', 'Mobile', 'Tuscaloosa', 'Hoover', 'Auburn'],
  'Alaska': ['Anchorage', 'Fairbanks', 'Juneau', 'Wasilla', 'Sitka', 'Ketchikan', 'Kenai'],
  'Arizona': ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale', 'Glendale', 'Tempe'],
  'Arkansas': ['Little Rock', 'Fayetteville', 'Fort Smith', 'Springdale', 'Jonesboro', 'Conway', 'Rogers'],
  'California': ['San Francisco', 'Los Angeles', 'Berkeley', 'West Hollywood', 'Santa Monica', 'San Diego', 'San Jose', 'Sacramento', 'Long Beach', 'Fresno'],
  'Colorado': ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Lakewood', 'Boulder', 'Pueblo'],
  'Connecticut': ['Bridgeport', 'New Haven', 'Hartford', 'Stamford', 'Waterbury', 'Norwalk', 'Danbury'],
  'Delaware': ['Wilmington', 'Dover', 'Newark', 'Middletown', 'Smyrna', 'Milford', 'Bear'],
  'District of Columbia': ['Washington DC'],
  'Florida': ['Jacksonville', 'Miami', 'Tampa', 'Orlando', 'St. Petersburg', 'Port St. Lucie', 'Tallahassee', 'Fort Lauderdale'],
  'Georgia': ['Atlanta', 'Augusta', 'Columbus', 'Savannah', 'Athens', 'Sandy Springs', 'Macon'],
  'Hawaii': ['Honolulu', 'Hilo', 'Kailua', 'Kapolei', 'Pearl City', 'Waipahu', 'Kaneohe'],
  'Idaho': ['Boise', 'Meridian', 'Nampa', 'Idaho Falls', 'Caldwell', 'Pocatello', 'Coeur d\u2019Alene'],
  'Illinois': ['Chicago', 'Cook County (outside Chicago)', 'Evanston', 'Aurora', 'Naperville', 'Rockford', 'Springfield', 'Peoria'],
  'Indiana': ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Carmel', 'Fishers', 'Bloomington'],
  'Iowa': ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City', 'Iowa City', 'Ankeny', 'Waterloo'],
  'Kansas': ['Wichita', 'Overland Park', 'Kansas City', 'Olathe', 'Topeka', 'Lawrence', 'Shawnee'],
  'Kentucky': ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro', 'Covington', 'Richmond', 'Florence'],
  'Louisiana': ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette', 'Lake Charles', 'Kenner', 'Bossier City'],
  'Maine': ['Portland', 'Lewiston', 'Bangor', 'South Portland', 'Auburn', 'Biddeford', 'Augusta'],
  'Maryland': ['Baltimore', 'Columbia', 'Germantown', 'Silver Spring', 'Waldorf', 'Frederick', 'Rockville'],
  'Massachusetts': ['Boston', 'Cambridge', 'Worcester', 'Springfield', 'Lowell', 'Brockton', 'Quincy'],
  'Michigan': ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Ann Arbor', 'Lansing', 'Flint'],
  'Minnesota': ['Minneapolis', 'St. Paul', 'Rochester', 'Bloomington', 'Duluth', 'Brooklyn Park', 'Plymouth'],
  'Mississippi': ['Jackson', 'Gulfport', 'Southaven', 'Hattiesburg', 'Biloxi', 'Meridian', 'Tupelo'],
  'Missouri': ['Kansas City', 'St. Louis', 'Springfield', 'Columbia', 'Independence', 'Lee\u2019s Summit', 'O\u2019Fallon'],
  'Montana': ['Billings', 'Missoula', 'Great Falls', 'Bozeman', 'Butte', 'Helena', 'Kalispell'],
  'Nebraska': ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island', 'Kearney', 'Fremont', 'Hastings'],
  'Nevada': ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas', 'Sparks', 'Carson City', 'Elko'],
  'New Hampshire': ['Manchester', 'Nashua', 'Concord', 'Derry', 'Dover', 'Rochester', 'Salem'],
  'New Jersey': ['Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Edison', 'Trenton', 'Camden'],
  'New Mexico': ['Albuquerque', 'Las Cruces', 'Rio Rancho', 'Santa Fe', 'Roswell', 'Farmington', 'Hobbs'],
  'New York': ['New York City', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse', 'Albany', 'New Rochelle'],
  'North Carolina': ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem', 'Fayetteville', 'Cary'],
  'North Dakota': ['Fargo', 'Bismarck', 'Grand Forks', 'Minot', 'West Fargo', 'Williston', 'Mandan'],
  'Ohio': ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton', 'Parma'],
  'Oklahoma': ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow', 'Edmond', 'Lawton', 'Moore'],
  'Oregon': ['Portland', 'Salem', 'Gresham', 'Hillsboro', 'Bend', 'Beaverton'],
  'Pennsylvania': ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading', 'Scranton', 'Bethlehem'],
  'Rhode Island': ['Providence', 'Warwick', 'Cranston', 'Pawtucket', 'East Providence', 'Woonsocket', 'Newport'],
  'South Carolina': ['Charleston', 'Columbia', 'North Charleston', 'Mount Pleasant', 'Rock Hill', 'Greenville', 'Summerville'],
  'South Dakota': ['Sioux Falls', 'Rapid City', 'Aberdeen', 'Brookings', 'Watertown', 'Mitchell', 'Pierre'],
  'Tennessee': ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Clarksville', 'Murfreesboro', 'Franklin'],
  'Texas': ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso', 'Arlington', 'Plano'],
  'Utah': ['Salt Lake City', 'West Valley City', 'Provo', 'West Jordan', 'Orem', 'Sandy', 'St. George'],
  'Vermont': ['Burlington', 'South Burlington', 'Rutland', 'Essex', 'Colchester', 'Bennington', 'Montpelier'],
  'Virginia': ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond', 'Arlington', 'Alexandria', 'Newport News'],
  'Washington': ['Seattle', 'Spokane', 'Vancouver', 'Bellevue', 'Kent', 'Everett'],
  'West Virginia': ['Charleston', 'Huntington', 'Morgantown', 'Parkersburg', 'Wheeling', 'Martinsburg', 'Fairmont'],
  'Wisconsin': ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha', 'Racine', 'Appleton', 'Waukesha'],
  'Wyoming': ['Cheyenne', 'Casper', 'Laramie', 'Gillette', 'Rock Springs', 'Sheridan', 'Green River'],
};

const OTHER_CITY = 'Other city';

// --- C0 (correction batch, July 2026): Evanston, IL coverage block. ---
// Evanston has its own security-deposit ordinance that governs INSTEAD of the
// Illinois state default, and the legal audit could not verify the numbers our
// Evanston overlay carries against primary sources. Until that verification is
// complete, the letter path is blocked for Evanston with an honest "we don't
// cover this city yet" screen — no charge is ever made. The same rule is
// mirrored server-side in create-checkout-session so a bypassed client can
// never pay. Keep this predicate byte-for-byte equivalent to the server's.
// (State-gated on Illinois so Evanston, WY etc. are unaffected; normalized so
// a typed "evanston" via the Other-city write-in is caught too.)
const isUncoveredCity = (state: string, city: string) =>
  state === 'Illinois' && city.trim().toLowerCase() === 'evanston';

// States whose statutory return clock is triggered by (or measured from) the
// date the tenant provided a forwarding/new mailing address.
const FORWARDING_ADDRESS_STATES = [
  'Connecticut',
  'South Dakota',
  'Iowa',
  'Nebraska',
  'Wyoming',
];

// States whose statute applies only above a building unit-count threshold.
// (Illinois removed July 2026 — P.A. 103-224, eff. 1/1/2024, repealed the
// Security Deposit Return Act's old 5-unit gate; the Act is now statewide.)
const UNIT_COUNT_STATES = ['Arkansas', 'New York'];

// Maine's deadline is 21 days for a tenancy-at-will (no written lease) vs 30
// days under a written lease, so the letter needs the lease type.
const LEASE_TYPE_STATES = ['Maine'];

// NOTE (Change 6): Alaska's 14-vs-30-day notice branch is now DERIVED from the
// Quick Case Check "proper written notice" question (single source of truth),
// rather than a separate Alaska-only field. See deriveGaveWrittenNotice() and
// the Alaska required-field check in validateForm.

interface ScenarioItem { id: string; label: string; icon: string; tip: string; }
interface CircumstanceItem { id: string; label: string; tip: string; }

// Project I — the AUTHORITATIVE single-select scenario ("what the landlord
// did with your deposit"). Exactly one may be selected; it is the letter-type
// decision and the single source of truth the letter is built around.
// IDs are matched verbatim by lib/systemPrompt.ts and mirrored in
// app/api/create-checkout-session/route.ts (SCENARIO_IDS) — keep in sync.
const SCENARIOS: ScenarioItem[] = [
  { id: 'no_response', label: 'No response at all \u2014 my landlord has gone silent', icon: '\uD83D\uDD07', tip: 'You\u2019ve received nothing back and your landlord hasn\u2019t responded or made any claim on your deposit. Total silence past the deadline is one of the strongest positions \u2014 in many states it forfeits their right to keep anything.' },
  { id: 'full_withholding_no_itemization', label: 'Kept everything \u2014 vague reason or no itemization', icon: '\u274C', tip: 'Your landlord kept the entire deposit but gave only a vague or general reason, with no written itemized breakdown. Example: they said \u201Ccleaning and repairs\u201D with no documentation.' },
  { id: 'full_withholding_itemized', label: 'Kept everything \u2014 with an itemized list I dispute', icon: '\uD83D\uDCCB', tip: 'Your landlord kept the entire deposit and provided an itemized list of deductions, but you believe the items are wrong, inflated, or not your responsibility.' },
  { id: 'partial_return_no_itemization', label: 'Returned part \u2014 no written breakdown', icon: '\uD83D\uDCC4', tip: 'Your landlord returned part of your deposit but didn\u2019t provide a written breakdown of what they kept or why. Example: you got $800 back from a $1,400 deposit with no explanation.' },
  { id: 'partial_return_itemized', label: 'Returned part \u2014 with an itemized list I dispute', icon: '\u2696\uFE0F', tip: 'Your landlord returned part of your deposit and listed deductions for the rest, but you believe the items are wrong or inflated. Example: they charged $600 for repairs you don\u2019t think were your responsibility.' },
  { id: 'deposit_applied_to_rent', label: 'Applied my deposit to last month\u2019s rent', icon: '\uD83C\uDFE0', tip: 'Your landlord used your security deposit to cover your final month\u2019s rent without your agreement. Security deposits and rent are legally separate.' },
];

// Project I — the second axis: WHY the deductions are wrong, plus landlord
// procedural violations. Multi-select, optional. The deduction-specific
// grounds only render for scenarios where deductions were actually claimed;
// the procedural violations render for every scenario (see DISPUTE gating in
// the card below), so a contradictory combination can never be submitted.
const DEDUCTION_DISPUTE_GROUNDS: CircumstanceItem[] = [
  { id: 'wear_and_tear', label: 'Charged for normal wear and tear', tip: 'Your landlord is deducting for things that naturally age or wear with normal use. Example: carpet that faded over 3 years, small wall scuffs, or minor paint wear.' },
  { id: 'preexisting_damage', label: 'Charged for pre-existing damage', tip: 'Your landlord is charging for damage that existed before you moved in. Example: a cracked tile or stained ceiling that was already there when you arrived.' },
  { id: 'inflated_charges', label: 'Inflated repair charges', tip: 'The amounts your landlord is claiming seem far higher than the repairs would reasonably cost. Example: charging $900 to repaint one bedroom.' },
  { id: 'late_notice', label: 'Their notice came after the legal deadline', tip: 'Your landlord sent their deduction notice after your state\u2019s legal deadline had already passed. Example: your state requires notice within 30 days and they sent it on day 45.' },
];
const PROCEDURAL_DISPUTE_GROUNDS: CircumstanceItem[] = [
  { id: 'escrow_violation', label: 'Deposit not properly held', tip: 'Your landlord may have failed to hold your deposit in a separate account as required by law. Example: no disclosure of where it was held, or it was mixed with operating funds.' },
  { id: 'no_receipt', label: 'Never got a deposit receipt', tip: 'Your landlord never gave you a written receipt for your security deposit. Some states require one \u2014 where they do, the failure is its own violation your letter can cite.' },
  { id: 'no_checklist', label: 'Never got a move-in checklist', tip: 'Your landlord never provided a move-in inventory or condition checklist. Some states and cities require one \u2014 and without it, your landlord has no baseline to justify condition-based deductions.' },
];

// Scenarios in which the landlord claimed deductions (deduction-specific
// dispute grounds only make sense for these).
const DEDUCTION_SCENARIOS = [
  'full_withholding_no_itemization',
  'full_withholding_itemized',
  'partial_return_no_itemization',
  'partial_return_itemized',
];
// Scenarios where part of the deposit came back (the amount-returned
// follow-up is required for these).
const PARTIAL_SCENARIOS = ['partial_return_no_itemization', 'partial_return_itemized'];

// Trimmed for Project I: "deposit applied to last month's rent" moved into the
// scenario picker, and "some damage occurred but I dispute the amount" is now
// captured by the condition question + the inflated-charges dispute ground.
const SPECIAL_CIRCUMSTANCES: CircumstanceItem[] = [
  { id: 'multiple_tenants_on_lease', label: 'I had roommates on the lease', tip: 'Other tenants were also listed on the lease. This affects how the letter is addressed and how the deposit demand is structured.' },
  { id: 'tenant_broke_lease_early', label: 'I broke the lease early', tip: 'You moved out before your lease end date. Your letter will reference your landlord\u2019s legal duty to re-rent and mitigate losses rather than simply keep your deposit.' },
  { id: 'non_refundable_cleaning_fee', label: 'I paid a non-refundable cleaning fee', tip: 'You paid a fee at move-in that was labeled non-refundable. Depending on your state, this may still be legally recoverable.' },
];

type ViewState = 'form' | 'review' | 'loading' | 'result' | 'missing_info' | 'out_of_scope' | 'error' | 'blocked';
type Tier = 'strong' | 'moderate' | 'weak';

// ---- Wizard steps (Aug 2026 form restructure) ----
// Presentation-only: the single formData state object persists across every
// step, runSubmit's gate order (blocks -> coverage -> offsets -> warnings ->
// strength modal -> review -> checkout) is untouched, and the payload build
// is byte-identical to the single-page form. The wizard's NEW user-facing
// strings live here; full string extraction of the existing form copy is
// deliberately deferred until the Spanish UI shell is greenlit.
const WIZARD_STEPS = [
  { id: 'about-you', title: 'About you' },
  { id: 'rental', title: 'The rental property' },
  { id: 'deposit-dates', title: 'Deposit & dates' },
  { id: 'landlord', title: 'Your landlord' },
  { id: 'what-happened', title: 'What happened' },
  { id: 'case-facts', title: 'The honest facts' },
] as const;
const WIZARD_LAST_STEP = WIZARD_STEPS.length - 1;

// Owning step for every validated field key (blocks AND warnings). Used to
// (a) scope the per-step Continue gate and (b) jump to the earliest offending
// step if the final full-chain validation in runSubmit finds a block.
const FIELD_STEP: { [key: string]: number } = {
  tenantName: 0, email: 0, tenantAddress: 0, tenantZip: 0,
  state: 1, city: 1, rentalPropertyAddress: 1, rentalZip: 1,
  isRentStabilized: 1, leaseStartDate: 1,
  depositAmount: 2, vacatedDate: 2, depositPaidDate: 2,
  forwardingAddressDate: 2, buildingUnitCount: 2, leaseType: 2,
  landlordName: 3, landlordAddress: 3, landlordZip: 3, propertySold: 3,
  newOwnerName: 3, newOwnerAddress: 3, identicalParties: 3,
  scenario: 4, amountReturned: 4,
  unitCondition: 5, damageEstimate: 5, unpaidRent: 5, unpaidRentAmount: 5,
  properNotice: 5, noticeGiven: 5, conditionDocumentation: 5, situation: 5,
};

// Review-screen Edit anchors -> owning step (anchors unchanged from batch 7).
const ANCHOR_STEP: { [anchor: string]: number } = {
  'f-tenantName': 0,
  'f-rentalPropertyAddress': 1,
  'f-depositAmount': 2,
  'f-landlordName': 3,
  'f-scenario': 4,
};

interface AddressParts {
  street: string;
  unit: string;
  city: string;
  state: string;
  zip: string;
}

const emptyAddress: AddressParts = { street: '', unit: '', city: '', state: '', zip: '' };

// Compose 5 sub-fields into a single USPS-style string for the API.
function composeAddress(a: AddressParts): string {
  const line1 = [a.street, a.unit].filter(Boolean).join(', ');
  const abbr = a.state ? (STATE_ABBR[a.state] || a.state) : '';
  const cityStateZip = [a.city, [abbr, a.zip].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');
  return [line1, cityStateZip].filter(Boolean).join(', ').trim();
}

// --- Validation helpers (pure) ---

function parseDeposit(raw: string): {
  ok: boolean;
  value: number;
  reason: 'blank' | 'invalid' | 'nonpositive' | '';
} {
  const cleaned = (raw || '').replace(/[$,\s]/g, '');
  if (cleaned === '') return { ok: false, value: 0, reason: 'blank' };
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return { ok: false, value: 0, reason: 'invalid' };
  const num = parseFloat(cleaned);
  if (!(num > 0)) return { ok: false, value: 0, reason: 'nonpositive' };
  return { ok: true, value: num, reason: '' };
}

// Lenient money parse for the case-check amounts (returns 0 when unparseable).
function parseMoney(raw: string): number {
  const cleaned = (raw || '').replace(/[$,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return 0;
  const n = parseFloat(cleaned);
  return n > 0 ? n : 0;
}

function parseLocalDate(s: string): Date | null {
  if (!s) return null;
  const parts = s.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [y, m, d] = parts;
  const dt = new Date(y, m - 1, d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function startOfToday(): Date {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

// Small hover/tap tooltip. Uses a non-interactive marker so it can live inside
// chip <button>s without nesting interactive elements. Shows on hover (desktop)
// and on focus (keyboard / tap where supported).
const InfoTip = ({ text }: { text: string }) => (
  <span className="group/tip relative inline-flex align-middle">
    <span
      tabIndex={0}
      role="img"
      aria-label={text}
      className="ml-1 inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-slate-300 text-[10px] font-semibold leading-none text-slate-500 outline-none focus:ring-2 focus:ring-[#B45309]/40"
    >
      i
    </span>
    <span
      className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-60 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-left text-xs font-normal leading-snug text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100"
    >
      {text}
    </span>
  </span>
);

export default function SecurityDepositForm() {
  const [viewState, setViewState] = useState<ViewState>('form');
  // Wizard position (Aug 2026 restructure). Survives view changes so a
  // customer returning from the review screen or an error lands where they
  // left off.
  const [currentStep, setCurrentStep] = useState(0);
  // Why the 'blocked' screen is showing. 'offsets' = the Project I scope block
  // (admitted offsets >= deposit); 'coverage' = the C0 Evanston coverage block.
  // Set immediately before every setViewState('blocked') so the render branch
  // can never show stale copy.
  const [blockReason, setBlockReason] = useState<'offsets' | 'coverage'>('offsets');
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // City dropdown selection vs. typed "other" value are tracked separately.
  const [citySelect, setCitySelect] = useState('');
  const [otherCity, setOtherCity] = useState('');

  // Split address state for the three address sections.
  const [tenantAddr, setTenantAddr] = useState<AddressParts>({ ...emptyAddress });
  const [landlordAddr, setLandlordAddr] = useState<AddressParts>({ ...emptyAddress });
  const [rentalAddr, setRentalAddr] = useState<AddressParts>({ ...emptyAddress });

  const [formData, setFormData] = useState({
    state: '',
    city: '',
    tenantName: '',
    email: '',
    tenantAddress: '',
    landlordName: '',
    landlordAddress: '',
    rentalPropertyAddress: '',
    depositAmount: '',
    vacatedDate: '',
    forwardingAddressDate: '',
    situation: '',
    // ---- Project I: authoritative scenario + dispute grounds ----
    scenario: '',              // single-select; SCENARIOS ids
    disputes: [] as string[],  // multi-select; dispute-ground ids
    amountReturned: '',        // numeric string; required for PARTIAL_SCENARIOS
    depositPaidDate: '',       // optional yyyy-mm-dd
    specialCircumstances: [] as string[],
    // Was the property sold during the tenancy? Mandatory yes/no (asked in the
    // Landlord card). 'yes' reveals the optional current-owner fields below and
    // drives the letter's successor-owner handling in systemPrompt.ts.
    propertySold: '',          // 'yes' | 'no'
    // Optional — only shown/used when propertySold === 'yes'. Free text (no
    // address sub-fields) since this is secondary context the tenant often
    // won't have in full; the letter's "unknown landlord address" fallback
    // pattern covers a blank address.
    newOwnerName: '',
    newOwnerAddress: '',
    leaseDesignation: '',
    isRentStabilized: '',
    leaseStartDate: '',
    buildingUnitCount: '',
    gaveWrittenNotice: '', // derived from properNotice on submit (Alaska 14-vs-30-day)
    leaseType: '',
    // ---- Case facts (Project I: ALL required; reach both the tier AND the letter) ----
    unitCondition: '',         // 'good' | 'minor' | 'damage'
    damageEstimate: '',        // numeric string, REQUIRED when unitCondition === 'damage'
    unpaidRent: '',            // 'no' | 'yes'
    unpaidRentAmount: '',      // numeric string, REQUIRED when unpaidRent === 'yes'
    properNotice: '',          // 'yes' | 'not_required' | 'no'
    noticeGiven: '',           // 'partial' | 'none' (REQUIRED when properNotice === 'no')
    conditionDocumentation: '', // 'yes' | 'partial' | 'no'
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [warnings, setWarnings] = useState<{ [key: string]: string }>({});
  const [warningsShown, setWarningsShown] = useState(false);

  // Case-strength confirmation modal (Project I). Fires at submit for EVERY
  // tier; the weak tier additionally requires the acknowledgment checkbox.
  const [showStrengthModal, setShowStrengthModal] = useState(false);
  const [weakChecked, setWeakChecked] = useState(false);
  const [strengthAcknowledged, setStrengthAcknowledged] = useState(false);

  // Backlog #7 review screen: where to scroll after "Edit" returns to the
  // form. null = no pending scroll; '' = top of page; 'f-…' = section anchor.
  // The scroll happens in the effect below, which React guarantees runs AFTER
  // the form view has committed — scrolling directly in the click handler (or
  // one requestAnimationFrame later) raced the re-render and intermittently
  // no-opped because the anchor element didn't exist yet (caught on the
  // Aug 9 2026 production verification pass; staging had won the same race).
  const [pendingEditAnchor, setPendingEditAnchor] = useState<string | null>(null);

  useEffect(() => {
    if (viewState !== 'form' || pendingEditAnchor === null) return;
    if (pendingEditAnchor === '') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    } else {
      document.getElementById(pendingEditAnchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setPendingEditAnchor(null);
  }, [viewState, pendingEditAnchor]);

  const todayISO = new Date().toISOString().slice(0, 10);

  const effectiveCity = citySelect === OTHER_CITY ? otherCity.trim() : citySelect;

  const baseCities = formData.state ? (CITIES_BY_STATE[formData.state] || []) : [];
  const cityOptions = formData.state ? [...baseCities, OTHER_CITY] : [];

  const showLeaseDesignation =
    ['Arizona', 'Washington', 'Oregon'].includes(formData.state) &&
    formData.specialCircumstances.includes('non_refundable_cleaning_fee');
  const showRentStabilized = effectiveCity === 'New York City';
  const showLeaseStartDate = showRentStabilized && formData.isRentStabilized === 'yes';
  const showUnitCount = UNIT_COUNT_STATES.includes(formData.state);
  const showLeaseType = LEASE_TYPE_STATES.includes(formData.state);
  const isAlaska = formData.state === 'Alaska';

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      // If they say the property wasn't sold, drop any current-owner info so a
      // stale value from a toggled-off "yes" can't reach the payload.
      if (field === 'propertySold' && value !== 'yes') {
        next.newOwnerName = '';
        next.newOwnerAddress = '';
      }
      return next;
    });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    if (warnings[field]) setWarnings(prev => ({ ...prev, [field]: '' }));
  };

  // Case-fact changes can reset dependent follow-ups, and always reset the
  // strength acknowledgment so the customer re-sees the modal if they revise.
  const handleCaseChange = (field: string, value: string) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'properNotice' && value !== 'no') next.noticeGiven = '';
      if (field === 'unpaidRent' && value !== 'yes') next.unpaidRentAmount = '';
      if (field === 'unitCondition' && value !== 'damage') next.damageEstimate = '';
      return next;
    });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    setStrengthAcknowledged(false);
    setWeakChecked(false);
  };

  // Scenario is single-select and feeds the tier (itemized-dispute scenarios
  // are a moderate trigger), so changing it also resets the acknowledgment.
  // Leaving a partial-return scenario clears the amount-returned follow-up,
  // and deduction-specific dispute grounds are pruned when the new scenario
  // claims no deductions (procedural grounds always survive).
  const handleScenarioChange = (id: string) => {
    setFormData(prev => {
      const next = { ...prev, scenario: id };
      if (!PARTIAL_SCENARIOS.includes(id)) next.amountReturned = '';
      if (!DEDUCTION_SCENARIOS.includes(id)) {
        const deductionIds = DEDUCTION_DISPUTE_GROUNDS.map(g => g.id);
        next.disputes = prev.disputes.filter(d => !deductionIds.includes(d));
      }
      return next;
    });
    if (errors.scenario) setErrors(prev => ({ ...prev, scenario: '' }));
    if (errors.amountReturned) setErrors(prev => ({ ...prev, amountReturned: '' }));
    setStrengthAcknowledged(false);
    setWeakChecked(false);
  };

  const toggleDispute = (id: string) => {
    setFormData(prev => ({
      ...prev,
      disputes: prev.disputes.includes(id)
        ? prev.disputes.filter(d => d !== id)
        : [...prev.disputes, id],
    }));
  };

  const handleStateChange = (value: string) => {
    setCitySelect('');
    setOtherCity('');
    setFormData(prev => ({ ...prev, state: value, city: '' }));
    if (errors.state) setErrors(prev => ({ ...prev, state: '' }));
    if (errors.city) setErrors(prev => ({ ...prev, city: '' }));
  };

  const handleCitySelect = (value: string) => {
    setCitySelect(value);
    if (value !== OTHER_CITY) {
      setOtherCity('');
      setFormData(prev => ({ ...prev, city: value }));
    } else {
      setFormData(prev => ({ ...prev, city: '' }));
    }
    if (errors.city) setErrors(prev => ({ ...prev, city: '' }));
  };

  const handleOtherCity = (value: string) => {
    setOtherCity(value);
    setFormData(prev => ({ ...prev, city: value.trim() }));
    if (errors.city) setErrors(prev => ({ ...prev, city: '' }));
  };

  const updateAddr = (
    which: 'tenant' | 'landlord' | 'rental',
    field: keyof AddressParts,
    value: string
  ) => {
    if (which === 'tenant') setTenantAddr(p => ({ ...p, [field]: value }));
    else if (which === 'landlord') setLandlordAddr(p => ({ ...p, [field]: value }));
    else setRentalAddr(p => ({ ...p, [field]: value }));
    if (which === 'rental') {
      if (errors.rentalPropertyAddress) setErrors(prev => ({ ...prev, rentalPropertyAddress: '' }));
      if (warnings.rentalZip) setWarnings(prev => ({ ...prev, rentalZip: '' }));
    } else if (which === 'tenant') {
      if (errors.tenantAddress) setErrors(prev => ({ ...prev, tenantAddress: '' }));
      if (warnings.tenantZip) setWarnings(prev => ({ ...prev, tenantZip: '' }));
    } else {
      if (warnings.landlordAddress || warnings.landlordZip || warnings.identicalParties) {
        setWarnings(prev => ({ ...prev, landlordAddress: '', landlordZip: '', identicalParties: '' }));
      }
    }
  };

  const toggleSpecialCircumstance = (id: string) => {
    setFormData(prev => ({
      ...prev,
      specialCircumstances: prev.specialCircumstances.includes(id)
        ? prev.specialCircumstances.filter(s => s !== id)
        : [...prev.specialCircumstances, id]
    }));
  };

  // DOM order of fields, used to scroll to the first issue on submit.
  const FIELD_ORDER = [
    'state', 'city', 'tenantName', 'email', 'rentalPropertyAddress', 'isRentStabilized', 'depositAmount', 'vacatedDate',
    'depositPaidDate', 'forwardingAddressDate', 'buildingUnitCount', 'leaseType', 'tenantAddress',
    'landlordName', 'landlordAddress', 'propertySold', 'scenario', 'amountReturned',
    'unitCondition', 'damageEstimate', 'unpaidRent', 'unpaidRentAmount',
    'properNotice', 'noticeGiven', 'conditionDocumentation', 'situation',
    'newOwnerName', 'newOwnerAddress',
    'tenantZip', 'landlordZip', 'rentalZip', 'identicalParties',
  ];
  const SCROLL_ALIAS: { [k: string]: string } = {
    tenantZip: 'tenantAddress',
    landlordZip: 'landlordAddress',
    rentalZip: 'rentalPropertyAddress',
    identicalParties: 'landlordAddress',
    damageEstimate: 'unitCondition',
    unpaidRentAmount: 'unpaidRent',
    noticeGiven: 'properNotice',
    amountReturned: 'scenario',
  };

  const scrollToFirstIssue = (keys: string[]) => {
    const first = FIELD_ORDER.find(k => keys.includes(k));
    if (!first || typeof document === 'undefined') return;
    const el = document.getElementById('f-' + (SCROLL_ALIAS[first] || first));
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const focusable = el.querySelector('input, select, textarea') as HTMLElement | null;
    focusable?.focus?.();
  };

  const SITUATION_MAX = 4000;

  // Derive the legacy Alaska notice value from the case-check answer.
  const deriveGaveWrittenNotice = (): string => {
    if (formData.properNotice === 'yes') return 'yes';
    if (formData.properNotice) return 'no'; // 'not_required' or 'no' -> not "proper notice given"
    return '';
  };

  // Case-strength tier (Project I). Computed from the SAME inputs the letter
  // reads — the scenario plus the four required case facts — so the assessment
  // and the letter can never tell two different stories. Returns null until
  // everything it reads is answered. Must stay consistent with
  // deriveCaseStrength() in lib/generateLetterCore.ts.
  const ITEMIZED_DISPUTE_SCENARIOS = ['full_withholding_itemized', 'partial_return_itemized'];

  const computeTier = (): Tier | null => {
    const f = formData;
    const answered =
      f.scenario &&
      f.unitCondition &&
      f.unpaidRent &&
      f.properNotice &&
      (f.properNotice !== 'no' || f.noticeGiven) &&
      f.conditionDocumentation;
    if (!answered) return null;

    const depositVal = parseDeposit(f.depositAmount).value;
    const unpaidVal = parseMoney(f.unpaidRentAmount);
    const damageVal = parseMoney(f.damageEstimate);

    // Weak: offsets meet or exceed the deposit, or the tenant abandoned.
    // (Combined offsets >= deposit are BLOCKED before payment in runSubmit;
    // these branches remain for classification consistency with the server.)
    if (f.noticeGiven === 'none') return 'weak';
    if (f.unpaidRent === 'yes' && depositVal > 0 && unpaidVal >= depositVal) return 'weak';
    if (f.unitCondition === 'damage' && depositVal > 0 && damageVal >= depositVal) return 'weak';

    // Moderate: some valid offset or weakened standing, but not exceeding deposit.
    const moderate =
      ITEMIZED_DISPUTE_SCENARIOS.includes(f.scenario) ||
      f.unitCondition === 'minor' ||
      f.unitCondition === 'damage' ||
      f.unpaidRent === 'yes' ||
      f.properNotice === 'no' ||
      f.conditionDocumentation === 'no';
    if (moderate) return 'moderate';

    return 'strong';
  };

  // Human-readable reasons that pushed a case into the weak tier (for the modal).
  const weakReasons = (): string[] => {
    const f = formData;
    const out: string[] = [];
    const depositVal = parseDeposit(f.depositAmount).value;
    const unpaidVal = parseMoney(f.unpaidRentAmount);
    const damageVal = parseMoney(f.damageEstimate);
    if (f.noticeGiven === 'none') {
      out.push('You moved out without giving your landlord any notice, which can expose you to lost-rent claims for the remaining lease term.');
    }
    if (f.unpaidRent === 'yes' && depositVal > 0 && unpaidVal >= depositVal) {
      out.push('The unpaid rent or fees you owe ($' + unpaidVal.toLocaleString() + ') meet or exceed your deposit, which your landlord can legitimately offset.');
    }
    if (f.unitCondition === 'damage' && depositVal > 0 && damageVal >= depositVal) {
      out.push('The damage you estimated ($' + damageVal.toLocaleString() + ') meets or exceeds your deposit, which your landlord may be able to deduct.');
    }
    if (out.length === 0) {
      out.push('Based on your answers, your landlord may have valid offsets that meet or exceed your deposit.');
    }
    return out;
  };

  // Pure validation: builds the block/warn maps WITHOUT touching state.
  // Shared by (a) the state-setting validateForm wrapper that runSubmit calls
  // (behavior unchanged) and (b) the per-step Continue gate, so the two
  // layers can never drift.
  const computeValidation = (composed: {
    city: string;
    rentalPropertyAddress: string;
    tenantAddress: string;
    landlordAddress: string;
  }) => {
    const b: { [key: string]: string } = {};
    const w: { [key: string]: string } = {};

    // Presence (BLOCK)
    if (!formData.state) b.state = 'State is required';
    if (!composed.city) b.city = 'City is required';
    if (!formData.tenantName) b.tenantName = 'Your name is required';

    // Email (BLOCK) — required + basic format. This is the address we email the
    // finished letter to. EMAIL_RE is mirrored byte-for-byte server-side in
    // create-checkout-session/route.ts so the two layers can't drift.
    if (!formData.email.trim()) {
      b.email = 'Your email address is required \u2014 we send your letter here.';
    } else if (!EMAIL_RE.test(formData.email.trim())) {
      b.email = 'Enter a valid email address (for example, you@example.com).';
    }

    if (!formData.landlordName) b.landlordName = 'Landlord name is required';
    // Mandatory yes/no — drives successor-owner handling.
    if (formData.propertySold !== 'yes' && formData.propertySold !== 'no') {
      b.propertySold = 'Let us know whether the property was sold while you lived there.';
    }
    if (!rentalAddr.street) b.rentalPropertyAddress = 'Rental property street address is required';
    if (!formData.vacatedDate) b.vacatedDate = 'Move-out date is required';

    // Tenant mailing address (BLOCK) — the return address the letter uses.
    if (!(tenantAddr.street && tenantAddr.city && tenantAddr.state && tenantAddr.zip)) {
      b.tenantAddress =
        'Enter your full mailing address (street, city, state, ZIP) \u2014 this is the return address the letter tells your landlord to send your deposit to.';
    }

    // Deposit (BLOCK / WARN).
    const dep = parseDeposit(formData.depositAmount);
    if (!dep.ok) {
      if (dep.reason === 'blank') b.depositAmount = 'Enter the security deposit amount you paid.';
      else if (dep.reason === 'nonpositive') b.depositAmount = 'The deposit must be greater than $0.';
      else b.depositAmount = 'Enter a dollar amount using numbers only (for example, 2400 or 2400.00).';
    } else if (dep.value < 100) {
      w.depositAmount = `That deposit ($${dep.value.toLocaleString()}) is lower than usual \u2014 double-check the amount before continuing.`;
    } else if (dep.value > 100000) {
      w.depositAmount = `That deposit ($${dep.value.toLocaleString()}) is unusually high \u2014 please confirm it\u2019s correct.`;
    }

    // Move-out date (BLOCK future / WARN if very old).
    const today = startOfToday();
    const vac = parseLocalDate(formData.vacatedDate);
    if (vac) {
      if (vac.getTime() > today.getTime()) {
        b.vacatedDate =
          'Your move-out date is in the future. We can only demand a deposit back after you have moved out.';
      } else if (daysBetween(today, vac) > 730) {
        w.vacatedDate =
          'This move-out was over two years ago. Deposit claims can expire \u2014 you may want to confirm your state\u2019s deadline before sending.';
      }
    }

    // Forwarding-address date (WARN only), when that field is in play.
    if (FORWARDING_ADDRESS_STATES.includes(formData.state) && formData.forwardingAddressDate) {
      const fwd = parseLocalDate(formData.forwardingAddressDate);
      if (fwd) {
        if (fwd.getTime() > today.getTime()) {
          w.forwardingAddressDate = 'The forwarding-address date is in the future \u2014 please double-check it.';
        } else if (vac && daysBetween(vac, fwd) > 60) {
          w.forwardingAddressDate =
            'The forwarding-address date is more than 60 days before your move-out \u2014 please confirm it\u2019s correct.';
        }
      }
    }

    // Conditional drivers that change the deadline must be answered when shown (BLOCK).
    if (showLeaseType && !formData.leaseType) {
      b.leaseType = `Select your tenancy type \u2014 it determines the return deadline in ${formData.state}.`;
    }
    // PV-11a: rent-stabilized status is a conditional driver too — it decides
    // WHICH New York deposit law the letter argues (GOL § 7-108 vs. § 7-107 /
    // DHCR). Skipping it used to silently produce a § 7-108 letter for a
    // possibly-stabilized tenant, so an explicit answer (including "I'm not
    // sure") is now required whenever the question is shown (BLOCK).
    if (showRentStabilized && !formData.isRentStabilized) {
      b.isRentStabilized =
        'Let us know whether the apartment is rent-stabilized \u2014 it determines which New York deposit law your letter argues. Choose \u201cI\u2019m not sure\u201d if you don\u2019t know.';
    }

    // --- Project I: authoritative scenario (BLOCK) ---
    if (!formData.scenario) {
      b.scenario = 'Select what your landlord did with your deposit \u2014 it determines the kind of letter we write.';
    }
    // Partial-return scenarios must state the amount returned, and it must be
    // below the deposit (otherwise nothing was withheld to demand).
    if (PARTIAL_SCENARIOS.includes(formData.scenario)) {
      const returned = parseMoney(formData.amountReturned);
      if (returned <= 0) {
        b.amountReturned = 'Enter how much of your deposit was returned \u2014 your letter demands the exact withheld remainder.';
      } else if (dep.ok && returned >= dep.value) {
        b.amountReturned = 'The amount returned must be less than your deposit \u2014 otherwise nothing was withheld. Double-check both amounts.';
      }
    }

    // --- Project I: case facts (ALL required — they shape your letter) ---
    if (!formData.unitCondition) {
      b.unitCondition = 'Select the condition you left the unit in \u2014 your letter is calibrated to this.';
    }
    if (formData.unitCondition === 'damage' && parseMoney(formData.damageEstimate) <= 0) {
      b.damageEstimate = 'Enter your best estimate of the repair cost \u2014 your letter concedes this amount and demands the rest, which makes it far more credible.';
    }
    if (!formData.unpaidRent) {
      b.unpaidRent = 'Let us know whether you owe any unpaid rent or fees.';
    }
    if (formData.unpaidRent === 'yes' && parseMoney(formData.unpaidRentAmount) <= 0) {
      b.unpaidRentAmount = 'Enter approximately how much you owe \u2014 your letter accounts for it so your landlord can\u2019t use it to dismiss your demand.';
    }
    if (!formData.properNotice) {
      b.properNotice = isAlaska
        ? 'Let us know whether you gave proper written notice \u2014 it changes the return deadline in Alaska.'
        : 'Let us know whether you gave proper written notice before moving out.';
    }
    if (formData.properNotice === 'no' && !formData.noticeGiven) {
      b.noticeGiven = 'Let us know whether you gave some notice or none at all.';
    }
    if (!formData.conditionDocumentation) {
      b.conditionDocumentation = 'Let us know what documentation you have \u2014 it changes which arguments your letter leans on.';
    }

    // Deposit-paid date (WARN only) — optional field; sanity-check if provided.
    if (formData.depositPaidDate) {
      const paid = parseLocalDate(formData.depositPaidDate);
      if (paid) {
        if (paid.getTime() > today.getTime()) {
          w.depositPaidDate = 'The date you paid your deposit is in the future \u2014 please double-check it.';
        } else if (vac && paid.getTime() > vac.getTime()) {
          w.depositPaidDate = 'The date you paid your deposit is after your move-out date \u2014 please double-check both dates.';
        }
      }
    }

    // Unit count when shown (BLOCK) — PV-11b: a typed number OR the "I'm not
    // sure" checkbox is now required (a silent blank used to pass and reach
    // the same downstream handling as "unsure," but a typed answer produces a
    // stronger letter, so we make the choice explicit).
    if (showUnitCount) {
      if (formData.buildingUnitCount === '') {
        b.buildingUnitCount = 'Enter the number of units in the building, or check \u201cI\u2019m not sure\u201d \u2014 it affects which law your letter cites.';
      } else if (
        formData.buildingUnitCount !== 'unknown' &&
        (!/^\d+$/.test(formData.buildingUnitCount) || parseInt(formData.buildingUnitCount, 10) < 1)
      ) {
        b.buildingUnitCount = 'Enter the number of units as a whole number (1 or more), or check \u201cI\u2019m not sure.\u201d';
      }
    }

    // Situation length (BLOCK) — Project I: the description is now OPTIONAL
    // supporting detail (the scenario + case facts are the authoritative
    // record), so there is no minimum; only the ceiling remains.
    if (formData.situation && formData.situation.length > SITUATION_MAX) {
      b.situation = `Please shorten your description to ${SITUATION_MAX.toLocaleString()} characters or fewer.`;
    }

    // Landlord address blank (WARN, neutral).
    if (!composed.landlordAddress) {
      w.landlordAddress =
        'No landlord address entered. That\u2019s fine if you\u2019re delivering by email or in person, but it won\u2019t appear on the printed letter.';
    }

    // ZIP format (WARN) — only when something was entered.
    const zipOk = (z: string) => /^\d{5}$/.test(z);
    if (tenantAddr.zip && !zipOk(tenantAddr.zip)) w.tenantZip = 'Your ZIP code doesn\u2019t look like a 5-digit code \u2014 please double-check it.';
    if (landlordAddr.zip && !zipOk(landlordAddr.zip)) w.landlordZip = 'The landlord ZIP code doesn\u2019t look like a 5-digit code \u2014 please double-check it.';
    if (rentalAddr.zip && !zipOk(rentalAddr.zip)) w.rentalZip = 'The rental ZIP code doesn\u2019t look like a 5-digit code \u2014 please double-check it.';

    // Identical tenant & landlord (WARN) — likely a fill error.
    const sameName =
      !!formData.tenantName && !!formData.landlordName &&
      formData.tenantName.trim().toLowerCase() === formData.landlordName.trim().toLowerCase();
    const sameAddr =
      !!composed.tenantAddress && !!composed.landlordAddress &&
      composed.tenantAddress.trim().toLowerCase() === composed.landlordAddress.trim().toLowerCase();
    if (sameName && sameAddr) {
      w.identicalParties =
        'Your information and the landlord\u2019s information look identical \u2014 please double-check you didn\u2019t enter the same details twice.';
    }

    return { blocks: b, warns: w };
  };

  // State-setting wrapper — runSubmit's validation path is byte-identical to
  // the single-page form: full chain, all errors and warnings surfaced.
  const validateForm = (composed: {
    city: string;
    rentalPropertyAddress: string;
    tenantAddress: string;
    landlordAddress: string;
  }) => {
    const { blocks, warns } = computeValidation(composed);
    setErrors(blocks);
    setWarnings(warns);
    return { blocks, warns };
  };

  const runSubmit = async (opts?: { ackStrength?: boolean; fromReview?: boolean }) => {
    const composedTenant = composeAddress(tenantAddr);
    const composedLandlord = composeAddress(landlordAddr);
    const composedCity = effectiveCity;
    const composedRental = composeAddress({
      ...rentalAddr,
      city: composedCity,
      state: formData.state,
    });

    const { blocks, warns } = validateForm({
      city: composedCity,
      rentalPropertyAddress: composedRental,
      tenantAddress: composedTenant,
      landlordAddress: composedLandlord,
    });

    const blockKeys = Object.keys(blocks).filter(k => blocks[k]);
    const warnKeys = Object.keys(warns).filter(k => warns[k]);

    if (blockKeys.length > 0) {
      setWarningsShown(false);
      // Wizard: the offending field can live on an earlier step. Jump to the
      // earliest one, then scroll via the pendingEditAnchor effect (post-
      // commit, race-free — the same pattern as the review-screen Edit path).
      const earliest = Math.min(...blockKeys.map(k => FIELD_STEP[k] ?? WIZARD_LAST_STEP));
      if (earliest !== currentStep) {
        setCurrentStep(earliest);
        const first = FIELD_ORDER.find(k => blockKeys.includes(k));
        setPendingEditAnchor(first ? 'f-' + (SCROLL_ALIAS[first] || first) : '');
      } else {
        scrollToFirstIssue(blockKeys);
      }
      return;
    }

    // --- C0 (correction batch): Evanston coverage block. Evanston's overlay
    // data is unverified, so the letter path is blocked pre-payment with an
    // honest "we don't cover this city yet" screen. Mirrored server-side in
    // create-checkout-session. Runs before the offsets check — coverage is an
    // absolute gate, and its copy should win if both would fire.
    if (isUncoveredCity(formData.state, composedCity)) {
      setBlockReason('coverage');
      setViewState('blocked');
      return;
    }

    // --- Project I: pre-payment scope block. If the tenant's own admitted
    // offsets (damage estimate + unpaid rent/fees) meet or exceed the deposit,
    // there is nothing viable to demand — a paid letter would only come back
    // as SCOPE_LIMITATION. Soft-redirect BEFORE payment instead of charging.
    // Mirrored server-side in create-checkout-session so a bypassed client
    // can never pay for it. Runs after blocks so the amounts are valid.
    {
      const depositVal = parseDeposit(formData.depositAmount).value;
      const offsets =
        (formData.unitCondition === 'damage' ? parseMoney(formData.damageEstimate) : 0) +
        (formData.unpaidRent === 'yes' ? parseMoney(formData.unpaidRentAmount) : 0);
      if (depositVal > 0 && offsets >= depositVal) {
        setBlockReason('offsets');
        setViewState('blocked');
        return;
      }
    }

    if (warnKeys.length > 0 && !warningsShown) {
      setWarningsShown(true);
      // Don't scroll here — warnings are non-blocking, and the summary box
      // with the "click Generate again to proceed" instruction renders right
      // next to the submit button, where the customer already is. Scrolling
      // away from that box was the actual bug: it moved them up to the first
      // warned field and left them to find the continue-instruction on their
      // own. Genuine BLOCK errors (above) still scroll, since those need a fix.
      return;
    }

    // --- Project I: case-strength confirmation modal. Fires once for EVERY
    // tier — it explains what the assessed strength means and what to expect
    // from the letter. The weak tier additionally requires the checkbox.
    const tier = computeTier();
    if (!strengthAcknowledged && !opts?.ackStrength) {
      setWeakChecked(false);
      setShowStrengthModal(true);
      return;
    }

    // --- Pre-payment review screen (backlog item #7, July 6 2026; built
    // August 2026). Final gate before checkout: a factual recap of every
    // entered field so typos get caught BEFORE the $39. First pass through
    // here shows the review; the review screen's confirm button re-enters
    // runSubmit with fromReview, which re-runs the full validation chain
    // (cheap, and guarantees nothing changed) and proceeds to checkout.
    // Scope discipline per the backlog item: recap ONLY — no stats, no
    // outcome predictions; at most the plain "you're requesting $X" line.
    if (!opts?.fromReview) {
      setViewState('review');
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    const cleanedDeposit = parseDeposit(formData.depositAmount).value.toString();

    const payload = {
      ...formData,
      depositAmount: cleanedDeposit,
      amountReturned: PARTIAL_SCENARIOS.includes(formData.scenario)
        ? parseMoney(formData.amountReturned).toString()
        : '',
      city: composedCity,
      tenantAddress: composedTenant,
      landlordAddress: composedLandlord,
      rentalPropertyAddress: composedRental,
      // Derive the legacy Alaska notice flag from the case-fact answer.
      gaveWrittenNotice: deriveGaveWrittenNotice(),
      // Record the assessed tier (admin/analytics; the letter calibrates from
      // the raw case facts themselves, not this label).
      caseStrength: tier ?? '',
      // Project J v1: first/last-touch marketing attribution (admin/analytics
      // only — same rider pattern as caseStrength). Rides the payload wholesale
      // into form_payload; buildUserMessage() reads only named fields, so this
      // can never reach the prompt or the letter. undefined when storage was
      // unavailable, in which case JSON.stringify drops the key entirely.
      attribution: getAttribution(),
    };

    setViewState('loading');

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to create checkout session');

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to start checkout. Please try again.');
      setViewState('error');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSubmit();
  };

  // Continue from the case-strength modal (weak tier requires the checkbox,
  // enforced by the button's disabled state in the modal itself).
  const handleProceedFromModal = () => {
    setStrengthAcknowledged(true);
    setShowStrengthModal(false);
    runSubmit({ ackStrength: true });
  };

  // --- Pre-payment review screen handlers (backlog item #7). ---
  // Confirm: re-enter runSubmit with both bypass flags. The full validation
  // chain re-runs (fields are unchanged, so it passes) and proceeds to the
  // payload build + checkout fetch.
  const handleConfirmReview = () => {
    runSubmit({ ackStrength: true, fromReview: true });
  };
  // Back to the form — optionally scrolled to a specific section anchor.
  // strengthAcknowledged is deliberately RESET: if they edit case facts the
  // tier can change, and the strength modal should re-fire with the fresh
  // assessment rather than honoring a stale acknowledgment. The scroll itself
  // is handled by the pendingEditAnchor effect (post-commit, race-free).
  const handleEditFromReview = (anchorId?: string) => {
    setStrengthAcknowledged(false);
    // Wizard: land on the step that owns the edited section. Global back
    // (no anchor) returns to the final step, next to the Generate button.
    setCurrentStep(anchorId ? (ANCHOR_STEP[anchorId] ?? WIZARD_LAST_STEP) : WIZARD_LAST_STEP);
    setPendingEditAnchor(anchorId ?? '');
    setViewState('form');
  };

  // --- Wizard navigation (Aug 2026 restructure). ---
  const composeForValidation = () => ({
    city: effectiveCity,
    rentalPropertyAddress: composeAddress({
      ...rentalAddr,
      city: effectiveCity,
      state: formData.state,
    }),
    tenantAddress: composeAddress(tenantAddr),
    landlordAddress: composeAddress(landlordAddr),
  });

  // Continue: gate on THIS step's blocks only — later steps stay clean until
  // reached. Warnings keep their submit-time semantics (summary next to the
  // Generate button, click-again-to-proceed), exactly as before.
  const handleStepContinue = () => {
    const { blocks } = computeValidation(composeForValidation());
    const stepBlocks: { [key: string]: string } = {};
    for (const k of Object.keys(blocks)) {
      if (blocks[k] && (FIELD_STEP[k] ?? WIZARD_LAST_STEP) === currentStep) {
        stepBlocks[k] = blocks[k];
      }
    }
    setErrors(stepBlocks);
    const keys = Object.keys(stepBlocks);
    if (keys.length > 0) {
      scrollToFirstIssue(keys);
      return;
    }
    setCurrentStep(s => Math.min(s + 1, WIZARD_LAST_STEP));
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleStepBack = () => {
    setErrors({});
    setCurrentStep(s => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleStartOver = () => {
    setViewState('form');
    setGeneratedLetter('');
    setErrorMessage('');
  };

  // Fonts are provided globally by app/layout.tsx (July 11, 2026 hoist).
  // Kept as a variable so the eight `${fontVars} ...` templates below
  // didn't need to be individually rewritten in a 2,100-line file.
  const fontVars = '';
  const display = { fontFamily: 'var(--font-display)' };

  // ---------- Loading ----------
  if (viewState === 'loading') {
    return (
      <div className={`${fontVars} bg-[#FAFAF7] flex items-center justify-center px-4 py-24`}
        style={{ fontFamily: 'var(--font-body), system-ui, sans-serif' }}>
        <div className="max-w-md w-full rounded-2xl border border-[#E7E5E0] bg-white p-10 text-center shadow-sm">
          <div className="w-14 h-14 mx-auto mb-6 relative">
            <div className="absolute inset-0 border-4 border-[#E7E5E0] rounded-full" />
            <div className="absolute inset-0 border-4 border-[#B45309] border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-2xl font-medium tracking-tight text-slate-900 mb-2" style={display}>
            Redirecting to secure checkout…
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            You&apos;ll be taken to Stripe to complete your $39 payment. After payment, your
            letter is generated automatically.
          </p>
        </div>
      </div>
    );
  }

  // ---------- Pre-payment review (backlog item #7) ----------
  // Factual recap of every entered field, shown AFTER validation + the
  // strength modal and BEFORE checkout. Recap only — no stats, no outcome
  // predictions (the jab.today anti-pattern, ruled out when the item was
  // logged July 6, 2026). Blank optional fields render as "Not provided"
  // rather than disappearing, so a forgotten field is visible too.
  if (viewState === 'review') {
    const scenarioLabel =
      SCENARIOS.find(s => s.id === formData.scenario)?.label ?? formData.scenario;
    const allGrounds = [...DEDUCTION_DISPUTE_GROUNDS, ...PROCEDURAL_DISPUTE_GROUNDS];
    const disputeLabels = formData.disputes
      .map(id => allGrounds.find(g => g.id === id)?.label ?? id)
      .filter(Boolean);

    const depositVal = parseDeposit(formData.depositAmount).value;
    const returnedVal = PARTIAL_SCENARIOS.includes(formData.scenario)
      ? parseMoney(formData.amountReturned)
      : 0;
    // The demanded figure must MIRROR THE LETTER. systemPrompt.ts instructs a
    // NET demand: deposit minus admitted damage estimate minus admitted unpaid
    // rent/fees ("Never demand money the tenant's own answers concede they
    // owe") — verified against the prompt's calibration block, Aug 2026.
    // Showing the gross figure here while the letter demands the net one is
    // exactly the pre-payment surprise this screen exists to prevent. The
    // Project I scope block guarantees offsets < deposit by this point, so
    // the Math.max guard is belt-and-suspenders only.
    const admittedOffsets =
      (formData.unitCondition === 'damage' ? parseMoney(formData.damageEstimate) : 0) +
      (formData.unpaidRent === 'yes' ? parseMoney(formData.unpaidRentAmount) : 0);
    const requestedVal = Math.max(depositVal - returnedVal - admittedOffsets, 0);
    const money = (n: number) =>
      '$' + n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

    const NOT_PROVIDED = <span className="italic text-slate-400">Not provided</span>;
    // Local copy of the form's card style — the shared `cardClass` const is
    // declared further down (after this early-return branch), so referencing
    // it here would be a temporal-dead-zone crash. Keep the strings in sync.
    const reviewCard = 'rounded-2xl border border-[#E7E5E0] bg-white p-6 sm:p-7 space-y-6';
    const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
      <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4">
        <dt className="w-full shrink-0 text-sm text-slate-500 sm:w-56">{label}</dt>
        <dd className="text-sm font-medium text-slate-900">{value || NOT_PROVIDED}</dd>
      </div>
    );
    const Section = ({
      title,
      anchor,
      children,
    }: {
      title: string;
      anchor: string;
      children: React.ReactNode;
    }) => (
      <div className={reviewCard}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium tracking-tight text-slate-900" style={display}>
            {title}
          </h3>
          <button
            type="button"
            onClick={() => handleEditFromReview(anchor)}
            className="text-sm font-medium text-[#B45309] transition hover:text-[#92400E]"
          >
            Edit
          </button>
        </div>
        <dl className="divide-y divide-slate-100">{children}</dl>
      </div>
    );

    const yesNo = (v: string) => (v === 'yes' ? 'Yes' : v === 'no' ? 'No' : v);
    const conditionLabel =
      formData.unitCondition === 'good'
        ? 'Good — normal wear and tear only'
        : formData.unitCondition === 'minor'
        ? 'Minor issues'
        : formData.unitCondition === 'damage'
        ? 'Some damage'
        : '';
    const noticeLabel =
      formData.properNotice === 'yes'
        ? 'Yes — proper written notice given'
        : formData.properNotice === 'not_required'
        ? 'Notice was not required'
        : formData.properNotice === 'no'
        ? formData.noticeGiven === 'partial'
          ? 'No — some notice, but not as required'
          : 'No — no notice given'
        : '';
    const docsLabel =
      formData.conditionDocumentation === 'yes'
        ? 'Yes — photos/video or a checklist'
        : formData.conditionDocumentation === 'partial'
        ? 'Some documentation'
        : formData.conditionDocumentation === 'no'
        ? 'No documentation'
        : '';

    return (
      <div
        className={`${fontVars} bg-[#FAFAF7]`}
        style={{ fontFamily: 'var(--font-body), system-ui, sans-serif' }}
      >
        <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#B45309]">
            One last look
          </p>
          <h2
            className="mb-2 text-3xl font-medium tracking-tight text-slate-900"
            style={display}
          >
            Review your details
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-slate-600">
            Your letter is built from exactly what&apos;s below. Please check names, addresses,
            and amounts — this is the easiest moment to fix a typo, before payment.
          </p>

          <div className="space-y-5">
            <Section title="About you" anchor="f-tenantName">
              <Row label="Your name" value={formData.tenantName} />
              <Row label="Email (letter sent here)" value={formData.email} />
              <Row label="Your mailing address" value={composeAddress(tenantAddr)} />
            </Section>

            <Section title="Rental property" anchor="f-rentalPropertyAddress">
              <Row
                label="Property address"
                value={composeAddress({ ...rentalAddr, city: effectiveCity, state: formData.state })}
              />
              <Row label="State" value={formData.state} />
              <Row label="City" value={effectiveCity} />
              {showRentStabilized && (
                <Row label="Rent-stabilized (NYC)" value={yesNo(formData.isRentStabilized)} />
              )}
              {showLeaseStartDate && (
                <Row label="Lease start date" value={formData.leaseStartDate} />
              )}
              {showUnitCount && (
                <Row
                  label="Units in building"
                  value={formData.buildingUnitCount === 'unknown' ? 'Not sure' : formData.buildingUnitCount}
                />
              )}
              {showLeaseType && (
                <Row
                  label="Tenancy type"
                  value={
                    formData.leaseType === 'written_lease'
                      ? 'A written lease'
                      : formData.leaseType === 'tenancy_at_will'
                      ? 'Tenancy at will / month-to-month (no written lease)'
                      : formData.leaseType
                  }
                />
              )}
            </Section>

            <Section title="Landlord" anchor="f-landlordName">
              <Row label="Landlord name" value={formData.landlordName} />
              <Row label="Landlord address" value={composeAddress(landlordAddr)} />
              <Row label="Property sold while you lived there" value={yesNo(formData.propertySold)} />
              {formData.propertySold === 'yes' && (
                <>
                  <Row label="New owner name" value={formData.newOwnerName} />
                  <Row label="New owner address" value={formData.newOwnerAddress} />
                </>
              )}
            </Section>

            <Section title="Deposit & dates" anchor="f-depositAmount">
              <Row label="Security deposit" value={money(depositVal)} />
              {PARTIAL_SCENARIOS.includes(formData.scenario) && (
                <Row label="Amount returned to you" value={money(returnedVal)} />
              )}
              <Row label="Date deposit was paid" value={formData.depositPaidDate} />
              <Row label="Move-out date" value={formData.vacatedDate} />
              {FORWARDING_ADDRESS_STATES.includes(formData.state) && (
                <Row label="Forwarding address given on" value={formData.forwardingAddressDate} />
              )}
            </Section>

            <Section title="Your case" anchor="f-scenario">
              <Row label="What your landlord did" value={scenarioLabel} />
              {disputeLabels.length > 0 && (
                <Row
                  label="Why it's wrong"
                  value={
                    <ul className="list-disc space-y-0.5 pl-4">
                      {disputeLabels.map(l => (
                        <li key={l}>{l}</li>
                      ))}
                    </ul>
                  }
                />
              )}
              <Row label="Condition you left the unit in" value={conditionLabel} />
              {formData.unitCondition === 'damage' && (
                <Row label="Your repair-cost estimate" value={money(parseMoney(formData.damageEstimate))} />
              )}
              <Row label="Unpaid rent or fees" value={yesNo(formData.unpaidRent)} />
              {formData.unpaidRent === 'yes' && (
                <Row label="Approximate amount owed" value={money(parseMoney(formData.unpaidRentAmount))} />
              )}
              <Row label="Written notice before moving out" value={noticeLabel} />
              <Row label="Move-out condition documented" value={docsLabel} />
              <Row
                label="Additional details"
                value={
                  formData.situation ? (
                    <span className="whitespace-pre-wrap">{formData.situation}</span>
                  ) : (
                    ''
                  )
                }
              />
            </Section>
          </div>

          {/* The one permitted money line: a plain factual restatement,
              mirroring the letter's net-demand math from systemPrompt.ts. */}
          <div className="mt-6 rounded-2xl border border-[#E7E5E0] bg-white p-5 text-center">
            <p className="text-sm text-slate-600">
              Your letter will demand the return of{' '}
              <span className="font-semibold text-slate-900">{money(requestedVal)}</span>.
            </p>
            {admittedOffsets > 0 && (
              <p className="mt-1 text-xs text-slate-500">
                Your {money(depositVal)} deposit, minus the {money(admittedOffsets)} you told us may
                lawfully be deducted — conceding it makes your letter more credible.
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() => handleEditFromReview()}
              className="rounded-full border border-[#E7E5E0] bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              Go back and edit
            </button>
            <button
              type="button"
              onClick={handleConfirmReview}
              className="rounded-full bg-[#B45309] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#92400E]"
            >
              Looks correct — continue to payment ($39)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Result ----------
  if (viewState === 'result') {
    return (
      <div className={`${fontVars} bg-[#FAFAF7]`}
        style={{ fontFamily: 'var(--font-body), system-ui, sans-serif' }}>
        <div className="max-w-3xl mx-auto px-5 py-14 sm:px-8">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#B45309]">
              Your demand letter
            </p>
            <button onClick={handleStartOver}
              className="text-sm font-medium text-slate-600 underline transition hover:text-slate-900">
              Start a new letter
            </button>
          </div>

          <div className="rounded-xl border border-[#15803D]/30 bg-[#15803D]/[0.06] p-5 flex items-start gap-3">
            <div className="mt-0.5 text-[#15803D] text-xl">✓</div>
            <div>
              <h3 className="font-semibold text-slate-900">Your demand letter is ready</h3>
              <p className="text-sm text-slate-600">
                Review it below, then copy and send via certified mail.
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-[#E7E5E0] bg-white">
            <div className="flex items-center justify-between border-b border-[#E7E5E0] bg-slate-50/70 px-6 py-4">
              <h3 className="font-semibold text-slate-900">Your Demand Letter</h3>
              <button onClick={handleCopy}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                {copied ? '✓ Copied!' : 'Copy Letter'}
              </button>
            </div>
            <div className="p-8 whitespace-pre-wrap leading-relaxed text-slate-900" style={display}>
              {generatedLetter}
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-[#E7E5E0] bg-white p-6">
            <h3 className="font-semibold text-slate-900 mb-4" style={display}>Next steps</h3>
            <ol className="space-y-3 text-sm text-slate-700">
              {[
                ['1', 'Print and sign', 'the letter with blue or black ink.'],
                ['2', 'Send via USPS Certified Mail', 'with Return Receipt. Keep your tracking number.'],
                ['3', 'Wait for the deadline', 'stated in the letter. Most landlords respond once they realize you know the law.'],
                ['4', 'If no response', 'file in small claims court. This letter becomes key evidence.'],
              ].map(([n, bold, rest]) => (
                <li key={n} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-[#B45309] text-white rounded-full flex items-center justify-center font-semibold text-xs">
                    {n}
                  </span>
                  <div><strong>{bold}</strong> {rest}</div>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-6 text-center">
            <button onClick={handleStartOver}
              className="rounded-full border border-slate-300 px-6 py-3 text-slate-700 transition hover:bg-white">
              Generate Another Letter
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Missing info ----------
  if (viewState === 'missing_info') {
    return (
      <div className={`${fontVars} bg-[#FAFAF7] flex items-center justify-center px-4 py-24`}
        style={{ fontFamily: 'var(--font-body), system-ui, sans-serif' }}>
        <div className="max-w-md w-full rounded-2xl border border-[#E7E5E0] bg-white p-8 shadow-sm">
          <div className="text-[#B45309] text-3xl mb-4">⚠</div>
          <h2 className="text-2xl font-medium tracking-tight text-slate-900 mb-3" style={display}>
            More information needed
          </h2>
          <pre className="text-slate-700 text-sm whitespace-pre-wrap mb-6 font-sans leading-relaxed">{errorMessage}</pre>
          <button onClick={handleStartOver}
            className="w-full rounded-full bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800">
            Go back to form
          </button>
        </div>
      </div>
    );
  }

  // ---------- Out of scope ----------
  if (viewState === 'out_of_scope') {
    return (
      <div className={`${fontVars} bg-[#FAFAF7] flex items-center justify-center px-4 py-24`}
        style={{ fontFamily: 'var(--font-body), system-ui, sans-serif' }}>
        <div className="max-w-md w-full rounded-2xl border border-[#E7E5E0] bg-white p-8 shadow-sm">
          <div className="text-slate-500 text-3xl mb-4">ℹ</div>
          <h2 className="text-2xl font-medium tracking-tight text-slate-900 mb-3" style={display}>
            This isn&apos;t quite the right fit
          </h2>
          <pre className="text-slate-700 text-sm whitespace-pre-wrap mb-6 font-sans leading-relaxed">{errorMessage}</pre>
          <button onClick={handleStartOver}
            className="w-full rounded-full bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800">
            Go back to form
          </button>
        </div>
      </div>
    );
  }

  // ---------- Error ----------
  if (viewState === 'error') {
    return (
      <div className={`${fontVars} bg-[#FAFAF7] flex items-center justify-center px-4 py-24`}
        style={{ fontFamily: 'var(--font-body), system-ui, sans-serif' }}>
        <div className="max-w-md w-full rounded-2xl border border-[#E7E5E0] bg-white p-8 shadow-sm">
          <div className="text-red-600 text-3xl mb-4">✕</div>
          <h2 className="text-2xl font-medium tracking-tight text-slate-900 mb-3" style={display}>
            Something went wrong
          </h2>
          <p className="text-slate-700 mb-6 leading-relaxed">{errorMessage}</p>
          <button onClick={handleStartOver}
            className="w-full rounded-full bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800">
            Try again
          </button>
        </div>
      </div>
    );
  }

  // ---------- Blocked (two reasons share this screen; see blockReason) ----------
  // 'coverage' — C0 Evanston block: we don't cover the city yet, no charge.
  if (viewState === 'blocked' && blockReason === 'coverage') {
    return (
      <div className={`${fontVars} bg-[#FAFAF7] flex items-center justify-center px-4 py-24`}
        style={{ fontFamily: 'var(--font-body), system-ui, sans-serif' }}>
        <div className="max-w-lg w-full rounded-2xl border border-[#E7E5E0] bg-white p-8 shadow-sm">
          <div className="text-[#B45309] text-3xl mb-4">⚖️</div>
          <h2 className="text-2xl font-medium tracking-tight text-slate-900 mb-3" style={display}>
            We don&apos;t cover Evanston yet
          </h2>
          <p className="text-slate-700 text-sm leading-relaxed mb-4">
            Evanston has its own security deposit ordinance that applies <strong>instead of</strong> the
            standard Illinois rules, and we haven&apos;t finished verifying it against the ordinance text
            itself. Rather than generate a letter we can&apos;t fully stand behind, we don&apos;t offer
            Evanston letters yet. <strong>You have not been charged anything.</strong>
          </p>
          <div className="rounded-xl border border-[#E7E5E0] bg-slate-50/70 p-4 mb-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">What you can do instead</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex gap-2"><span className="text-[#B45309]">•</span>
                <span><strong>Look up Evanston&apos;s own rules.</strong> The City of Evanston publishes its
                Residential Landlord and Tenant Ordinance, and the city&apos;s housing office can point you
                to the deposit provisions that apply to your tenancy.</span></li>
              <li className="flex gap-2"><span className="text-[#B45309]">•</span>
                <span><strong>Contact local legal aid or a tenant organization.</strong> Free and low-cost
                help is available in the Chicago area for security deposit disputes.</span></li>
              <li className="flex gap-2"><span className="text-[#B45309]">•</span>
                <span><strong>Check back with us.</strong> Once our verification of the Evanston ordinance
                is complete, we&apos;ll open letters for Evanston tenants.</span></li>
            </ul>
          </div>
          <button onClick={handleStartOver}
            className="w-full rounded-full bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800">
            Go back to the form
          </button>
        </div>
      </div>
    );
  }

  // 'offsets' — Project I: admitted offsets >= deposit — no charge.
  if (viewState === 'blocked') {
    return (
      <div className={`${fontVars} bg-[#FAFAF7] flex items-center justify-center px-4 py-24`}
        style={{ fontFamily: 'var(--font-body), system-ui, sans-serif' }}>
        <div className="max-w-lg w-full rounded-2xl border border-[#E7E5E0] bg-white p-8 shadow-sm">
          <div className="text-[#B45309] text-3xl mb-4">⚖️</div>
          <h2 className="text-2xl font-medium tracking-tight text-slate-900 mb-3" style={display}>
            A demand letter can&apos;t help with this one
          </h2>
          <p className="text-slate-700 text-sm leading-relaxed mb-4">
            Based on your own answers, the damage you estimated and the unpaid rent or fees you owe
            add up to <strong>as much as or more than your deposit</strong>. Your landlord can lawfully
            offset those amounts — which means there&apos;s nothing left for a demand letter to recover.
            We haven&apos;t charged you anything.
          </p>
          <div className="rounded-xl border border-[#E7E5E0] bg-slate-50/70 p-4 mb-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">What you can do instead</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex gap-2"><span className="text-[#B45309]">•</span>
                <span><strong>Double-check your numbers.</strong> If the repair estimate or unpaid amount
                you entered was too high, go back and correct it — if your real offsets are below your
                deposit, a letter can still demand the difference.</span></li>
              <li className="flex gap-2"><span className="text-[#B45309]">•</span>
                <span><strong>Ask for an itemized accounting.</strong> Even when nothing is owed back to
                you, most states still require your landlord to provide a written itemization of what
                they kept and why.</span></li>
              <li className="flex gap-2"><span className="text-[#B45309]">•</span>
                <span><strong>If your landlord demands even more</strong> than the deposit covered, consider
                negotiating or contacting your local legal aid office or tenant union before agreeing to
                pay anything further.</span></li>
            </ul>
          </div>
          <button onClick={handleStartOver}
            className="w-full rounded-full bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800">
            Go back to the form
          </button>
        </div>
      </div>
    );
  }

  // ---------- Form ----------
  const inputClass = (hasError?: boolean) =>
    `w-full rounded-lg border px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B45309]/40 focus:border-[#B45309] transition ${
      hasError ? 'border-red-500' : 'border-slate-300'
    }`;

  const labelClass = 'block text-sm font-medium text-slate-700 mb-2';
  const cardClass = 'rounded-2xl border border-[#E7E5E0] bg-white p-6 sm:p-7 space-y-6';
  const sectionLabel = 'text-xs font-semibold uppercase tracking-widest text-[#B45309]';
  const radioRow = 'flex items-start gap-2 text-sm text-slate-700';

  // Inline address block — used for the tenant mailing address and the landlord
  // address. The RENTAL address is rendered inline in Card 1 (city/state come
  // from the jurisdiction dropdowns), so it does NOT use this helper.
  const renderAddressBlock = (
    which: 'tenant' | 'landlord',
    addr: AddressParts,
    opts: {
      required?: boolean;
      fieldErrors?: Partial<Record<keyof AddressParts, boolean>>;
      message?: string;
      warnMessage?: string;
    }
  ) => {
    const fe = opts.fieldErrors || {};
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
        <div className="sm:col-span-4">
          <label className={labelClass}>
            Street address {opts.required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={addr.street}
            onChange={(e) => updateAddr(which, 'street', e.target.value)}
            placeholder="789 Elm St"
            className={inputClass(!!fe.street)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Apt / Suite / Unit</label>
          <input
            type="text"
            value={addr.unit}
            onChange={(e) => updateAddr(which, 'unit', e.target.value)}
            placeholder="Apt 4, Suite 200, Unit B"
            className={inputClass(!!fe.unit)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>
            City {opts.required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={addr.city}
            onChange={(e) => updateAddr(which, 'city', e.target.value)}
            placeholder="Austin"
            className={inputClass(!!fe.city)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>State</label>
          <select
            value={addr.state}
            onChange={(e) => updateAddr(which, 'state', e.target.value)}
            className={inputClass(!!fe.state)}
          >
            <option value="">Select…</option>
            {US_STATES.map(s => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>ZIP code</label>
          <input
            type="text"
            inputMode="numeric"
            value={addr.zip}
            onChange={(e) => updateAddr(which, 'zip', e.target.value)}
            placeholder="78701"
            className={inputClass(!!fe.zip)}
          />
        </div>
        {opts.message && (
          <p className="sm:col-span-6 mt-1 text-sm text-red-600">{opts.message}</p>
        )}
        {opts.warnMessage && (
          <p className="sm:col-span-6 mt-1 text-sm text-amber-700">{opts.warnMessage}</p>
        )}
      </div>
    );
  };

  const tier = computeTier();

  // Case-strength modal content (Project I). Replaces the old inline result
  // box AND the old weak-only modal — one confirmation modal, every tier.
  // The copy is honest about what the letter will actually do: the pipeline
  // now calibrates the letter from these same case facts.
  const tierModalContent: Record<Tier, {
    badge: string; icon: string; title: string; meaning: string; expect: string;
  }> = {
    strong: {
      badge: 'border-[#15803D]/30 bg-[#15803D]/[0.06] text-[#15803D]',
      icon: '\u2705',
      title: 'Your case looks strong',
      meaning:
        'Your answers point to solid legal standing: no admitted offsets and proper notice. Cases like this are exactly what deposit statutes protect.',
      expect:
        'Your letter will argue at full firmness \u2014 demanding the complete deposit, citing your state\u2019s statute and deadline, and referencing every penalty multiplier that applies.',
    },
    moderate: {
      badge: 'border-amber-300 bg-amber-50 text-amber-800',
      icon: '\u26A0\uFE0F',
      title: 'Your case looks moderate',
      meaning:
        'Some of your answers may complicate the claim \u2014 for example a disputed itemization, minor condition issues, an amount you owe, or limited documentation. That doesn\u2019t make your claim invalid; it means your landlord has some footing to argue back.',
      expect:
        'Your letter will acknowledge those factors head-on and demand the legitimate net portion of your deposit. Conceding what\u2019s genuinely owed makes the demand for the rest far more credible \u2014 and harder to dismiss.',
    },
    weak: {
      badge: 'border-red-300 bg-red-50 text-red-800',
      icon: '\uD83D\uDD34',
      title: 'Your case has real weaknesses',
      meaning:
        'Based on your answers, your landlord may have valid offsets or defenses that substantially reduce \u2014 or could eliminate \u2014 what you\u2019re owed back.',
      expect:
        'Your letter will still be generated and will demand everything you\u2019re legitimately owed, but it will be measured in tone and realistic in its demands. A recovery is not guaranteed, and you should weigh the $39 cost against what you might realistically get back.',
    },
  };

  return (
    <div className={`${fontVars} bg-[#FAFAF7]`}
      style={{ fontFamily: 'var(--font-body), system-ui, sans-serif' }}>
      <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-16">
        {/* Intro (no logo — SiteChrome provides the header) */}
        <div className="mb-10">
          <p className={`${sectionLabel} mb-3`}>Start your letter</p>
          <h1
            className="text-4xl font-medium leading-[1.08] tracking-tight text-slate-900 sm:text-5xl"
            style={display}
          >
            Get your security deposit back.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            Answer a few questions about your situation and we&apos;ll generate a
            state-specific demand letter citing the exact statute, deadline, and any
            penalty multipliers that apply to your case. It&apos;s written to be printed,
            signed, and sent by certified mail — and to hold up as evidence if your
            landlord forces you to small claims court.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            Most people finish in about two minutes. Your answers below are what your
            letter is built from &mdash; answer them accurately and your letter does the rest.
          </p>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-700">
            <li className="inline-flex items-center gap-2">
              <span className="text-[#15803D]">✓</span> All 50 states + DC
            </li>
            <li className="inline-flex items-center gap-2">
              <span className="text-[#15803D]">✓</span> Real statute citations
            </li>
            <li className="inline-flex items-center gap-2">
              <span className="text-[#15803D]">✓</span> Ready in about two minutes
            </li>
          </ul>
        </div>

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            // Enter advances the current step instead of submitting the whole
            // form early. Textareas keep Enter for newlines; the final step's
            // real submit button submits normally.
            if (
              e.key === 'Enter' &&
              currentStep < WIZARD_LAST_STEP &&
              (e.target as HTMLElement).tagName !== 'TEXTAREA'
            ) {
              e.preventDefault();
              handleStepContinue();
            }
          }}
          className="space-y-6"
        >
          {/* ============ WIZARD PROGRESS (Aug 2026 restructure) ============ */}
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">{WIZARD_STEPS[currentStep].title}</span>
              <span className="text-slate-500">{`Step ${currentStep + 1} of ${WIZARD_STEPS.length}`}</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200">
              <div
                className="h-1.5 rounded-full bg-slate-900 transition-all duration-300"
                style={{ width: `${((currentStep + 1) / WIZARD_STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* ============ STEP 1 — ABOUT YOU (name, email, mailing address) ============ */}
          {currentStep === 0 && (<>
          <div className={cardClass}>
            <div>
              <h3 className={`${sectionLabel} mb-2`}>About you</h3>
              <p className="text-sm text-slate-600">
                Who you are, and where your deposit &mdash; and the landlord&apos;s
                response &mdash; should be sent.
              </p>
            </div>

            {/* Tenant name */}
            <div id="f-tenantName">
              <label className={labelClass}>Your full name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.tenantName}
                onChange={(e) => handleInputChange('tenantName', e.target.value)}
                placeholder="Jane Smith"
                className={inputClass(!!errors.tenantName)}
              />
              {errors.tenantName && <p className="mt-1 text-sm text-red-600">{errors.tenantName}</p>}
            </div>

            {/* Email */}
            <div id="f-email">
              <label className={labelClass}>Your email address <span className="text-red-500">*</span></label>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="you@example.com"
                className={inputClass(!!errors.email)}
              />
              {errors.email ? (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              ) : (
                <p className="mt-1 text-sm text-slate-500">
                  We&apos;ll email your finished letter here as a downloadable PDF — use an address you can access.
                </p>
              )}
            </div>

            {/* Your mailing address (formerly CARD 2 — moved into this step;
                copy and the f-tenantAddress anchor preserved verbatim). */}
            <div id="f-tenantAddress">
              <p className="mb-1 text-sm font-medium text-slate-700">
                Your current mailing address <span className="text-red-500">*</span>
              </p>
              <p className="mb-3 text-sm text-slate-600">
                Where the landlord&apos;s response and your deposit should be sent.
              </p>
              {renderAddressBlock('tenant', tenantAddr, {
                required: true,
                fieldErrors: errors.tenantAddress
                  ? {
                      street: !tenantAddr.street,
                      city: !tenantAddr.city,
                      state: !tenantAddr.state,
                      zip: !tenantAddr.zip,
                    }
                  : {},
                message: errors.tenantAddress,
                warnMessage: warnings.tenantZip,
              })}
            </div>
          </div>
          </>)}

          {/* ============ STEP 2 — THE RENTAL PROPERTY ============ */}
          {currentStep === 1 && (<>
          <div className={cardClass}>
            <div>
              <h3 className={`${sectionLabel} mb-2`}>The rental property</h3>
              <p className="text-sm text-slate-600">
                Enter the rental you&apos;re writing about — the city and state set
                which laws your letter cites, so use the rental&apos;s location, not your
                current address.
              </p>
            </div>

            {/* Rental address: street / unit */}
            <div id="f-rentalPropertyAddress" className="grid grid-cols-1 gap-4 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <label className={labelClass}>
                  Street address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={rentalAddr.street}
                  onChange={(e) => updateAddr('rental', 'street', e.target.value)}
                  placeholder="1428 Magnolia Ave"
                  className={inputClass(!!errors.rentalPropertyAddress)}
                />
                <p className="mt-1 text-sm text-slate-500">
                  This is the rental property&apos;s address — not your current mailing address.
                </p>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Apt / Suite / Unit</label>
                <input
                  type="text"
                  value={rentalAddr.unit}
                  onChange={(e) => updateAddr('rental', 'unit', e.target.value)}
                  placeholder="Unit 3"
                  className={inputClass(false)}
                />
              </div>
            </div>

            {/* Rental address: city (dropdown) / state (dropdown) / zip */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
              <div className="sm:col-span-2" id="f-city">
                <label className={labelClass}>City <span className="text-red-500">*</span></label>
                <select
                  value={citySelect}
                  onChange={(e) => handleCitySelect(e.target.value)}
                  disabled={!formData.state}
                  className={`${inputClass(!!errors.city)} disabled:bg-slate-100 disabled:cursor-not-allowed`}
                >
                  <option value="">Select city…</option>
                  {cityOptions.map(city => (<option key={city} value={city}>{city}</option>))}
                </select>
              </div>
              <div className="sm:col-span-2" id="f-state">
                <label className={labelClass}>State <span className="text-red-500">*</span></label>
                <select
                  value={formData.state}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className={inputClass(!!errors.state)}
                >
                  <option value="">Select…</option>
                  {US_STATES.map(state => (<option key={state} value={state}>{state}</option>))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>ZIP code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={rentalAddr.zip}
                  onChange={(e) => updateAddr('rental', 'zip', e.target.value)}
                  placeholder="33701"
                  className={inputClass(false)}
                />
              </div>
              {(errors.state || errors.city) && (
                <p className="sm:col-span-6 mt-1 text-sm text-red-600">
                  {errors.state || errors.city}
                </p>
              )}
              {errors.rentalPropertyAddress && (
                <p className="sm:col-span-6 mt-1 text-sm text-red-600">{errors.rentalPropertyAddress}</p>
              )}
              {warnings.rentalZip && (
                <p className="sm:col-span-6 mt-1 text-sm text-amber-700">{warnings.rentalZip}</p>
              )}
            </div>

            {/* Other-city write-in */}
            {citySelect === OTHER_CITY && (
              <div>
                <label className={labelClass}>
                  Enter your city <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={otherCity}
                  onChange={(e) => handleOtherCity(e.target.value)}
                  placeholder={formData.state ? `City in ${formData.state}` : 'City'}
                  className={inputClass(!!errors.city)}
                />
              </div>
            )}

            {/* NYC rent-stabilized — mandatory when shown (PV-11a): the answer
                decides which NY deposit law the letter argues, so skipping it
                is blocked in validateForm. */}
            {showRentStabilized && (
              <div className="pt-1" id="f-isRentStabilized">
                <label className={labelClass}>
                  Is this a rent-stabilized apartment? <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-4">
                  {[['yes', 'Yes'], ['no', 'No'], ['unknown', 'I\u2019m not sure']].map(([v, l]) => (
                    <label key={v} className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="radio" value={v}
                        checked={formData.isRentStabilized === v}
                        onChange={(e) => handleInputChange('isRentStabilized', e.target.value)}
                        className="w-4 h-4 accent-[#B45309]" />
                      {l}
                    </label>
                  ))}
                </div>
                {errors.isRentStabilized && <p className="mt-1 text-sm text-red-600">{errors.isRentStabilized}</p>}
                <p className="mt-1 text-xs text-slate-500">
                  Rent-stabilized apartments are covered by different deposit rules, so
                  this determines which law your letter argues. Choose &ldquo;I&rsquo;m not
                  sure&rdquo; if you don&rsquo;t know &mdash; your letter will cover both.
                </p>
              </div>
            )}
            {showLeaseStartDate && (
              <div id="f-leaseStartDate">
                <label className={labelClass}>
                  When did your current lease or most recent renewal begin?
                </label>
                <input
                  type="date"
                  max={todayISO}
                  value={formData.leaseStartDate}
                  onChange={(e) => handleInputChange('leaseStartDate', e.target.value)}
                  className={inputClass(!!errors.leaseStartDate)}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Optional. This helps us cite the right rent-stabilization deposit protections for your lease.
                </p>
                {errors.leaseStartDate && <p className="mt-1 text-sm text-red-600">{errors.leaseStartDate}</p>}
              </div>
            )}
          </div>
          </>)}

          {/* ============ STEP 3 — DEPOSIT & DATES ============ */}
          {currentStep === 2 && (<>
          <div className={cardClass}>
            <div>
              <h3 className={`${sectionLabel} mb-2`}>Deposit &amp; dates</h3>
              <p className="text-sm text-slate-600">
                The money and the timeline &mdash; your letter&apos;s demand and its
                deadline math are built from these.
              </p>
            </div>

            {/* Deposit + move-out */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div id="f-depositAmount">
                <label className={labelClass}>
                  Security deposit amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-slate-500">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData.depositAmount}
                    onChange={(e) => handleInputChange('depositAmount', e.target.value)}
                    placeholder="2400"
                    className={`${inputClass(!!errors.depositAmount)} pl-8`}
                  />
                </div>
                {errors.depositAmount && <p className="mt-1 text-sm text-red-600">{errors.depositAmount}</p>}
                {warnings.depositAmount && <p className="mt-1 text-sm text-amber-700">{warnings.depositAmount}</p>}
              </div>
              <div id="f-vacatedDate">
                <label className={labelClass}>
                  Date you moved out <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.vacatedDate}
                  max={todayISO}
                  onChange={(e) => handleInputChange('vacatedDate', e.target.value)}
                  className={inputClass(!!errors.vacatedDate)}
                />
                {errors.vacatedDate && <p className="mt-1 text-sm text-red-600">{errors.vacatedDate}</p>}
                {warnings.vacatedDate && <p className="mt-1 text-sm text-amber-700">{warnings.vacatedDate}</p>}
              </div>
            </div>

            {/* Optional: date the deposit was paid (Project I) */}
            <div id="f-depositPaidDate">
              <label className={labelClass}>
                Date you paid the deposit{' '}
                <span className="font-normal text-slate-500">(optional)</span>
              </label>
              <input
                type="date"
                max={todayISO}
                value={formData.depositPaidDate}
                onChange={(e) => handleInputChange('depositPaidDate', e.target.value)}
                className={inputClass(false)}
              />
              {warnings.depositPaidDate && <p className="mt-1 text-sm text-amber-700">{warnings.depositPaidDate}</p>}
              <p className="mt-1 text-xs text-slate-500">
                If you know it, your letter opens with the exact date and amount of your
                deposit &mdash; it reads more authoritative. Leave blank if you&apos;re not sure.
              </p>
            </div>

            {/* Conditional: forwarding-address date */}
            {FORWARDING_ADDRESS_STATES.includes(formData.state) && (
              <div id="f-forwardingAddressDate">
                <label className={labelClass}>
                  Date you gave your landlord a forwarding address
                </label>
                <input
                  type="date"
                  value={formData.forwardingAddressDate}
                  onChange={(e) => handleInputChange('forwardingAddressDate', e.target.value)}
                  className={inputClass(false)}
                />
                {warnings.forwardingAddressDate && <p className="mt-1 text-sm text-amber-700">{warnings.forwardingAddressDate}</p>}
                <p className="mt-1 text-xs text-slate-500">
                  In {formData.state}, the deadline is measured from your forwarding
                  address date. Leave blank if you never provided one or aren&apos;t sure.
                </p>
              </div>
            )}

            {/* Conditional: unit count */}
            {showUnitCount && (
              <div id="f-buildingUnitCount">
                <label className={labelClass}>
                  How many rental units are in the building? <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  value={formData.buildingUnitCount === 'unknown' ? '' : formData.buildingUnitCount}
                  onChange={(e) => handleInputChange('buildingUnitCount', e.target.value)}
                  disabled={formData.buildingUnitCount === 'unknown'}
                  placeholder="e.g., 8"
                  className={`${inputClass(!!errors.buildingUnitCount)} disabled:bg-slate-100 disabled:cursor-not-allowed`}
                />
                {errors.buildingUnitCount && <p className="mt-1 text-sm text-red-600">{errors.buildingUnitCount}</p>}
                <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.buildingUnitCount === 'unknown'}
                    onChange={(e) =>
                      handleInputChange('buildingUnitCount', e.target.checked ? 'unknown' : '')
                    }
                    className="w-4 h-4 accent-[#B45309]"
                  />
                  I&apos;m not sure how many units the building has
                </label>
                <p className="mt-1 text-xs text-slate-500">
                  In {formData.state}, the security-deposit statute applies differently
                  depending on the building&apos;s size, so this affects which law your
                  letter cites. Enter the exact number of units if you know it, or check
                  &ldquo;I&rsquo;m not sure&rdquo; &mdash; an exact number makes your
                  letter stronger.
                </p>
              </div>
            )}

            {/* Conditional: Maine lease type */}
            {showLeaseType && (
              <div id="f-leaseType">
                <label className={labelClass}>
                  What kind of tenancy did you have?
                </label>
                <div className="space-y-2">
                  {[
                    ['written_lease', 'A written lease'],
                    ['tenancy_at_will', 'Tenancy at will / month-to-month (no written lease)'],
                  ].map(([v, l]) => (
                    <label key={v} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        value={v}
                        checked={formData.leaseType === v}
                        onChange={(e) => handleInputChange('leaseType', e.target.value)}
                        className="w-4 h-4 accent-[#B45309]"
                      />
                      {l}
                    </label>
                  ))}
                </div>
                {errors.leaseType && <p className="mt-1 text-sm text-red-600">{errors.leaseType}</p>}
                <p className="mt-1 text-xs text-slate-500">
                  In {formData.state}, a tenancy-at-will has a shorter return deadline
                  than a written lease.
                </p>
              </div>
            )}
          </div>
          </>)}

          {/* ============ STEP 4 — YOUR LANDLORD ============ */}
          {currentStep === 3 && (<>
          {/* ============ CARD 3: LANDLORD INFORMATION ============ */}
          <div className={cardClass}>
            <h3 className={sectionLabel}>Landlord information</h3>
            <div id="f-landlordName">
              <label className={labelClass}>
                Landlord / property manager name <span className="text-red-500">*</span>
              </label>
              <p className="mb-2 text-sm text-slate-600">
                The person or company you paid your deposit to &mdash; the landlord named on
                your lease. If the property was sold, enter your <span className="font-medium">original</span>{' '}
                landlord here, not the new owner (you&apos;ll add the new owner below).
              </p>
              <input
                type="text"
                value={formData.landlordName}
                onChange={(e) => handleInputChange('landlordName', e.target.value)}
                placeholder="John Doe or ABC Property Mgmt"
                className={inputClass(!!errors.landlordName)}
              />
              {errors.landlordName && <p className="mt-1 text-sm text-red-600">{errors.landlordName}</p>}
            </div>
            <div id="f-landlordAddress">
              <p className="mb-3 text-sm font-medium text-slate-700">
                Landlord address{' '}
                <span className="font-normal text-slate-500">(if known)</span>
              </p>
              {renderAddressBlock('landlord', landlordAddr, {
                warnMessage:
                  warnings.landlordAddress || warnings.landlordZip || warnings.identicalParties,
              })}
            </div>

            {/* Mandatory: was the property sold during the tenancy? */}
            <div id="f-propertySold" className="border-t border-slate-200 pt-5">
              <label className={labelClass}>
                Was this property sold while you were living there?{' '}
                <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {[
                  ['no', 'No'],
                  ['yes', 'Yes'],
                ].map(([v, l]) => (
                  <label key={v} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name="propertySold"
                      value={v}
                      checked={formData.propertySold === v}
                      onChange={(e) => handleInputChange('propertySold', e.target.value)}
                      className="w-4 h-4 accent-[#B45309]"
                    />
                    {l}
                  </label>
                ))}
              </div>
              {errors.propertySold && <p className="mt-1 text-sm text-red-600">{errors.propertySold}</p>}

              {formData.propertySold === 'yes' && (
                <div className="mt-5">
                  <p className="mb-3 text-sm text-slate-600">
                    If you know who owns the property now, add them below and your letter
                    will be addressed to them. If you don&apos;t know, leave these blank
                    &mdash; your letter will go to your original landlord above and hold
                    them to their obligation to have properly transferred your deposit.
                  </p>
                  <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                    Enter the <span className="font-semibold">new</span> owner here only
                    &mdash; not the same landlord you listed above. These should be two
                    different parties. If they&apos;re the same, leave this blank.
                  </div>
                  <div id="f-newOwnerName" className="mb-4">
                    <label className={labelClass}>
                      Current owner&apos;s name{' '}
                      <span className="font-normal text-slate-500">(if known)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.newOwnerName}
                      onChange={(e) => handleInputChange('newOwnerName', e.target.value)}
                      placeholder="Different from the landlord above"
                      className={inputClass(false)}
                    />
                  </div>
                  <div id="f-newOwnerAddress">
                    <label className={labelClass}>
                      Current owner&apos;s address{' '}
                      <span className="font-normal text-slate-500">(if known)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.newOwnerAddress}
                      onChange={(e) => handleInputChange('newOwnerAddress', e.target.value)}
                      placeholder="Street, City, State ZIP"
                      className={inputClass(false)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          </>)}

          {/* ============ STEP 5 — WHAT HAPPENED (scenario, disputes, circumstances) ============ */}
          {currentStep === 4 && (<>
          {/* ============ CARD 4: WHAT YOUR LANDLORD DID (authoritative scenario) ============ */}
          <div className={cardClass} id="f-scenario">
            <div>
              <h3 className={`${sectionLabel} mb-2`}>
                What did your landlord do with your deposit? <span className="text-red-500">*</span>
              </h3>
              <p className="text-sm text-slate-600">
                Choose the one that best describes it &mdash; this determines the kind of
                letter we write. Hover the <span className="font-medium">i</span> on any
                option for a quick explanation.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup">
              {SCENARIOS.map(sc => {
                const active = formData.scenario === sc.id;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => handleScenarioChange(sc.id)}
                    className={`rounded-xl border-2 p-4 text-left transition ${
                      active
                        ? 'border-[#B45309] bg-[#B45309]/[0.06]'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{sc.icon}</span>
                      <span className="text-sm font-medium text-slate-700">
                        {sc.label}
                        <InfoTip text={sc.tip} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.scenario && <p className="mt-1 text-sm text-red-600">{errors.scenario}</p>}

            {/* Follow-up: partial-return scenarios must state how much came back */}
            {PARTIAL_SCENARIOS.includes(formData.scenario) && (
              <div id="f-amountReturned" className="border-t border-slate-200 pt-5">
                <label className={labelClass}>
                  How much of your deposit was returned? <span className="text-red-500">*</span>
                </label>
                <div className="relative sm:max-w-xs">
                  <span className="absolute left-4 top-2.5 text-slate-500">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData.amountReturned}
                    onChange={(e) => handleInputChange('amountReturned', e.target.value)}
                    placeholder="800"
                    className={`${inputClass(!!errors.amountReturned)} pl-8`}
                  />
                </div>
                {errors.amountReturned && <p className="mt-1 text-sm text-red-600">{errors.amountReturned}</p>}
                <p className="mt-1 text-xs text-slate-500">
                  Your letter demands the exact withheld remainder &mdash; your deposit minus this amount.
                </p>
              </div>
            )}
          </div>

          {/* ============ CARD 5: WHY IT'S WRONG (dispute grounds) ============ */}
          {formData.scenario && (
            <div className={cardClass}>
              <div>
                <h3 className={`${sectionLabel} mb-2`}>
                  {DEDUCTION_SCENARIOS.includes(formData.scenario)
                    ? 'Why are the deductions wrong?'
                    : 'Did your landlord break the rules along the way?'}
                </h3>
                <p className="text-sm text-slate-600">Select any that apply (optional)</p>
              </div>
              <div className="space-y-2">
                {(DEDUCTION_SCENARIOS.includes(formData.scenario)
                  ? [...DEDUCTION_DISPUTE_GROUNDS, ...PROCEDURAL_DISPUTE_GROUNDS]
                  : PROCEDURAL_DISPUTE_GROUNDS
                ).map(ground => (
                  <label
                    key={ground.id}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.disputes.includes(ground.id)}
                      onChange={() => toggleDispute(ground.id)}
                      className="w-4 h-4 accent-[#B45309]"
                    />
                    <span className="text-sm text-slate-700">
                      {ground.label}
                      <InfoTip text={ground.tip} />
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ============ CARD 6: SPECIAL CIRCUMSTANCES ============ */}
          <div className={cardClass}>
            <div>
              <h3 className={`${sectionLabel} mb-2`}>Special circumstances</h3>
              <p className="text-sm text-slate-600">Select any that apply (optional)</p>
            </div>
            <div className="space-y-2">
              {SPECIAL_CIRCUMSTANCES.map(circumstance => (
                <label
                  key={circumstance.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.specialCircumstances.includes(circumstance.id)}
                    onChange={() => toggleSpecialCircumstance(circumstance.id)}
                    className="w-4 h-4 accent-[#B45309]"
                  />
                  <span className="text-sm text-slate-700">
                    {circumstance.label}
                    <InfoTip text={circumstance.tip} />
                  </span>
                </label>
              ))}
            </div>
            {showLeaseDesignation && (
              <div className="border-t border-slate-200 pt-5">
                <label className={labelClass}>
                  Does your lease specifically state in writing that this fee is non-refundable?
                </label>
                <div className="space-y-2">
                  {[
                    ['yes_designated', 'Yes, my lease has that specific written designation'],
                    ['no_not_designated', 'No, my lease doesn\u2019t say that'],
                    ['unknown', 'I don\u2019t know / I don\u2019t have my lease handy'],
                  ].map(([v, l]) => (
                    <label key={v} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        value={v}
                        checked={formData.leaseDesignation === v}
                        onChange={(e) => handleInputChange('leaseDesignation', e.target.value)}
                        className="w-4 h-4 accent-[#B45309]"
                      />
                      {l}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          </>)}

          {/* ============ WIZARD NAVIGATION (steps 1–5; the final step has the
               real Generate/submit button in its own block below) ============ */}
          {currentStep < WIZARD_LAST_STEP && (
            <div className="flex items-center gap-3 pt-2">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handleStepBack}
                  className="rounded-full border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  &larr; Back
                </button>
              )}
              <button
                type="button"
                onClick={handleStepContinue}
                className="flex-1 rounded-full bg-slate-900 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-slate-800"
              >
                Continue &rarr;
              </button>
            </div>
          )}

          {/* ============ STEP 6 — THE HONEST FACTS (case facts + supporting detail) ============ */}
          {currentStep === WIZARD_LAST_STEP && (<>
          {/* ============ CARD 7: THE HONEST FACTS (required — shape the letter) ============ */}
          <div className={cardClass}>
            <div>
              <h3 className={`${sectionLabel} mb-2`}>
                Your situation &mdash; the honest facts <span className="text-red-500">*</span>
              </h3>
              <p className="text-sm text-slate-600">
                These answers shape your letter directly &mdash; it&apos;s calibrated to argue
                exactly as firmly as your facts support, which is what makes it credible.
                Your deposit is your money by default; these only matter if your landlord
                has a valid reason to keep part of it. Answer honestly &mdash; a letter that
                contradicts the facts is worthless as evidence.
              </p>
            </div>

            {/* Condition */}
            <div id="f-unitCondition">
              <label className={labelClass}>
                Did you leave the unit in the same or better condition than when you moved
                in (accounting for normal wear and tear)? <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {[
                  ['good', 'Yes, I left it in good condition'],
                  ['minor', 'Mostly \u2014 minor issues but nothing major'],
                  ['damage', 'No \u2014 some damage occurred'],
                ].map(([v, l]) => (
                  <label key={v} className={radioRow}>
                    <input type="radio" value={v}
                      checked={formData.unitCondition === v}
                      onChange={(e) => handleCaseChange('unitCondition', e.target.value)}
                      className="mt-0.5 w-4 h-4 accent-[#B45309]" />
                    {l}
                  </label>
                ))}
              </div>
              {errors.unitCondition && <p className="mt-1 text-sm text-red-600">{errors.unitCondition}</p>}
              {formData.unitCondition === 'damage' && (
                <div className="mt-3">
                  <label className={labelClass}>
                    Your best estimate of the repair cost <span className="text-red-500">*</span>
                  </label>
                  <div className="relative max-w-xs">
                    <span className="absolute left-4 top-2.5 text-slate-500">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formData.damageEstimate}
                      onChange={(e) => handleCaseChange('damageEstimate', e.target.value)}
                      placeholder="e.g., 150"
                      className={`${inputClass(!!errors.damageEstimate)} pl-8`}
                    />
                  </div>
                  {errors.damageEstimate && <p className="mt-1 text-sm text-red-600">{errors.damageEstimate}</p>}
                  <p className="mt-1 text-xs text-slate-500">
                    Your letter concedes this amount and demands the rest &mdash; conceding
                    what&apos;s fair makes the demand for the remainder much harder to dismiss.
                    A rough good-faith estimate is fine.
                  </p>
                </div>
              )}
            </div>

            {/* Unpaid rent */}
            <div id="f-unpaidRent">
              <label className={labelClass}>
                Do you have any outstanding unpaid rent or fees owed to your landlord? <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {[
                  ['no', 'No'],
                  ['yes', 'Yes'],
                ].map(([v, l]) => (
                  <label key={v} className={radioRow}>
                    <input type="radio" value={v}
                      checked={formData.unpaidRent === v}
                      onChange={(e) => handleCaseChange('unpaidRent', e.target.value)}
                      className="mt-0.5 w-4 h-4 accent-[#B45309]" />
                    {l}
                  </label>
                ))}
              </div>
              {errors.unpaidRent && <p className="mt-1 text-sm text-red-600">{errors.unpaidRent}</p>}
              {formData.unpaidRent === 'yes' && (
                <div className="mt-3">
                  <label className={labelClass}>
                    Approximately how much? <span className="text-red-500">*</span>
                  </label>
                  <div className="relative max-w-xs">
                    <span className="absolute left-4 top-2.5 text-slate-500">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formData.unpaidRentAmount}
                      onChange={(e) => handleCaseChange('unpaidRentAmount', e.target.value)}
                      placeholder="e.g., 500"
                      className={`${inputClass(!!errors.unpaidRentAmount)} pl-8`}
                    />
                  </div>
                  {errors.unpaidRentAmount && <p className="mt-1 text-sm text-red-600">{errors.unpaidRentAmount}</p>}
                  <p className="mt-1 text-xs text-slate-500">
                    Your letter accounts for this so your landlord can&apos;t use it to dismiss
                    your entire demand.
                  </p>
                </div>
              )}
            </div>

            {/* Proper notice (required everywhere; drives the Alaska 14-vs-30-day deadline) */}
            <div id="f-properNotice">
              <label className={labelClass}>
                Did you give your landlord proper written notice before moving out (per your lease)? <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {[
                  ['yes', 'Yes'],
                  ['not_required', 'My lease didn\u2019t require notice'],
                  ['no', 'No, I didn\u2019t give the required notice'],
                ].map(([v, l]) => (
                  <label key={v} className={radioRow}>
                    <input type="radio" value={v}
                      checked={formData.properNotice === v}
                      onChange={(e) => handleCaseChange('properNotice', e.target.value)}
                      className="mt-0.5 w-4 h-4 accent-[#B45309]" />
                    {l}
                  </label>
                ))}
              </div>
              {formData.properNotice === 'no' && (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                  <label className={labelClass}>
                    Did you give any notice at all? <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {[
                      ['partial', 'Yes, but less than required (e.g., 2 weeks when 30 days was required)'],
                      ['none', 'No notice \u2014 I moved out without telling them'],
                    ].map(([v, l]) => (
                      <label key={v} className={radioRow}>
                        <input type="radio" value={v}
                          checked={formData.noticeGiven === v}
                          onChange={(e) => handleCaseChange('noticeGiven', e.target.value)}
                          className="mt-0.5 w-4 h-4 accent-[#B45309]" />
                        {l}
                      </label>
                    ))}
                  </div>
                  {errors.noticeGiven && <p className="mt-1 text-sm text-red-600">{errors.noticeGiven}</p>}
                </div>
              )}
              {errors.properNotice && <p className="mt-1 text-sm text-red-600">{errors.properNotice}</p>}
              {isAlaska && (
                <p className="mt-1 text-xs text-slate-500">
                  In Alaska, whether you gave proper written notice changes the return deadline.
                </p>
              )}
            </div>

            {/* Documentation */}
            <div id="f-conditionDocumentation">
              <label className={labelClass}>
                Did you document the unit&apos;s condition at move-in or move-out (photos,
                checklist, inspection report)? <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {[
                  ['yes', 'Yes \u2014 I have photos and/or a checklist'],
                  ['partial', 'Partially \u2014 I have some documentation'],
                  ['no', 'No documentation'],
                ].map(([v, l]) => (
                  <label key={v} className={radioRow}>
                    <input type="radio" value={v}
                      checked={formData.conditionDocumentation === v}
                      onChange={(e) => handleCaseChange('conditionDocumentation', e.target.value)}
                      className="mt-0.5 w-4 h-4 accent-[#B45309]" />
                    {l}
                  </label>
                ))}
              </div>
              {errors.conditionDocumentation && <p className="mt-1 text-sm text-red-600">{errors.conditionDocumentation}</p>}
            </div>
          </div>

          {/* ============ CARD 8: ANYTHING ELSE (optional, supporting detail) ============ */}
          <div id="f-situation" className={cardClass}>
            <div>
              <label className={`${labelClass} mb-1`}>
                Anything else we should know?{' '}
                <span className="font-normal text-slate-500">(optional)</span>
              </label>
              <p className="mb-3 text-sm text-slate-600">
                Your answers above are what your letter is built from &mdash; this box adds
                supporting detail. Specifics like names, dates, what was said, military
                service, or anything unusual about your situation can strengthen the letter.
              </p>
            </div>
            <textarea
              value={formData.situation}
              onChange={(e) => handleInputChange('situation', e.target.value)}
              placeholder={`e.g., When I asked about my deposit on April 2nd, my landlord texted back \u201Cyou\u2019ll get it when you get it.\u201D I have the text saved. I\u2019m also an active-duty service member.`}
              rows={5}
              maxLength={4000}
              className={`${inputClass(!!errors.situation)} resize-none`}
            />
            {errors.situation && <p className="mt-1 text-sm text-red-600">{errors.situation}</p>}
            <p className="text-xs text-slate-500">
              {formData.situation.length} / 4,000 characters maximum
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={handleStepBack}
              className="rounded-full border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              &larr; Back
            </button>
          </div>

          {(() => {
            const blockCount = Object.keys(errors).filter(k => errors[k]).length;
            const warnList = Object.keys(warnings).filter(k => warnings[k]);
            if (blockCount > 0) {
              return (
                <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
                  {blockCount === 1
                    ? '1 field needs your attention'
                    : `${blockCount} fields need your attention`}{' '}
                  before we can continue — we&apos;ve highlighted {blockCount === 1 ? 'it' : 'them'} above.
                </div>
              );
            }
            if (warningsShown && warnList.length > 0) {
              return (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                  <p className="mb-1 font-medium">Please review before continuing:</p>
                  <ul className="list-disc space-y-1 pl-5">
                    {warnList.map(k => (<li key={k}>{warnings[k]}</li>))}
                  </ul>
                  <p className="mt-2">
                    If everything looks right, click &ldquo;Generate My Demand Letter&rdquo; again to proceed.
                  </p>
                </div>
              );
            }
            return null;
          })()}

          <button
            type="submit"
            className="w-full rounded-full bg-slate-900 px-6 py-4 text-lg font-semibold text-white transition hover:bg-slate-800"
          >
            Generate My Demand Letter — $39
          </button>
          <p className="text-center text-sm text-slate-500">
            One-time payment. No subscription. Complete package with certified mail instructions.
          </p>
          </>)}
        </form>
      </div>

      {/* ============ CASE-STRENGTH CONFIRMATION MODAL (all tiers) ============ */}
      {showStrengthModal && tier && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="strength-modal-title"
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#E7E5E0] bg-white p-7 shadow-xl">
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${tierModalContent[tier].badge}`}>
              <span>{tierModalContent[tier].icon}</span>
              {tierModalContent[tier].title}
            </div>
            <h2 id="strength-modal-title" className="mt-4 text-xl font-semibold text-slate-900" style={display}>
              Your case assessment
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              {tierModalContent[tier].meaning}
            </p>
            <div className="mt-3 rounded-xl border border-[#E7E5E0] bg-slate-50/70 p-4">
              <h3 className="text-sm font-semibold text-slate-900">What to expect from your letter</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">
                {tierModalContent[tier].expect}
              </p>
            </div>
            {tier === 'weak' && (
              <>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
                  {weakReasons().map((r, i) => (<li key={i}>{r}</li>))}
                </ul>
                <label className="mt-4 flex items-start gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={weakChecked}
                    onChange={(e) => setWeakChecked(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[#B45309]"
                  />
                  I understand my case may be weak, that a refund is not guaranteed, and I
                  want to generate the letter anyway.
                </label>
              </>
            )}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
              <button
                type="button"
                disabled={tier === 'weak' && !weakChecked}
                onClick={handleProceedFromModal}
                className="flex-1 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Continue to payment — $39
              </button>
              <button
                type="button"
                onClick={() => setShowStrengthModal(false)}
                className="flex-1 rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Go back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
