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
// date the tenant provided a forwarding/new mailing address. For these states
// the letter's deadline math needs that date, so the form surfaces an optional
// forwarding-address-date field when one of them is selected.
//   - Connecticut: 30 days OR 15 days after forwarding address, whichever is later
//   - South Dakota: 14-day clock runs from the later of move-out or forwarding address
//   - Iowa: 30-day clock starts on receipt of the mailing address
//   - Nebraska: 14-day clock runs after demand and designation of address
//   - Wyoming: 30 days OR 15 days after receipt of new mailing address, whichever is later
const FORWARDING_ADDRESS_STATES = [
  'Connecticut',
  'South Dakota',
  'Iowa',
  'Nebraska',
  'Wyoming',
];

// States whose statute applies only above a building unit-count threshold (or
// where unit count changes the rule), so the letter must know the building size:
//   - Illinois: Security Deposit Return Act applies only to 5+ unit landlords
//   - Arkansas: deposit statute applies only to 6+ unit / corporate landlords
//   - New York: 6+ unit buildings trigger the interest-bearing-account rule
const UNIT_COUNT_STATES = ['Illinois', 'Arkansas', 'New York'];

// Alaska's return deadline is 14 days if the tenant gave proper written notice
// of termination (and no damages are deducted) vs 30 days otherwise, so the
// letter needs to know whether proper notice was given.
const NOTICE_STATES = ['Alaska'];

// Maine's deadline is 21 days for a tenancy-at-will (no written lease) vs 30
// days under a written lease, so the letter needs the lease type.
const LEASE_TYPE_STATES = ['Maine'];

const SUB_TYPES = [
  { id: 'no_response', label: 'No response / total silence', icon: '📭' },
  { id: 'partial_no_itemization', label: 'Partial return without itemization', icon: '📄' },
  { id: 'partial_disputed_items', label: 'Partial return with disputed items', icon: '⚖️' },
  { id: 'full_withholding_vague', label: 'Full withholding with vague reasons', icon: '❌' },
  { id: 'late_notice', label: 'Late notice after deadline', icon: '⏰' },
  { id: 'wear_and_tear', label: 'Charged for normal wear and tear', icon: '🏠' },
  { id: 'preexisting_damage', label: 'Charged for pre-existing damage', icon: '📸' },
  { id: 'inflated_charges', label: 'Inflated repair charges', icon: '💰' },
  { id: 'forwarding_address', label: 'Forwarding address excuse', icon: '📮' },
  { id: 'escrow_violation', label: 'Deposit not properly held', icon: '🏦' }
];

const SPECIAL_CIRCUMSTANCES = [
  { id: 'multiple_tenants_on_lease', label: 'I had roommates on the lease' },
  { id: 'property_sold_during_tenancy', label: 'The property was sold during my tenancy' },
  { id: 'landlord_deceased_or_estate', label: 'The landlord has passed away' },
  { id: 'tenant_broke_lease_early', label: 'I broke the lease early' },
  { id: 'deposit_applied_to_last_rent', label: 'Landlord applied my deposit to last month\u2019s rent' },
  { id: 'non_refundable_cleaning_fee', label: 'I paid a non-refundable cleaning fee' },
  { id: 'tenant_admits_partial_damage', label: 'Some damage occurred but I dispute the amount' },
  { id: 'lease_expired_then_month_to_month', label: 'My lease ended and I went month-to-month' }
];

type ViewState = 'form' | 'loading' | 'result' | 'missing_info' | 'out_of_scope' | 'error';

interface AddressParts {
  street: string;
  unit: string;
  city: string;
  state: string;
  zip: string;
}

const emptyAddress: AddressParts = { street: '', unit: '', city: '', state: '', zip: '' };

