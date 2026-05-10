'use client';

import { useState } from 'react';

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

const MAJOR_CITIES: { [key: string]: string[] } = {
  'California': ['San Francisco', 'Los Angeles', 'Berkeley', 'West Hollywood', 'Santa Monica', 'Oakland', 'Other city in California'],
  'Illinois': ['Chicago', 'Cook County (outside Chicago)', 'Evanston', 'Other city in Illinois'],
  'New York': ['New York City', 'Other city in New York'],
  'Washington': ['Seattle', 'Tacoma', 'Other city in Washington'],
  'Oregon': ['Portland', 'Eugene', 'Other city in Oregon'],
  'Massachusetts': ['Boston', 'Cambridge', 'Other city in Massachusetts'],
  'District of Columbia': ['Washington DC']
};

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
  { id: 'deposit_applied_to_last_rent', label: 'Landlord applied my deposit to last month\'s rent' },
  { id: 'non_refundable_cleaning_fee', label: 'I paid a non-refundable cleaning fee' },
  { id: 'tenant_admits_partial_damage', label: 'Some damage occurred but I dispute the amount' },
  { id: 'lease_expired_then_month_to_month', label: 'My lease ended and I went month-to-month' }
];

type ViewState = 'form' | 'loading' | 'result' | 'missing_info' | 'out_of_scope' | 'error';

