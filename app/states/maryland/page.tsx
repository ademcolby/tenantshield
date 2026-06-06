// app/states/maryland/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';

const STATE = 'Maryland';
const DEADLINE = '45 days';
const STATUTE = 'MD Real Property § 8-203';
const PENALTY = 'up to 3× wrongfully withheld amount + attorney fees';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter Maryland | TenantShield',
  description: 'Get your security deposit back in Maryland. State-specific demand letter citing MD Real Property § 8-203, the 45-day deadline, and the up-to-3x penalty for withholding without a reasonable basis. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/maryland',
  },
};

export default function MarylandPage() {
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
          A professional demand letter citing {STATE}&apos;s security deposit law (Real Property &sect; 8-203), the 45-day return deadline, and the up-to-triple-damages penalty for withholding without a reasonable basis. Ready in minutes.
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
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Penalty</p>
            <p className="mt-2 text-2xl font-medium text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>up to 3&times;</p>
            <p className="mt-1 text-sm text-slate-600">for withholding without a reasonable basis</p>
          </div>
          <div className="rounded-xl border border-[#E7E5E0] bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Statute</p>
            <p className="mt-2 text-2xl font-medium text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>&sect; 8-203</p>
            <p className="mt-1 text-sm text-slate-600">{STATE} Real Property Code</p>
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
            Under <strong>{STATUTE}</strong>, your landlord has <strong>45 days</strong> after your tenancy ends to return your security deposit, with any accrued interest, along with a written, itemized list of any deductions.
          </p>
          <p>
            If the landlord withholds your deposit <strong>without a reasonable basis</strong>, you may recover:
          </p>
          <ul className="ml-6 list-disc space-y-2">
            <li><strong>Up to three times</strong> the amount wrongfully withheld</li>
            <li><strong>Reasonable attorney&apos;s fees</strong></li>
          </ul>
          <p>
            So a $1,500 deposit wrongfully withheld can support a court judgment of up to <strong>$4,500 plus fees</strong>. Most landlords settle quickly once they realize you know the law.
          </p>
          <p className="rounded-lg border border-[#E7E5E0] bg-white p-5 text-sm text-slate-600">
            <strong className="text-slate-900">Good to know:</strong> {STATE} caps security deposits at <strong>one month&apos;s rent</strong> and requires the deposit to earn interest, paid at the greater of the prevailing rate or 1.5% per year for deposits held at least six months.
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
              <p className="mt-2 text-sm text-slate-600">{STATUTE} and any others triggered by your circumstances &mdash; not generic legalese.</p>
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Calculated penalty math</h3>
              <p className="mt-2 text-sm text-slate-600">The letter states the exact dollar amount you&apos;re entitled to demand &mdash; deposit + up to 3&times; wrongful withholding + fees.</p>
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
