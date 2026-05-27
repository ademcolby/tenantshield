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
    situation: '',
    subtypes: [] as string[],
    specialCircumstances: [] as string[],
    leaseDesignation: '',
    isRentStabilized: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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
    if (which === 'rental' && errors.rentalPropertyAddress) {
      setErrors(prev => ({ ...prev, rentalPropertyAddress: '' }));
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

  const validateForm = (composed: {
    city: string;
    rentalPropertyAddress: string;
  }) => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.state) newErrors.state = 'State is required';
    if (!composed.city) newErrors.city = 'City is required';
    if (!formData.tenantName) newErrors.tenantName = 'Your name is required';
    if (!formData.landlordName) newErrors.landlordName = 'Landlord name is required';
    if (!rentalAddr.street || !rentalAddr.city) {
      newErrors.rentalPropertyAddress = 'Rental property street and city are required';
    }
    if (!formData.vacatedDate) newErrors.vacatedDate = 'Move-out date is required';
    if (!formData.situation || formData.situation.length < 50) {
      newErrors.situation = 'Please provide at least 50 characters describing your situation';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Compose the split address sections back into the single string keys
    // the API contract expects. API + systemPrompt are unchanged.
    const composedTenant = composeAddress(tenantAddr);
    const composedLandlord = composeAddress(landlordAddr);
    const composedRental = composeAddress(rentalAddr);
    const composedCity = effectiveCity;

    if (!validateForm({ city: composedCity, rentalPropertyAddress: composedRental })) {
      return;
    }

    const payload = {
      ...formData,
      city: composedCity,
      tenantAddress: composedTenant,
      landlordAddress: composedLandlord,
      rentalPropertyAddress: composedRental,
    };

    setViewState('loading');
    localStorage.setItem('tenantshield_pending_form', JSON.stringify(payload));

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    opts: { required?: boolean }
  ) => (
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
          className={inputClass(which === 'rental' && !!errors.rentalPropertyAddress)}
        />
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass}>Apt / Unit</label>
        <input
          type="text"
          value={addr.unit}
          onChange={(e) => updateAddr(which, 'unit', e.target.value)}
          placeholder="Apt 4B"
          className={inputClass(false)}
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
          className={inputClass(which === 'rental' && !!errors.rentalPropertyAddress)}
        />
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass}>State</label>
        <select
          value={addr.state}
          onChange={(e) => updateAddr(which, 'state', e.target.value)}
          className={inputClass(false)}
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
          className={inputClass(false)}
        />
      </div>
    </div>
  );

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
          {/* LOCATION */}
          <div className={cardClass}>
            <h3 className={sectionLabel}>Location</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
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
              <div>
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
            <div>
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
            <div>
              <p className="mb-3 text-sm font-medium text-slate-700">
                Your current mailing address{' '}
                <span className="font-normal text-slate-500">(where the response should be sent)</span>
              </p>
              {renderAddressBlock('tenant', tenantAddr, {})}
            </div>
          </div>

          {/* LANDLORD INFORMATION */}
          <div className={cardClass}>
            <h3 className={sectionLabel}>Landlord information</h3>
            <div>
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
            <div>
              <p className="mb-3 text-sm font-medium text-slate-700">
                Landlord address{' '}
                <span className="font-normal text-slate-500">(if known)</span>
              </p>
              {renderAddressBlock('landlord', landlordAddr, {})}
            </div>
          </div>

          {/* RENTAL PROPERTY */}
          <div className={cardClass}>
            <h3 className={sectionLabel}>Rental property details</h3>
            <div>
              <p className="mb-3 text-sm font-medium text-slate-700">
                Address of the rental you moved out of{' '}
                <span className="text-red-500">*</span>
              </p>
              {renderAddressBlock('rental', rentalAddr, { required: true })}
              {errors.rentalPropertyAddress && (
                <p className="mt-2 text-sm text-red-600">{errors.rentalPropertyAddress}</p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Security deposit amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-slate-500">$</span>
                  <input
                    type="number"
                    value={formData.depositAmount}
                    onChange={(e) => handleInputChange('depositAmount', e.target.value)}
                    placeholder="2400"
                    min="0"
                    className={`${inputClass(false)} pl-8`}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>
                  Date you moved out <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.vacatedDate}
                  onChange={(e) => handleInputChange('vacatedDate', e.target.value)}
                  className={inputClass(!!errors.vacatedDate)}
                />
                {errors.vacatedDate && <p className="mt-1 text-sm text-red-600">{errors.vacatedDate}</p>}
              </div>
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
          <div className={cardClass}>
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
              className={`${inputClass(!!errors.situation)} resize-none`}
            />
            {errors.situation && <p className="mt-1 text-sm text-red-600">{errors.situation}</p>}
            <p className="text-xs text-slate-500">
              {formData.situation.length} / 50 characters minimum
            </p>
          </div>

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
