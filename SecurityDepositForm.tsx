// SecurityDepositForm.tsx  (repo root)
'use client';

import { useState } from 'react';
import { Fraunces, DM_Sans } from 'next/font/google';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

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
// by lib/systemPrompt.ts (Chicago RLTO, NYC escrow, etc.) and by the
// showRentStabilized logic (=== 'New York City'). DO NOT alter these strings:
//   San Francisco, Los Angeles, Berkeley, West Hollywood, Santa Monica,
//   Chicago, Cook County (outside Chicago), Evanston, New York City, Seattle,
//   Portland, Boston, Cambridge, Washington DC
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
const UNIT_COUNT_STATES = ['Illinois', 'Arkansas', 'New York'];

// Maine's deadline is 21 days for a tenancy-at-will (no written lease) vs 30
// days under a written lease, so the letter needs the lease type.
const LEASE_TYPE_STATES = ['Maine'];

// NOTE (Change 6): Alaska's 14-vs-30-day notice branch is now DERIVED from the
// Quick Case Check "proper written notice" question (single source of truth),
// rather than a separate Alaska-only field. See deriveGaveWrittenNotice() and
// the Alaska required-field check in validateForm.

interface SubTypeItem { id: string; label: string; icon: string; tip: string; }
interface CircumstanceItem { id: string; label: string; tip: string; }

// Trimmed from 10 -> 8 (removed vague "No response / total silence" and
// "Forwarding address excuse"). Each item now carries a plain-language tooltip.
const SUB_TYPES: SubTypeItem[] = [
  { id: 'partial_no_itemization', label: 'Partial return without itemization', icon: '\uD83D\uDCC4', tip: 'Your landlord returned part of your deposit but didn\u2019t provide a written breakdown of what they kept or why. Example: you got $800 back from a $1,400 deposit with no explanation.' },
  { id: 'partial_disputed_items', label: 'Partial return with disputed items', icon: '\u2696\uFE0F', tip: 'Your landlord returned part of your deposit but listed deductions you believe are wrong or inflated. Example: they charged $600 for repairs you don\u2019t think were your responsibility.' },
  { id: 'full_withholding_vague', label: 'Full withholding with vague reasons', icon: '\u274C', tip: 'Your landlord kept the entire deposit but gave only a vague or general reason, with no itemized list. Example: they said \u201Ccleaning and repairs\u201D with no documentation.' },
  { id: 'late_notice', label: 'Late notice after deadline', icon: '\u23F0', tip: 'Your landlord sent their deduction notice after your state\u2019s legal deadline had already passed. Example: your state requires notice within 30 days and they sent it on day 45.' },
  { id: 'wear_and_tear', label: 'Charged for normal wear and tear', icon: '\uD83C\uDFE0', tip: 'Your landlord is deducting for things that naturally age or wear with normal use. Example: carpet that faded over 3 years, small wall scuffs, or minor paint wear.' },
  { id: 'preexisting_damage', label: 'Charged for pre-existing damage', icon: '\uD83D\uDCF8', tip: 'Your landlord is charging for damage that existed before you moved in. Example: a cracked tile or stained ceiling that was already there when you arrived.' },
  { id: 'inflated_charges', label: 'Inflated repair charges', icon: '\uD83D\uDCB0', tip: 'The amounts your landlord is claiming seem far higher than the repairs would reasonably cost. Example: charging $900 to repaint one bedroom.' },
  { id: 'escrow_violation', label: 'Deposit not properly held', icon: '\uD83C\uDFE6', tip: 'Your landlord may have failed to hold your deposit in a separate account as required by law. Example: no disclosure of where it was held, or it was mixed with operating funds.' },
];

