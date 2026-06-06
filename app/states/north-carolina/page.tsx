import type { Metadata } from 'next';
import Link from 'next/link';

const STATE = 'North Carolina';
const DEADLINE = '30 days';
const STATUTE = 'NCGS § 42-52 & § 42-55';
const PENALTY = 'forfeiture of the right to withhold + attorney fees';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter North Carolina | TenantShield',
  description: 'Get your security deposit back in North Carolina. State-specific demand letter citing NCGS § 42-52 and § 42-55, the 30-day deadline, and the forfeiture remedy for noncompliance. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/north-carolina',
  },
};

export default function NorthCarolinaPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF7]" style={{ fontFamily: 'var(--font-sans)' }}>

      {/* Header */}
      <header className="border-b border-[#E7E5E0] bg-[#FAFAF7]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="text-xl font-medium text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>
            TenantShield
          </Link>
          <Link
            href="/generate"
            className="rounded-md bg-[#B45309] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#92400E]"
          >
            Generate letter
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-24">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#B45309]">{STATE} Tenants</p>
        <h1 className="text-4xl font-medium tracking-tight text-slate-900 sm:text-5xl md:text-6xl" style={{ fontFamily: 'var(--font-display)' }}>
          Get your security deposit back in {STATE}.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-700">
          A professional demand letter citing {STATE}&apos;s Tenant Security Deposit Act (NCGS &sect; 42-52 and &sect; 42-55), the 30-day return deadline, and the forfeiture remedy when a landlord fails to comply. Ready in minutes.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/generate"
            className="inline-flex items-center rounded-md bg-[#B45309] px-7 py-3.5 text-base font-medium text-white transition hover:bg-[#92400E]"
          >
            Generate my letter — $39
          </Link>
          <span className="text-sm text-slate-500">One-time payment. No subscription.</span>
        </div>
      </section>

      {/* Quick facts */}
      <section className="mx-auto max-w-4xl px-5 pb-16 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#E7E5E0] bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Deadline</p>
            <p className="mt-2 text-2xl font-medium text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{DEADLINE}</p>
            <p className="mt-1 text-sm text-slate-600">to return your deposit after move-out</p>
          </div>
          <div className="rounded-xl border border-[#E7E5E0] bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Remedy</p>
            <p className="mt-2 text-2xl font-medium text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>Forfeiture</p>
            <p className="mt-1 text-sm text-slate-600">landlord loses the right to keep any of it</p>
          </div>
          <div className="rounded-xl border border-[#E7E5E0] bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Statute</p>
            <p className="mt-2 text-2xl font-medium text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>&sect; 42-52</p>
            <p className="mt-1 text-sm text-slate-600">{STATE} General Statutes</p>
          </div>
        </div>
      </section>

      {/* What the law says */}
      <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
        <h2 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
          What {STATE} law actually says.
        </h2>
        <div className="mt-8 space-y-6 text-slate-700">
          <p>
            Under <strong>NCGS &sect; 42-52</strong>, your landlord has <strong>30 days</strong> after your tenancy ends to return your security deposit or provide a written, itemized accounting of deductions. If repairs genuinely cannot be assessed within 30 days, the landlord must send an interim accounting at 30 days and a final accounting within <strong>60 days</strong>.
          </p>
          <p>
            {STATE} does not use a 2&times; or 3&times; multiplier. Instead, the remedy under <strong>NCGS &sect; 42-55</strong> is strong in its own way: a landlord who willfully fails to comply with the deposit, accounting, or notice requirements <strong>forfeits the right to keep any portion of your deposit</strong>, and you may also recover:
          </p>
          <ul className="ml-6 list-disc space-y-2">
            <li>The <strong>full deposit</strong> back, regardless of any claimed deductions</li>
            <li><strong>Reasonable attorney&apos;s fees</strong></li>
          </ul>
          <p>
            So if your landlord blows the deadline or skips the required accounting, the deductions they tried to claim collapse &mdash; you are owed the <strong>entire deposit</strong>. Most landlords return it quickly once they realize their right to withhold has been forfeited.
          </p>
        </div>
      </section>

      {/* What TenantShield does */}
      <section className="bg-white border-y border-[#E7E5E0]">
        <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-20">
          <h2 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
            What you get for $39.
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="font-medium text-slate-900">A professional demand letter</h3>
              <p className="mt-2 text-sm text-slate-600">Properly formatted, addressed to your landlord by name, citing the exact {STATE} statutes that apply to your situation.</p>
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Specific statute citations</h3>
              <p className="mt-2 text-sm text-slate-600">NCGS &sect; 42-52, &sect; 42-55, and any others triggered by your circumstances &mdash; not generic legalese.</p>
            </div>
            <div>
              <h3 className="font-medium text-slate-900">The right legal theory</h3>
              <p className="mt-2 text-sm text-slate-600">The letter presses {STATE}&apos;s forfeiture remedy &mdash; that a noncompliant landlord loses the right to keep any of your deposit &mdash; plus your attorney fees.</p>
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Ready-to-send PDF</h3>
              <p className="mt-2 text-sm text-slate-600">Download instantly, print, sign, and send via USPS Certified Mail with Return Receipt.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-24 text-center">
        <h2 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
          Ready to get your deposit back?
        </h2>
        <p className="mt-4 text-slate-700">Most {STATE} landlords return the deposit within days of receiving a properly drafted demand letter.</p>
        <Link
          href="/generate"
          className="mt-8 inline-flex items-center rounded-md bg-[#B45309] px-7 py-3.5 text-base font-medium text-white transition hover:bg-[#92400E]"
        >
          Generate my letter — $39
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E7E5E0] bg-[#FAFAF7]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-6 sm:px-8">
          <Link href="/" className="text-base font-medium text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>TenantShield</Link>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
            <Link href="/terms" className="transition hover:text-slate-900">Terms</Link>
            <Link href="/privacy" className="transition hover:text-slate-900">Privacy</Link>
            <Link href="/refund" className="transition hover:text-slate-900">Refund Policy</Link>
            <a href="mailto:support@gettenantshield.com" className="transition hover:text-slate-900">Contact</a>
          </nav>
        </div>
        <div className="border-t border-[#E7E5E0]">
          <div className="mx-auto max-w-6xl px-5 py-5 text-xs text-slate-500 sm:px-8 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <span className="max-w-xl">&copy; {new Date().getFullYear()} TenantShield LLC. Not legal advice. The information provided does not, and is not intended to, constitute legal advice. For case-specific advice, consult a licensed attorney in your state.</span>
            <span className="shrink-0 text-slate-400">7901 4th St N Ste 300, St. Petersburg, FL 33702</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