export default function SecurityDepositForm() {
  const [viewState, setViewState] = useState<ViewState>('form');
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

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

  const citiesForState = formData.state ? (MAJOR_CITIES[formData.state] || [`Other city in ${formData.state}`]) : [];
  const showLeaseDesignation = ['Arizona', 'Washington', 'Oregon'].includes(formData.state) &&
    formData.specialCircumstances.includes('non_refundable_cleaning_fee');
  const showRentStabilized = formData.city === 'New York City';

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
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

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.tenantName) newErrors.tenantName = 'Your name is required';
    if (!formData.landlordName) newErrors.landlordName = 'Landlord name is required';
    if (!formData.rentalPropertyAddress) newErrors.rentalPropertyAddress = 'Rental property address is required';
    if (!formData.vacatedDate) newErrors.vacatedDate = 'Move-out date is required';
    if (!formData.situation || formData.situation.length < 50) {
      newErrors.situation = 'Please provide at least 50 characters describing your situation';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setViewState('loading');
    localStorage.setItem('tenantshield_pending_form', JSON.stringify(formData));

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

  if (viewState === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 relative">
            <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-serif font-semibold text-slate-900 mb-2">
            Redirecting to secure checkout...
          </h2>
          <p className="text-slate-600 text-sm">
            You&apos;ll be taken to Stripe to complete your $39 payment. After payment, your letter will be generated automatically.
          </p>
        </div>
      </div>
    );
  }

  if (viewState === 'result') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">📋</span>
                </div>
                <h1 className="text-2xl font-serif font-semibold text-slate-900">TenantShield</h1>
              </div>
              <button onClick={handleStartOver} className="text-sm text-slate-600 hover:text-slate-900 underline">
                Start a new letter
              </button>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <div className="text-green-600 text-2xl">✓</div>
              <div>
                <h3 className="font-semibold text-green-900">Your demand letter is ready</h3>
                <p className="text-sm text-green-800">Review it below, then copy and send via certified mail.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Your Demand Letter</h3>
              <button onClick={handleCopy} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2">
                {copied ? '✓ Copied!' : '📋 Copy Letter'}
              </button>
            </div>
            <div className="p-8 font-serif text-slate-900 whitespace-pre-wrap leading-relaxed">
              {generatedLetter}
            </div>
          </div>

          <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Next steps</h3>
            <ol className="space-y-3 text-sm text-slate-700">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center font-semibold text-xs">1</span>
                <div><strong>Print and sign</strong> the letter with blue or black ink.</div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center font-semibold text-xs">2</span>
                <div><strong>Send via USPS Certified Mail</strong> with Return Receipt. Keep your tracking number.</div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center font-semibold text-xs">3</span>
                <div><strong>Wait for the deadline</strong> stated in the letter. Most landlords respond once they realize you know the law.</div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center font-semibold text-xs">4</span>
                <div><strong>If no response</strong>, file in small claims court. This letter becomes key evidence.</div>
              </li>
            </ol>
          </div>

          <div className="mt-6 text-center">
            <button onClick={handleStartOver} className="px-6 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors">
              Generate Another Letter
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (viewState === 'missing_info') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-yellow-600 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-serif font-semibold text-slate-900 mb-3">More information needed</h2>
          <pre className="text-slate-700 text-sm whitespace-pre-wrap mb-6 font-sans">{errorMessage}</pre>
          <button onClick={handleStartOver} className="w-full px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
            Go back to form
          </button>
        </div>
      </div>
    );
  }

  if (viewState === 'out_of_scope') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-blue-600 text-4xl mb-4">ℹ️</div>
          <h2 className="text-xl font-serif font-semibold text-slate-900 mb-3">This isn&apos;t quite the right fit</h2>
          <pre className="text-slate-700 text-sm whitespace-pre-wrap mb-6 font-sans">{errorMessage}</pre>
          <button onClick={handleStartOver} className="w-full px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
            Go back to form
          </button>
        </div>
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-red-600 text-4xl mb-4">❌</div>
          <h2 className="text-xl font-serif font-semibold text-slate-900 mb-3">Something went wrong</h2>
          <p className="text-slate-700 mb-6">{errorMessage}</p>
          <button onClick={handleStartOver} className="w-full px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">📋</span>
            </div>
            <h1 className="text-2xl font-serif font-semibold text-slate-900">TenantShield</h1>
          </div>
          <h2 className="text-3xl font-serif font-bold text-slate-900 mb-3">
            Get your security deposit back.
          </h2>
          <p className="text-lg text-slate-600">
            Describe your situation. We generate a state-specific demand letter with real legal citations — ready to send.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm text-slate-700">✓ All 50 states + DC</div>
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm text-slate-700">✓ Real statute citations</div>
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm text-slate-700">✓ Ready in 60 seconds</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">State <span className="text-red-500">*</span></label>
                <select value={formData.state} onChange={(e) => handleInputChange('state', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 ${errors.state ? 'border-red-500' : 'border-slate-300'}`}>
                  <option value="">Select state...</option>
                  {US_STATES.map(state => (<option key={state} value={state}>{state}</option>))}
                </select>
                {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">City <span className="text-red-500">*</span></label>
                <select value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)} disabled={!formData.state}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100 disabled:cursor-not-allowed ${errors.city ? 'border-red-500' : 'border-slate-300'}`}>
                  <option value="">Select city...</option>
                  {citiesForState.map(city => (<option key={city} value={city}>{city}</option>))}
                </select>
                {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
              </div>
            </div>
            {showRentStabilized && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Is this a rent-stabilized apartment?</label>
                <div className="flex gap-4">
                  <label className="flex items-center"><input type="radio" value="yes" checked={formData.isRentStabilized === 'yes'} onChange={(e) => handleInputChange('isRentStabilized', e.target.value)} className="mr-2" />Yes</label>
                  <label className="flex items-center"><input type="radio" value="no" checked={formData.isRentStabilized === 'no'} onChange={(e) => handleInputChange('isRentStabilized', e.target.value)} className="mr-2" />No</label>
                  <label className="flex items-center"><input type="radio" value="unknown" checked={formData.isRentStabilized === 'unknown'} onChange={(e) => handleInputChange('isRentStabilized', e.target.value)} className="mr-2" />I don&apos;t know</label>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Your Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Your full name <span className="text-red-500">*</span></label>
                <input type="text" value={formData.tenantName} onChange={(e) => handleInputChange('tenantName', e.target.value)} placeholder="Jane Smith"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 ${errors.tenantName ? 'border-red-500' : 'border-slate-300'}`} />
                {errors.tenantName && <p className="mt-1 text-sm text-red-600">{errors.tenantName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Your current address</label>
                <input type="text" value={formData.tenantAddress} onChange={(e) => handleInputChange('tenantAddress', e.target.value)} placeholder="123 Main St, City, State"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Landlord Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Landlord / property manager name <span className="text-red-500">*</span></label>
                <input type="text" value={formData.landlordName} onChange={(e) => handleInputChange('landlordName', e.target.value)} placeholder="John Doe or ABC Property Mgmt"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 ${errors.landlordName ? 'border-red-500' : 'border-slate-300'}`} />
                {errors.landlordName && <p className="mt-1 text-sm text-red-600">{errors.landlordName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Landlord address (if known)</label>
                <input type="text" value={formData.landlordAddress} onChange={(e) => handleInputChange('landlordAddress', e.target.value)} placeholder="456 Oak Ave, City, State"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Rental Property Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Rental property address <span className="text-red-500">*</span></label>
                <input type="text" value={formData.rentalPropertyAddress} onChange={(e) => handleInputChange('rentalPropertyAddress', e.target.value)} placeholder="789 Elm St, Apt 4B, City, State"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 ${errors.rentalPropertyAddress ? 'border-red-500' : 'border-slate-300'}`} />
                {errors.rentalPropertyAddress && <p className="mt-1 text-sm text-red-600">{errors.rentalPropertyAddress}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Security deposit amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-2 text-slate-500">$</span>
                  <input type="number" value={formData.depositAmount} onChange={(e) => handleInputChange('depositAmount', e.target.value)} placeholder="2400" min="0"
                    className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date you moved out <span className="text-red-500">*</span></label>
                <input type="date" value={formData.vacatedDate} onChange={(e) => handleInputChange('vacatedDate', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 ${errors.vacatedDate ? 'border-red-500' : 'border-slate-300'}`} />
                {errors.vacatedDate && <p className="mt-1 text-sm text-red-600">{errors.vacatedDate}</p>}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-2">Your Situation</h3>
              <p className="text-sm text-slate-600">Select all that apply (optional — or just describe below)</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SUB_TYPES.map(subtype => (
                <button key={subtype.id} type="button" onClick={() => toggleSubtype(subtype.id)}
                  className={`p-4 text-left border-2 rounded-lg transition-all ${formData.subtypes.includes(subtype.id) ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{subtype.icon}</span>
                    <span className="text-sm font-medium text-slate-700">{subtype.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-2">Special Circumstances</h3>
              <p className="text-sm text-slate-600">Select any that apply (optional)</p>
            </div>
            <div className="space-y-2">
              {SPECIAL_CIRCUMSTANCES.map(circumstance => (
                <label key={circumstance.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input type="checkbox" checked={formData.specialCircumstances.includes(circumstance.id)} onChange={() => toggleSpecialCircumstance(circumstance.id)} className="w-4 h-4" />
                  <span className="text-sm text-slate-700">{circumstance.label}</span>
                </label>
              ))}
            </div>
            {showLeaseDesignation && (
              <div className="pt-4 border-t border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-3">Does your lease specifically state in writing that this fee is non-refundable?</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2"><input type="radio" value="yes_designated" checked={formData.leaseDesignation === 'yes_designated'} onChange={(e) => handleInputChange('leaseDesignation', e.target.value)} className="w-4 h-4" /><span className="text-sm text-slate-700">Yes, my lease has that specific written designation</span></label>
                  <label className="flex items-center gap-2"><input type="radio" value="no_not_designated" checked={formData.leaseDesignation === 'no_not_designated'} onChange={(e) => handleInputChange('leaseDesignation', e.target.value)} className="w-4 h-4" /><span className="text-sm text-slate-700">No, my lease doesn&apos;t say that</span></label>
                  <label className="flex items-center gap-2"><input type="radio" value="unknown" checked={formData.leaseDesignation === 'unknown'} onChange={(e) => handleInputChange('leaseDesignation', e.target.value)} className="w-4 h-4" /><span className="text-sm text-slate-700">I don&apos;t know / I don&apos;t have my lease handy</span></label>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Describe what happened <span className="text-red-500">*</span></label>
              <p className="text-sm text-slate-600 mb-3">Include dates, amounts, and any communication with your landlord. The more detail, the better.</p>
            </div>
            <textarea value={formData.situation} onChange={(e) => handleInputChange('situation', e.target.value)}
              placeholder="e.g., I moved out on March 1st after giving 30 days notice. My landlord has not returned my $2,400 deposit and it has now been 45 days. They have not provided any itemized deductions. The apartment was left in excellent condition."
              rows={6}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none ${errors.situation ? 'border-red-500' : 'border-slate-300'}`} />
            {errors.situation && <p className="mt-1 text-sm text-red-600">{errors.situation}</p>}
            <p className="text-xs text-slate-500">{formData.situation.length} / 50 characters minimum</p>
          </div>

          <button type="submit" className="w-full bg-slate-900 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-slate-800 transition-colors">
            Generate My Demand Letter — $39
          </button>
          <p className="text-center text-sm text-slate-500">No subscription. Complete package with certified mail instructions.</p>
        </form>
      </div>
    </div>
  );
}