// Trimmed from 8 -> 6 (removed "landlord has passed away" and "lease ended /
// went month-to-month"). Each item now carries a plain-language tooltip.
const SPECIAL_CIRCUMSTANCES: CircumstanceItem[] = [
  { id: 'multiple_tenants_on_lease', label: 'I had roommates on the lease', tip: 'Other tenants were also listed on the lease. This affects how the letter is addressed and how the deposit demand is structured.' },
  { id: 'property_sold_during_tenancy', label: 'The property was sold during my tenancy', tip: 'Your landlord sold the property while you were still living there. The new owner may have inherited the obligation to return your deposit.' },
  { id: 'tenant_broke_lease_early', label: 'I broke the lease early', tip: 'You moved out before your lease end date. Your letter will reference your landlord\u2019s legal duty to re-rent and mitigate losses rather than simply keep your deposit.' },
  { id: 'deposit_applied_to_last_rent', label: 'Landlord applied my deposit to last month\u2019s rent', tip: 'Your landlord used your security deposit to cover your final month\u2019s rent without your agreement. Security deposits and rent are legally separate.' },
  { id: 'non_refundable_cleaning_fee', label: 'I paid a non-refundable cleaning fee', tip: 'You paid a fee at move-in that was labeled non-refundable. Depending on your state, this may still be legally recoverable.' },
  { id: 'tenant_admits_partial_damage', label: 'Some damage occurred but I dispute the amount', tip: 'You acknowledge some damage happened but believe the landlord\u2019s charges are excessive or undocumented. Example: you broke a towel bar but they\u2019re charging $400 to repaint the whole bathroom.' },
];

