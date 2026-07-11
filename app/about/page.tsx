// app/about/page.tsx
//
// About / Methodology — E-E-A-T trust hub (MARKETING_TRACKER Task 2).
//
// Organization-authored by decision (July 11, 2026): no founder name/bio. The
// trust signal is the METHODOLOGY + statutory citations + per-state "last
// verified" dates + a real registered entity with a monitored support address.
// Schema is Organization (NOT Person) — this also seeds Task 6 (schema markup).
//
// ⚠️ STANDING RULE FOR THIS PAGE: every claim here must be literally true and
// verifiable on the live site. Section 3 says each state page NAMES the statute
// and SHOWS the date it was last checked — that is true because StatePage.tsx
// renders `statutes[].full` + `lastVerified`. It deliberately does NOT claim we
// LINK to primary sources: there are zero URLs in stateLawData.ts. Do not add
// that claim back without also adding the links AND rot monitoring.
//
// Deliberately absent (locked): no testimonials/reviews, no success-rate stats,
// no implied attorney review, no fabricated urgency.

import type { Metadata } from 'next';
import Link from 'next/link';
import SiteFooter from '@/app/components/SiteFooter'

export const metadata: Metadata = {
  // NOTE: root layout applies a `%s | TenantShield` title template — do NOT
  // append "| TenantShield" here or it renders doubled.
  title: 'About TenantShield — How We Verify the Law',
  description:
    'How TenantShield built its security deposit legal data: all 51 states, DC, and 15 city ordinances verified against primary statute text, with a last-verified date on every state page.',
  alternates: { canonical: 'https://gettenantshield.com/about' },
};

// ⚠️ NO Organization JSON-LD here. The root layout ALREADY emits a site-wide
// Organization schema (plus a Service schema) on every page — verified live
// July 11, 2026. Adding a second Organization block here produced TWO
// Organization entities on /about, which muddies entity parsing. If the
// Organization schema needs enriching (e.g. `sameAs`, `areaServed`), edit the
// one in the root layout so every page benefits — do not add one here.

