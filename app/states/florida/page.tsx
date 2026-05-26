import type { Metadata } from 'next';
import Link from 'next/link';

const STATE = 'Florida';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter Florida | TenantShield',
  description: 'Get your security deposit back in Florida. State-specific demand letter citing Florida Statutes § 83.49, the 30-day notice rule, and 15-day tenant response window. Generated in 60 seconds for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/florida',
  },
};

export default function FloridaPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF7]" style={{ fontFamily: 'var(--font-sans)' }}>

      <header className="border-b border-[#E7E5E0] bg-[#FAFAF7]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="text-xl font-medium text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>TenantShield</Link>
          <Link href="/generate" className="rounded-md bg-[#B45309] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#92400E]">Generate letter</Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-24">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#B45309]">{STATE} Tenants</p>
        <h1 className="text-4xl font-medium tracking-tight text-slate-900 sm:text-5xl md:text-6xl" style={{ fontFamily: 'var(--font-display)' }}>
          Get your security deposit back in {STATE}.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-700">
          A professional demand letter citing {STATE} Statutes &sect; 83.49, the strict 30-day notice rule, and your statutory rights. Generated in 60 seconds.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link href="/generate" className="inline-flex items-center rounded-md bg-[#B45309] px-7 py-3.5 text-base font-medium text-white transition hover:bg-[#92400E]">Generate my letter — $39</Link>
          <span className="text-sm text-slate-500">One-time payment. No subscription.</span>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-16 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#E7E5E0] bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Landlord deadline</p>
            <p className="mt-2 text-2xl font-medium text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>30 days</p>
            <p className="mt-1 text-sm text-slate-600">to send written notice of deductions</p>
          </div>
          <div className="rounded-xl border border-[#E7E5E0] bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Your response</p>
            <p className="mt-2 text-2xl font-medium text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>15 days</p>
            <p className="mt-1 text-sm text-slate-600">to object in writing</p>
          </div>
          <div className="rounded-xl border border-[#E7E5E0] bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Statute</p>
            <p className="mt-2 text-2xl font-medium text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>&sect; 83.49</p>
            <p className="mt-1 text-sm text-slate-600">{STATE} Statutes</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
        <h2 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>What {STATE} law actually says.</h2>
        <div className="mt-8 space-y-6 text-slate-700">
          <p>
            Under <strong>{STATE} Statutes &sect; 83.49</strong>, your landlord has <strong>30 days</strong> from the date you vacate to send you a written notice by certified mail listing any intended deductions. If the landlord <strong>fails to send this notice within 30 days</strong>, they <strong>forfeit the right to make any deductions</strong> and must return the full deposit.
          </p>
          <p>
            If you receive a notice of deductions you disagree with, you have <strong>15 days</strong> to send a written objection. {STATE} is unusual in placing this affirmative response burden on the tenant &mdash; missing the window can weaken your position in court.
          </p>
          <p>
            Your strongest leverage in {STATE}:
          </p>
          <ul className="ml-6 list-disc space-y-2">
            <li>If the landlord missed the 30-day notice deadline, they owe the <strong>full deposit back</strong> regardless of any actual damage</li>
            <li>Deductions must be specifically itemized &mdash; vague "repairs" or "cleaning" claims are insufficient</li>
            <li>Normal wear and tear is not deductible under {STATE} law</li>
            <li>The prevailing party in a deposit dispute may recover <strong>attorney&apos;s fees</strong></li>
          </ul>
        </div>
      </section>

      <section className="bg-white border-y border-[#E7E5E0]">
        <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-20">
          <h2 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>What you get for $39.</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div><h3 className="font-medium text-slate-900">A professional demand letter</h3><p className="mt-2 text-sm text-slate-600">Properly formatted, addressed to your landlord by name, citing the exact {STATE} statutes that apply.</p></div>
            <div><h3 className="font-medium text-slate-900">Specific statute citations</h3><p className="mt-2 text-sm text-slate-600">{STATE} Statutes &sect; 83.49 with reference to the specific subsection that supports your claim.</p></div>
            <div><h3 className="font-medium text-slate-900">Forfeiture language</h3><p className="mt-2 text-sm text-slate-600">If your landlord missed the 30-day deadline, the letter invokes statutory forfeiture of their right to withhold.</p></div>
            <div><h3 className="font-medium text-slate-900">Ready-to-send PDF</h3><p className="mt-2 text-sm text-slate-600">Download instantly, print, sign, and send via USPS Certified Mail with Return Receipt.</p></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-24 text-center">
        <h2 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>Ready to get your deposit back?</h2>
        <p className="mt-4 text-slate-700">Most {STATE} landlords return the deposit within days of receiving a properly drafted demand letter.</p>
        <Link href="/generate" className="mt-8 inline-flex items-center rounded-md bg-[#B45309] px-7 py-3.5 text-base font-medium text-white transition hover:bg-[#92400E]">Generate my letter — $39</Link>
      </section>

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
          <div className="mx-auto max-w-6xl px-5 py-5 text-xs text-slate-500 sm:px-8 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span>&copy; {new Date().getFullYear()} TenantShield LLC. Not legal advice. The information provided does not, and is not intended to, constitute legal advice. For case-specific advice, consult a licensed attorney in your state.</span>
            <span className="shrink-0 text-slate-400">7901 4th St N Ste 300, St. Petersburg, FL 33702</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