type ViewState = 'form' | 'loading' | 'result' | 'missing_info' | 'out_of_scope' | 'error';
type Tier = 'strong' | 'moderate' | 'weak';

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
    tenantAddress: '',
    landlordName: '',
    landlordAddress: '',
    rentalPropertyAddress: '',
    depositAmount: '',
    vacatedDate: '',
    forwardingAddressDate: '',
    situation: '',
    subtypes: [] as string[],
    specialCircumstances: [] as string[],
    leaseDesignation: '',
    isRentStabilized: '',
    leaseStartDate: '',
    buildingUnitCount: '',
    gaveWrittenNotice: '', // derived from properNotice on submit (Alaska 14-vs-30-day)
    leaseType: '',
    // ---- Quick Case Check (Change 6) ----
    itemizationProvided: '',   // 'yes_documented' | 'yes_disputed' | 'none'
    unitCondition: '',         // 'good' | 'minor' | 'damage'
    damageEstimate: '',        // numeric string, shown when unitCondition === 'damage'
    unpaidRent: '',            // 'no' | 'yes'
    unpaidRentAmount: '',      // numeric string, shown when unpaidRent === 'yes'
    properNotice: '',          // 'yes' | 'not_required' | 'no'
    noticeGiven: '',           // 'partial' | 'none' (secondary; shown when properNotice === 'no')
    conditionDocumentation: '', // 'yes' | 'partial' | 'no'
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [warnings, setWarnings] = useState<{ [key: string]: string }>({});
  const [warningsShown, setWarningsShown] = useState(false);

  // Weak-case acknowledgment modal (Change 6).
  const [showWeakModal, setShowWeakModal] = useState(false);
  const [weakChecked, setWeakChecked] = useState(false);
  const [weakAcknowledged, setWeakAcknowledged] = useState(false);

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
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    if (warnings[field]) setWarnings(prev => ({ ...prev, [field]: '' }));
  };

  // Case-check changes can reset dependent follow-ups, and always reset the
  // weak-case acknowledgment so the customer re-sees the warning if they revise.
  const handleCaseChange = (field: string, value: string) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'properNotice' && value !== 'no') next.noticeGiven = '';
      if (field === 'unpaidRent' && value !== 'yes') next.unpaidRentAmount = '';
      if (field === 'unitCondition' && value !== 'damage') next.damageEstimate = '';
      return next;
    });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    setWeakAcknowledged(false);
    setWeakChecked(false);
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

  const toggleSubtype = (id: string) => {
    setFormData(prev => ({
      ...prev,
      subtypes: prev.subtypes.includes(id)
        ? prev.subtypes.filter(s => s !== id)
        : [...prev.subtypes, id]
    }));
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
    'state', 'city', 'tenantName', 'rentalPropertyAddress', 'depositAmount', 'vacatedDate',
    'forwardingAddressDate', 'buildingUnitCount', 'leaseType', 'tenantAddress',
    'landlordName', 'landlordAddress', 'properNotice', 'situation',
    'tenantZip', 'landlordZip', 'rentalZip', 'identicalParties',
  ];
  const SCROLL_ALIAS: { [k: string]: string } = {
    tenantZip: 'tenantAddress',
    landlordZip: 'landlordAddress',
    rentalZip: 'rentalPropertyAddress',
    identicalParties: 'landlordAddress',
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

  // Case-strength tier. Returns null until the four material questions are
  // answered (itemization, condition, unpaid rent, notice).
  const computeTier = (): Tier | null => {
    const f = formData;
    const answered = f.itemizationProvided && f.unitCondition && f.unpaidRent && f.properNotice;
    if (!answered) return null;

    const depositVal = parseDeposit(f.depositAmount).value;
    const unpaidVal = parseMoney(f.unpaidRentAmount);
    const damageVal = parseMoney(f.damageEstimate);

    // Weak: offsets meet or exceed the deposit, or the tenant abandoned.
    if (f.noticeGiven === 'none') return 'weak';
    if (f.unpaidRent === 'yes' && depositVal > 0 && unpaidVal >= depositVal) return 'weak';
    if (f.unitCondition === 'damage' && depositVal > 0 && damageVal >= depositVal) return 'weak';

    // Moderate: some valid offset or weakened standing, but not exceeding deposit.
    const moderate =
      f.itemizationProvided === 'yes_disputed' ||
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

  const validateForm = (composed: {
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
    if (!formData.landlordName) b.landlordName = 'Landlord name is required';
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
    // Alaska: the notice question (now in the Quick Case Check) drives the
    // 14-vs-30-day deadline, so it must be answered.
    if (isAlaska && !formData.properNotice) {
      b.properNotice = 'Let us know whether you gave proper written notice \u2014 it changes the return deadline in Alaska.';
    }

    // Unit count sanity when shown (BLOCK only if they typed something invalid).
    if (showUnitCount && formData.buildingUnitCount !== '' && formData.buildingUnitCount !== 'unknown') {
      if (!/^\d+$/.test(formData.buildingUnitCount) || parseInt(formData.buildingUnitCount, 10) < 1) {
        b.buildingUnitCount = 'Enter the number of units as a whole number (1 or more), or check \u201cI\u2019m not sure.\u201d';
      }
    }

    // Situation length (BLOCK).
    if (!formData.situation || formData.situation.length < 50) {
      b.situation = 'Please provide at least 50 characters describing your situation';
    } else if (formData.situation.length > SITUATION_MAX) {
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

    setErrors(b);
    setWarnings(w);
    return { blocks: b, warns: w };
  };

  const runSubmit = async (opts?: { ackWeak?: boolean }) => {
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
      scrollToFirstIssue(blockKeys);
      return;
    }

    if (warnKeys.length > 0 && !warningsShown) {
      setWarningsShown(true);
      scrollToFirstIssue(warnKeys);
      return;
    }

    // Weak-case gate: show the acknowledgment modal once.
    const tier = computeTier();
    if (tier === 'weak' && !weakAcknowledged && !opts?.ackWeak) {
      setShowWeakModal(true);
      return;
    }

    const cleanedDeposit = parseDeposit(formData.depositAmount).value.toString();

    const payload = {
      ...formData,
      depositAmount: cleanedDeposit,
      city: composedCity,
      tenantAddress: composedTenant,
      landlordAddress: composedLandlord,
      rentalPropertyAddress: composedRental,
      // Derive the legacy Alaska notice flag from the case-check answer.
      gaveWrittenNotice: deriveGaveWrittenNotice(),
      // Record the assessed tier so the letter can calibrate its tone/demand.
      caseStrength: tier ?? '',
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

  const handleProceedAnyway = () => {
    setWeakAcknowledged(true);
    setShowWeakModal(false);
    runSubmit({ ackWeak: true });
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

  const fontVars = `${fraunces.variable} ${dmSans.variable}`;
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
  const tierStyles: Record<Tier, { box: string; icon: string; title: string; body: string }> = {
    strong: {
      box: 'border-[#15803D]/30 bg-[#15803D]/[0.06]',
      icon: '✅',
      title: 'Strong case',
      body: 'Your answers suggest solid legal standing. Your letter will argue firmly for the full return of your deposit.',
    },
    moderate: {
      box: 'border-amber-300 bg-amber-50',
      icon: '⚠️',
      title: 'Moderate case',
      body: 'Some factors may complicate your claim. Your letter will acknowledge them and argue for the legitimate (net) portion of your deposit.',
    },
    weak: {
      box: 'border-red-300 bg-red-50',
      icon: '🔴',
      title: 'Weak case',
      body: 'Based on your answers, your landlord may have valid offsets that meet or exceed your deposit. Your letter will still be generated, but it will be more measured in its demands. You may want to consider whether to proceed.',
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
            Most people finish in about two minutes. The more detail you give in the
            description, the stronger your letter.
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ============ CARD 1: RENTAL PROPERTY DETAILS ============ */}
          <div className={cardClass}>
            <div>
              <h3 className={`${sectionLabel} mb-2`}>Rental Property Details</h3>
              <p className="text-sm text-slate-600">
                Enter the rental you&apos;re writing about — the city and state set
                which laws your letter cites, so use the rental&apos;s location, not your
                current address.
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

            {/* NYC rent-stabilized */}
            {showRentStabilized && (
              <div className="pt-1">
                <label className={labelClass}>Is this a rent-stabilized apartment?</label>
                <div className="flex flex-wrap gap-4">
                  {[['yes', 'Yes'], ['no', 'No'], ['unknown', 'I don\u2019t know']].map(([v, l]) => (
                    <label key={v} className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="radio" value={v}
                        checked={formData.isRentStabilized === v}
                        onChange={(e) => handleInputChange('isRentStabilized', e.target.value)}
                        className="w-4 h-4 accent-[#B45309]" />
                      {l}
                    </label>
                  ))}
                </div>
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
                  How many rental units are in the building?
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
                  letter cites. Enter the exact number of units if you know it.
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

          {/* ============ CARD 2: YOUR MAILING ADDRESS ============ */}
          <div className={cardClass}>
            <div>
              <h3 className={`${sectionLabel} mb-2`}>Your current mailing address</h3>
              <p className="text-sm text-slate-600">
                Where the landlord&apos;s response and your deposit should be sent.
              </p>
            </div>
            <div id="f-tenantAddress">
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

          {/* ============ CARD 3: LANDLORD INFORMATION ============ */}
          <div className={cardClass}>
            <h3 className={sectionLabel}>Landlord information</h3>
            <div id="f-landlordName">
              <label className={labelClass}>
                Landlord / property manager name <span className="text-red-500">*</span>
              </label>
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
          </div>

          {/* ============ CARD 4: YOUR SITUATION ============ */}
          <div className={cardClass}>
            <div>
              <h3 className={`${sectionLabel} mb-2`}>Your situation</h3>
              <p className="text-sm text-slate-600">
                Select all that apply (optional). Hover the <span className="font-medium">i</span> on any
                option for a quick explanation.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SUB_TYPES.map(subtype => {
                const active = formData.subtypes.includes(subtype.id);
                return (
                  <button
                    key={subtype.id}
                    type="button"
                    onClick={() => toggleSubtype(subtype.id)}
                    className={`rounded-xl border-2 p-4 text-left transition ${
                      active
                        ? 'border-[#B45309] bg-[#B45309]/[0.06]'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{subtype.icon}</span>
                      <span className="text-sm font-medium text-slate-700">
                        {subtype.label}
                        <InfoTip text={subtype.tip} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ============ CARD 5: SPECIAL CIRCUMSTANCES ============ */}
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

          {/* ============ CARD 6: QUICK CASE CHECK ============ */}
          <div className={cardClass}>
            <div>
              <h3 className={`${sectionLabel} mb-2`}>Quick case check</h3>
              <p className="text-sm text-slate-600">
                Answer a few questions so we can tailor your letter — and flag anything
                that might affect your case before you pay. Your deposit is your money by
                default; these only matter if your landlord has a valid reason to keep part of it.
              </p>
            </div>

            {/* Q1 — itemization */}
            <div>
              <label className={labelClass}>
                Did your landlord provide any written itemization of deductions?
              </label>
              <div className="space-y-2">
                {[
                  ['yes_documented', 'Yes, with supporting documentation'],
                  ['yes_disputed', 'Yes, but I dispute the items listed'],
                  ['none', 'No \u2014 no itemization was provided'],
                ].map(([v, l]) => (
                  <label key={v} className={radioRow}>
                    <input type="radio" value={v}
                      checked={formData.itemizationProvided === v}
                      onChange={(e) => handleCaseChange('itemizationProvided', e.target.value)}
                      className="mt-0.5 w-4 h-4 accent-[#B45309]" />
                    {l}
                  </label>
                ))}
              </div>
            </div>

            {/* Q2 — condition */}
            <div>
              <label className={labelClass}>
                Did you leave the unit in the same or better condition than when you moved
                in (accounting for normal wear and tear)?
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
              {formData.unitCondition === 'damage' && (
                <div className="mt-3">
                  <label className={labelClass}>
                    Estimated repair cost, if you know it (optional)
                  </label>
                  <div className="relative max-w-xs">
                    <span className="absolute left-4 top-2.5 text-slate-500">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formData.damageEstimate}
                      onChange={(e) => handleCaseChange('damageEstimate', e.target.value)}
                      placeholder="e.g., 150"
                      className={`${inputClass(false)} pl-8`}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    You can also describe the damage in the &ldquo;Describe what happened&rdquo; box below.
                  </p>
                </div>
              )}
            </div>

            {/* Q3 — unpaid rent */}
            <div>
              <label className={labelClass}>
                Do you have any outstanding unpaid rent or fees owed to your landlord?
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
              {formData.unpaidRent === 'yes' && (
                <div className="mt-3">
                  <label className={labelClass}>Approximately how much?</label>
                  <div className="relative max-w-xs">
                    <span className="absolute left-4 top-2.5 text-slate-500">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formData.unpaidRentAmount}
                      onChange={(e) => handleCaseChange('unpaidRentAmount', e.target.value)}
                      placeholder="e.g., 500"
                      className={`${inputClass(false)} pl-8`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Q4 — proper notice (drives Alaska deadline; required there) */}
            <div id="f-properNotice">
              <label className={labelClass}>
                Did you give your landlord proper written notice before moving out (per your lease)?
                {isAlaska && <span className="text-red-500"> *</span>}
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
                  <label className={labelClass}>Did you give any notice at all?</label>
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
                </div>
              )}
              {errors.properNotice && <p className="mt-1 text-sm text-red-600">{errors.properNotice}</p>}
              {isAlaska && (
                <p className="mt-1 text-xs text-slate-500">
                  In Alaska, whether you gave proper written notice changes the return deadline.
                </p>
              )}
            </div>

            {/* Q5 — documentation */}
            <div>
              <label className={labelClass}>
                Did you document the unit&apos;s condition at move-in or move-out (photos,
                checklist, inspection report)?
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
            </div>

            {/* Inline assessment result */}
            {tier && (
              <div className={`rounded-xl border p-4 flex items-start gap-3 ${tierStyles[tier].box}`}>
                <div className="text-xl leading-none">{tierStyles[tier].icon}</div>
                <div>
                  <h4 className="font-semibold text-slate-900">{tierStyles[tier].title}</h4>
                  <p className="mt-1 text-sm text-slate-700">{tierStyles[tier].body}</p>
                </div>
              </div>
            )}
          </div>

          {/* ============ CARD 7: DESCRIPTION ============ */}
          <div id="f-situation" className={cardClass}>
            <div>
              <label className={`${labelClass} mb-1`}>
                Describe what happened <span className="text-red-500">*</span>
              </label>
              <p className="mb-3 text-sm text-slate-600">
                Include dates, amounts, and any communication with your landlord. The more
                detail, the stronger your letter.
              </p>
            </div>
            <textarea
              value={formData.situation}
              onChange={(e) => handleInputChange('situation', e.target.value)}
              placeholder="e.g., I moved out on March 1st after giving 30 days notice. My landlord has not returned my $2,400 deposit and it has now been 45 days. They have not provided any itemized deductions. The apartment was left in excellent condition."
              rows={6}
              maxLength={4000}
              className={`${inputClass(!!errors.situation)} resize-none`}
            />
            {errors.situation && <p className="mt-1 text-sm text-red-600">{errors.situation}</p>}
            <p className="text-xs text-slate-500">
              {formData.situation.length} / 50 characters minimum · 4,000 maximum
            </p>
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
        </form>
      </div>

      {/* ============ WEAK-CASE ACKNOWLEDGMENT MODAL ============ */}
      {showWeakModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="weak-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#E7E5E0] bg-white p-7 shadow-xl">
            <div className="text-2xl">🔴</div>
            <h2 id="weak-modal-title" className="mt-3 text-xl font-semibold text-slate-900" style={display}>
              Before you continue
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Based on your case-check answers, your landlord may have valid offsets that
              meet or exceed your deposit. A demand letter can still be sent, but it may
              not result in a refund.
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
              {weakReasons().map((r, i) => (<li key={i}>{r}</li>))}
            </ul>
            <label className="mt-5 flex items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={weakChecked}
                onChange={(e) => setWeakChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#B45309]"
              />
              I understand my case may be weak and want to generate the letter anyway.
            </label>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
              <button
                type="button"
                disabled={!weakChecked}
                onClick={handleProceedAnyway}
                className="flex-1 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Proceed anyway — $39
              </button>
              <button
                type="button"
                onClick={() => setShowWeakModal(false)}
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
