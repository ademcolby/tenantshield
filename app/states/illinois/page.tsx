import type { Metadata } from 'next';
import Link from 'next/link';

const STATE = 'Illinois';
const DEADLINE = '45 days';
const STATUTE = '765 ILCS 710';
const PENALTY = '2× wrongfully withheld amount + court costs + attorney fees';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter Illinois | TenantShield',
  description: 'Get your security deposit back in Illinois. State-specific demand letter citing the Security Deposit Return Act (765 ILCS 710), the 45-day deadline, and the 2x bad-faith penalty. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/illinois',
  },
};

export default function IllinoisPage() {
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
          A professional demand letter citing the {STATE} Security Deposit Return Act ({STATUTE}), the 45-day return deadline, and the double-damages penalty for bad-faith withholding. Ready in minutes.
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
            <p className="mt-2 text-2xl font-medium text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>2&times; damages</p>
            <p className="mt-1 text-sm text-slate-600">for bad-faith withholding under {STATUTE}</p>
          </div>
          <div className="rounded-xl border border-[#E7E5E0] bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Statute</p>
            <p className="mt-2 text-2xl font-medium text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>765 ILCS 710</p>
            <p className="mt-1 text-sm text-slate-600">Security Deposit Return Act</p>
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
            Under the <strong>{STATE} Security Deposit Return Act ({STATUTE})</strong>, your landlord must give you an itemized statement of any damages within <strong>30 days</strong> of move-out, and return your deposit (or the balance) within <strong>45 days</strong> of move-out.
          </p>
          <p>
            If the landlord withholds your deposit in <strong>bad faith</strong> &mdash; for example, refusing to return it, providing no itemization, or making clearly improper deductions &mdash; you may recover:
          </p>
          <ul className="ml-6 list-disc space-y-2">
            <li><strong>Two times</strong> the amount wrongfully withheld</li>
            <li><strong>Court costs</strong></li>
            <li><strong>Reasonable attorney&apos;s fees</strong></li>
          </ul>
          <p>
            So a $1,500 deposit wrongfully withheld can support a court judgment of <strong>$3,000 plus court costs and fees</strong>. Most landlords settle quickly once they realize you know the law.
          </p>
          <p className="rounded-lg border border-[#E7E5E0] bg-white p-5 text-sm text-slate-600">
            <strong className="text-slate-900">Important scope note:</strong> The {STATUTE} Act applies only to landlords who own buildings with <strong>5 or more units</strong>. If your building has 4 or fewer units, your demand rests on your lease and common-law contract rights (or a local ordinance such as Chicago, Cook County, or Evanston). Your letter is written to reflect whichever applies to your situation.
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
              <p className="mt-2 text-sm text-slate-600">The {STATE} Security Deposit Return Act ({STATUTE}) and any local ordinance triggered by your circumstances &mdash; not generic legalese.</p>
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Calculated penalty math</h3>
              <p className="mt-2 text-sm text-slate-600">The letter states the exact dollar amount you&apos;re entitled to demand &mdash; deposit + 2&times; wrongful withholding + court costs and fees.</p>
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