export default function AboutPage() {
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
      <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#B45309]">About TenantShield</p>
        <h1 className="text-4xl font-medium tracking-tight text-slate-900 sm:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>
          How TenantShield works — and how we know the law is right.
        </h1>
        <p className="mt-6 text-lg text-slate-700">
          TenantShield turns your move-out details into a demand letter that cites the statute your
          landlord is actually bound by. This page explains exactly how we built the legal data behind
          it, where every number comes from, and what this tool does not do.
        </p>
        <div className="mt-8 space-y-4 text-slate-700">
          <p>
            Most tenants who never get their deposit back don&apos;t lose because they were wrong. They
            lose because they never sent anything, or they sent an angry email that cited nothing. A
            letter that names the statute, the deadline your landlord already missed, and the penalty
            they&apos;re exposed to is a different document — it tells a landlord the next step is small
            claims court, and it puts a date on it.
          </p>
          <p>
            That&apos;s the entire product. One letter, $39, no subscription.
          </p>
        </div>
      </section>

      {/* What TenantShield is not */}
      <section className="border-y border-[#E7E5E0] bg-white">
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
          <h2 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
            What TenantShield is not.
          </h2>
          <div className="mt-8 space-y-5 text-slate-700">
            <p>
              <strong className="text-slate-900">We are not a law firm, and we do not provide legal advice.</strong>{' '}
              Nothing on this site creates an attorney-client relationship. TenantShield is self-help
              software: you provide the facts, the app assembles a letter, you review it, and you decide
              whether to send it.
            </p>
            <p>
              <strong className="text-slate-900">No lawyer reviews your letter.</strong> Some services
              imply an attorney checks every document. We don&apos;t do that, so we don&apos;t claim it.
            </p>
            <p>
              <strong className="text-slate-900">We don&apos;t promise you&apos;ll get your money back.</strong>{' '}
              We have not published a &ldquo;success rate,&rdquo; because we don&apos;t have one we could
              honestly measure. Any service quoting a precise win rate for a letter it merely mailed
              should be asked how it verified the outcome.
            </p>
            <p>
              <strong className="text-slate-900">We don&apos;t file, mail, or represent you.</strong> You
              send the letter. You stay in control of every decision, including whether to sign it.
            </p>
            <p className="text-sm text-slate-600">
              You are always free to consult a licensed attorney in your state, and for some situations
              you should — see{' '}
              <a href="#when-to-see-a-lawyer" className="font-medium text-[#B45309] transition hover:text-[#92400E]">
                when a letter isn&apos;t the right tool
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Methodology */}
      <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
        <h2 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
          How we verified the law in every jurisdiction we cover.
        </h2>
        <div className="mt-8 space-y-6 text-slate-700">
          <p>
            Security deposit law is state law, and it is not uniform. Deadlines range from 14 days to 60.
            Some states start the clock at move-out; others start it when the tenant gives notice, or when
            the landlord finishes determining deductions. Some impose double or triple damages for a
            willful violation; others impose none. A handful of cities layer their own ordinance on top of
            the state rule.
          </p>
          <p>
            Getting that wrong is not a cosmetic error — it produces a letter that cites the wrong deadline
            to the one person motivated to notice.
          </p>
          <p>So we audited it, jurisdiction by jurisdiction.</p>

          <div className="space-y-5">
            <div className="rounded-lg border border-[#E7E5E0] bg-white p-5">
              <p className="font-medium text-slate-900">Coverage</p>
              <p className="mt-2 text-sm text-slate-600">
                All 51 state-level jurisdictions (50 states + the District of Columbia), plus 15 city-level
                ordinance overlays where a local rule meaningfully changes the state default.
              </p>
            </div>
            <div className="rounded-lg border border-[#E7E5E0] bg-white p-5">
              <p className="font-medium text-slate-900">Primary sources first</p>
              <p className="mt-2 text-sm text-slate-600">
                Every jurisdiction was verified against the statute text itself — the actual code section,
                not a summary of it. Where a legal summary site and the statute disagreed, the statute won.
                Every state page names the statute we verified against, and shows the date we last checked it.
              </p>
            </div>
            <div className="rounded-lg border border-[#E7E5E0] bg-white p-5">
              <p className="font-medium text-slate-900">Recent legislation tracked</p>
              <p className="mt-2 text-sm text-slate-600">
                Deposit law changed in several states across 2025&ndash;2026, and stale data is the most
                common failure mode in this category. Among others, we track California&apos;s AB 2801
                (photo documentation) and AB 414 (electronic refunds), Colorado&apos;s HB25-1249 (pre-suit
                notice), and the New York GOL &sect; 7-107 rent-stabilized carve-out.
              </p>
            </div>
            <div className="rounded-lg border border-[#E7E5E0] bg-white p-5">
              <p className="font-medium text-slate-900">One source of truth</p>
              <p className="mt-2 text-sm text-slate-600">
                The deadline shown on our homepage, the deadline on a state&apos;s page, and the deadline
                cited inside your letter are drawn from the same audited data — not maintained as separate
                hand-copied lists that quietly drift apart.
              </p>
            </div>
            <div className="rounded-lg border border-[#E7E5E0] bg-white p-5">
              <p className="font-medium text-slate-900">Nuance is preserved, not flattened</p>
              <p className="mt-2 text-sm text-slate-600">
                Where a state&apos;s rule genuinely branches — a different deadline depending on whether
                there were deductions, or a rule that only covers certain landlords — we show the branch
                instead of printing one tidy number that would be wrong for half the people reading it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Last verified */}
      <section className="border-y border-[#E7E5E0] bg-white">
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
          <h2 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
            Every jurisdiction carries a &ldquo;last verified&rdquo; date.
          </h2>
          <div className="mt-8 space-y-5 text-slate-700">
            <p>
              Legal data is only as good as the day it was last checked. Most sites never tell you that day,
              which means you cannot tell the difference between a page verified last month and one that has
              been rotting for years.
            </p>
            <p>
              Each state page on this site displays the date we last verified that jurisdiction against its
              primary source. That date means a human read the statute — it is not bumped automatically.
            </p>
            <p className="rounded-lg border border-[#E7E5E0] bg-[#FAFAF7] p-5 text-sm text-slate-600">
              <strong className="text-slate-900">If a law changed and we haven&apos;t caught it yet, tell us:</strong>{' '}
              <a href="mailto:support@gettenantshield.com" className="font-medium text-[#B45309] transition hover:text-[#92400E]">
                support@gettenantshield.com
              </a>
              . We&apos;d rather be corrected than be confidently wrong.
            </p>
          </div>
        </div>
      </section>

      {/* How the letter is generated */}
      <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
        <h2 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
          What happens after you enter your details.
        </h2>
        <p className="mt-8 text-slate-700">We&apos;d rather explain this than let you guess.</p>
        <ol className="mt-6 space-y-5 text-slate-700">
          <li>
            <strong className="text-slate-900">1. You describe your situation.</strong> Move-out date,
            deposit amount, what your landlord did or didn&apos;t do, whether you got an itemized list,
            what you&apos;re disputing.
          </li>
          <li>
            <strong className="text-slate-900">2. The app applies your jurisdiction&apos;s rule.</strong>{' '}
            Deadlines are computed by the application from your dates and the audited statutory rule — they
            are not guessed, and they are not left for a language model to do arithmetic on.
          </li>
          <li>
            <strong className="text-slate-900">3. The letter is drafted with AI assistance.</strong> We use
            a large language model to turn the verified legal facts and your case details into clear, firm,
            professional prose. We&apos;re telling you this outright, because a service that uses AI and
            implies a human wrote your letter is lying to you about the thing you&apos;re paying for.
          </li>
          <li>
            <strong className="text-slate-900">4. The legal content is constrained, not invented.</strong>{' '}
            The statute, deadline, and penalty in your letter come from the audited data described above —
            the model writes the letter around those facts; it does not source them.
          </li>
          <li>
            <strong className="text-slate-900">5. You review it before it goes anywhere.</strong> You get
            the letter as a PDF. You read it, you decide.
          </li>
        </ol>
        <p className="mt-8 rounded-lg border border-[#E7E5E0] bg-white p-5 text-sm text-slate-600">
          <strong className="text-slate-900">What this means honestly:</strong> AI is good at writing a
          clear, calm, well-organized demand letter. It is not good at knowing the law reliably. So we let
          it do the first job, and we did the second one ourselves — by hand, against the statutes.
        </p>
      </section>

      {/* When to see a lawyer */}
      <section id="when-to-see-a-lawyer" className="border-y border-[#E7E5E0] bg-white scroll-mt-8">
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
          <h2 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
            When a letter isn&apos;t the right tool.
          </h2>
          <div className="mt-8 space-y-5 text-slate-700">
            <p>
              A demand letter is a first move. It&apos;s the right first move in most deposit disputes, and
              it&apos;s often the last one you need. But it is not the right tool for everything, and
              we&apos;d rather say so than sell you a letter that can&apos;t help.
            </p>
            <p>Consider talking to a licensed attorney or your local legal aid office if:</p>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                Your dispute involves more than the deposit — an eviction on your record, retaliation, a
                habitability claim, or a counterclaim for unpaid rent or damages.
              </li>
              <li>Your landlord has already sued you, or sent you to collections.</li>
              <li>The amount at stake exceeds your state&apos;s small claims limit.</li>
              <li>You&apos;re facing discrimination or a disability accommodation issue.</li>
              <li>
                You&apos;ve already sent a demand letter and your landlord&apos;s response raised legal
                arguments you&apos;re not sure how to answer.
              </li>
            </ul>
            <p>
              Many tenants qualify for free help. Your state or county legal aid organization is a good
              first call, and it costs nothing to ask.
            </p>
          </div>
        </div>
      </section>

      {/* Who stands behind this */}
      <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
        <h2 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
          Who stands behind this.
        </h2>
        <div className="mt-8 space-y-5 text-slate-700">
          <p>
            TenantShield is operated by <strong className="text-slate-900">TenantShield LLC</strong>, a
            limited liability company registered in the State of Florida (filing number L26000278228).
          </p>
          <p>
            We are a small, independent operation — not a law firm, and not a marketplace that sells your
            information to one. We don&apos;t run ads on this site, we don&apos;t sell your data, and we
            don&apos;t route you to a lawyer for a referral fee.
          </p>
          <p className="rounded-lg border border-[#E7E5E0] bg-white p-5 text-sm text-slate-600">
            <strong className="text-slate-900">Our correction policy:</strong> if you find an error in our
            legal data, email{' '}
            <a href="mailto:support@gettenantshield.com" className="font-medium text-[#B45309] transition hover:text-[#92400E]">
              support@gettenantshield.com
            </a>{' '}
            and tell us. If you&apos;re right, we fix it and update that jurisdiction&apos;s
            &ldquo;last verified&rdquo; date. We will not quietly edit and pretend it was always correct.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#E7E5E0] bg-white">
        <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-24 text-center">
          <h2 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
            Check your state&apos;s rule — free.
          </h2>
          <p className="mt-4 text-slate-700">
            You don&apos;t have to buy anything to find out where you stand. Look up your state&apos;s
            deadline, statute, and penalty — if your landlord has already blown the deadline, you&apos;ll
            see it.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center rounded-md bg-[#B45309] px-7 py-3.5 text-base font-medium text-white transition hover:bg-[#92400E]"
          >
            Check my state&apos;s deposit rule →
          </Link>
        </div>
      </section>



      <SiteFooter />
    </div>
  );
}