// Compose 5 sub-fields into a single USPS-style string for the API.
// Returns '' when nothing meaningful was entered (preserves the
// "not provided" behavior the API/system prompt already expects).
function composeAddress(a: AddressParts): string {
  const line1 = [a.street, a.unit].filter(Boolean).join(', ');
  const abbr = a.state ? (STATE_ABBR[a.state] || a.state) : '';
  const cityStateZip = [a.city, [abbr, a.zip].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');
  return [line1, cityStateZip].filter(Boolean).join(', ').trim();
}

// --- Validation helpers (pure) ---

// Sanitize then validate a deposit amount. Strips a leading $ and commas, then
// requires digits with optional cents (no letters, no exponent, no symbols, no
// 3+ decimals) and a value greater than zero. Returns the parsed number.
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

// Parse a yyyy-mm-dd string into a LOCAL midnight Date (avoids the UTC
// off-by-one that new Date('yyyy-mm-dd') introduces).
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
    buildingUnitCount: '',
    gaveWrittenNotice: '',
    leaseType: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  // Amber, non-blocking notices (warn tier). Unlike errors, these don't stop
  // submission — but the customer must see them once before we proceed.
  const [warnings, setWarnings] = useState<{ [key: string]: string }>({});
  const [warningsShown, setWarningsShown] = useState(false);
  const todayISO = new Date().toISOString().slice(0, 10);

  // Effective city value: the typed value when "Other city" is selected,
  // otherwise the dropdown selection. This is what feeds the API + the
  // system prompt's sub-jurisdiction matching.
  const effectiveCity = citySelect === OTHER_CITY ? otherCity.trim() : citySelect;

  const baseCities = formData.state ? (CITIES_BY_STATE[formData.state] || []) : [];
  const cityOptions = formData.state ? [...baseCities, OTHER_CITY] : [];

  const showLeaseDesignation =
    ['Arizona', 'Washington', 'Oregon'].includes(formData.state) &&
    formData.specialCircumstances.includes('non_refundable_cleaning_fee');
  const showRentStabilized = effectiveCity === 'New York City';
  const showUnitCount = UNIT_COUNT_STATES.includes(formData.state);
  const showNotice = NOTICE_STATES.includes(formData.state);
  const showLeaseType = LEASE_TYPE_STATES.includes(formData.state);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    if (warnings[field]) setWarnings(prev => ({ ...prev, [field]: '' }));
  };

  const handleStateChange = (value: string) => {
    // Reset city when state changes (old city no longer valid).
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
    'state', 'city', 'tenantName', 'tenantAddress', 'landlordName', 'landlordAddress',
    'rentalPropertyAddress', 'depositAmount', 'vacatedDate', 'forwardingAddressDate',
    'buildingUnitCount', 'gaveWrittenNotice', 'leaseType', 'situation',
    'tenantZip', 'landlordZip', 'rentalZip', 'identicalParties',
  ];
  // Warn keys that don't have their own anchor map onto a nearby field's anchor.
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

  // Returns { blocks, warns }. Blocks stop submission; warns are amber and the
  // customer must acknowledge them once (a second click) before checkout.
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

    // Tenant mailing address (BLOCK) — this is the return address the letter uses.
    if (!(tenantAddr.street && tenantAddr.city && tenantAddr.state && tenantAddr.zip)) {
      b.tenantAddress =
        'Enter your full mailing address (street, city, state, ZIP) \u2014 this is the return address the letter tells your landlord to send your deposit to.';
    }

    // Deposit (BLOCK / WARN) — must resolve to a clean positive dollar value.
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
    if (showNotice && !formData.gaveWrittenNotice) {
      b.gaveWrittenNotice = `Let us know whether you gave written notice \u2014 it changes the deadline in ${formData.state}.`;
    }

    // Unit count sanity when shown (BLOCK only if they typed something invalid;
    // blank or "I'm not sure" is allowed and handled conditionally by the letter).
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Compose the split address sections back into the single string keys
    // the API contract expects. API + systemPrompt are unchanged.
    const composedTenant = composeAddress(tenantAddr);
    const composedLandlord = composeAddress(landlordAddr);
    const composedCity = effectiveCity;
    // The rental's city/state are taken from the top "Rental location" section
    // (the single source of truth that also drives jurisdiction). The rental
    // card only collects street/unit/zip, so merge them here for the printed
    // property address.
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

    // Blocks always stop us; fix those first.
    if (blockKeys.length > 0) {
      setWarningsShown(false);
      scrollToFirstIssue(blockKeys);
      return;
    }

    // No blocks, but unseen warnings: show them once and make the customer
    // click again to confirm — so they never pay before seeing a concern.
    if (warnKeys.length > 0 && !warningsShown) {
      setWarningsShown(true);
      scrollToFirstIssue(warnKeys);
      return;
    }

    // Normalize the deposit to a clean numeric string for the API + letter.
    const cleanedDeposit = parseDeposit(formData.depositAmount).value.toString();

    const payload = {
      ...formData,
      depositAmount: cleanedDeposit,
      city: composedCity,
      tenantAddress: composedTenant,
      landlordAddress: composedLandlord,
      rentalPropertyAddress: composedRental,
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
  const sectionLabel =
    'text-xs font-semibold uppercase tracking-widest text-[#B45309]';

  const renderAddressBlock = (
    which: 'tenant' | 'landlord' | 'rental',
    addr: AddressParts,
    opts: {
      required?: boolean;
      hideCityState?: boolean;
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
        {!opts.hideCityState && (
          <>
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
          </>
        )}
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
          {/* RENTAL LOCATION (single source of truth for jurisdiction) */}
          <div className={cardClass}>
            <div>
              <h3 className={`${sectionLabel} mb-2`}>Rental location</h3>
              <p className="text-sm text-slate-600">
                Where was the rental you&apos;re writing about located? This sets which
                state and local laws your letter cites — enter the rental&apos;s state and
                city, not your current address.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div id="f-state">
                <label className={labelClass}>State <span className="text-red-500">*</span></label>
                <select
                  value={formData.state}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className={inputClass(!!errors.state)}
                >
                  <option value="">Select state…</option>
                  {US_STATES.map(state => (<option key={state} value={state}>{state}</option>))}
                </select>
                {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
              </div>
              <div id="f-city">
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
                {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
              </div>
            </div>
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
            {showRentStabilized && (
              <div className="pt-2">
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
          </div>

          {/* YOUR INFORMATION */}
          <div className={cardClass}>
            <h3 className={sectionLabel}>Your information</h3>
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
            <div id="f-tenantAddress">
              <p className="mb-3 text-sm font-medium text-slate-700">
                Your current mailing address{' '}
                <span className="font-normal text-slate-500">(where the response should be sent)</span>
              </p>
              {renderAddressBlock('tenant', tenantAddr, {
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

          {/* LANDLORD INFORMATION */}
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

          {/* RENTAL PROPERTY */}
          <div className={cardClass}>
            <h3 className={sectionLabel}>Rental property details</h3>
            <div id="f-rentalPropertyAddress">
              <p className="mb-3 text-sm font-medium text-slate-700">
                Address of the rental you moved out of{' '}
                <span className="text-red-500">*</span>
              </p>
              {renderAddressBlock('rental', rentalAddr, {
                required: true,
                hideCityState: true,
                fieldErrors: { street: !!errors.rentalPropertyAddress },
                warnMessage: warnings.rentalZip,
              })}
              {errors.rentalPropertyAddress && (
                <p className="mt-2 text-sm text-red-600">{errors.rentalPropertyAddress}</p>
              )}
              <p className="mt-2 text-xs text-slate-500">
                City and state are taken from the rental location at the top of the form.
              </p>
            </div>
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
              {showNotice && (
                <div id="f-gaveWrittenNotice">
                  <label className={labelClass}>
                    Did you give your landlord proper written notice that you were moving out?
                  </label>
                  <div className="space-y-2">
                    {[
                      ['yes', 'Yes, I gave written notice'],
                      ['no', 'No / I\u2019m not sure'],
                    ].map(([v, l]) => (
                      <label key={v} className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="radio"
                          value={v}
                          checked={formData.gaveWrittenNotice === v}
                          onChange={(e) => handleInputChange('gaveWrittenNotice', e.target.value)}
                          className="w-4 h-4 accent-[#B45309]"
                        />
                        {l}
                      </label>
                    ))}
                  </div>
                  {errors.gaveWrittenNotice && <p className="mt-1 text-sm text-red-600">{errors.gaveWrittenNotice}</p>}
                  <p className="mt-1 text-xs text-slate-500">
                    In {formData.state}, whether you gave proper notice affects the return
                    deadline that applies.
                  </p>
                </div>
              )}
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
          </div>

          {/* YOUR SITUATION */}
          <div className={cardClass}>
            <div>
              <h3 className={`${sectionLabel} mb-2`}>Your situation</h3>
              <p className="text-sm text-slate-600">
                Select all that apply (optional — or just describe below)
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
                      <span className="text-sm font-medium text-slate-700">{subtype.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SPECIAL CIRCUMSTANCES */}
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
                  <span className="text-sm text-slate-700">{circumstance.label}</span>
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

          {/* DESCRIPTION */}
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
    </div>
  );
}
