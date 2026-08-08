// app/components/StatePage.tsx
//
// PROJECT K — Phase 3 shared state-page component.
//
// One presentational component that renders any `Jurisdiction` from
// lib/stateLawData.ts, reproducing the hand-built state-page design
// (the Texas page is the canonical reference). Every state page becomes a
// thin file that looks up its jurisdiction and passes it here, so the legal
// facts live in ONE audited place instead of 51 hardcoded copies.
//
// Handles all three jurisdiction types (simple / conditional / scope_gated):
//   - the Deadline quick-fact card and the deadline sentence adapt per type
//   - `notes` render as the bordered callout boxes the richer pages already use
//   - conditional branches render as a small table; scope_gated shows the
//     appliesTo / exemptFallback split
//
// Chrome (header/footer) is inlined to match the existing pages exactly —
// state pages do NOT use SiteChrome.
//
// JULY 11, 2026 — "Sources & verification" block added (E-E-A-T / Task 2).
//   Renders `statutes[].full` (the clean, customer-facing citations) and
//   `lastVerified`, and links to /about.
//
//   ⚠️ DO NOT render `primarySource` here. It is an INTERNAL audit-provenance
//   field and its prose contains notes never meant for customers — e.g. Oklahoma
//   carries "MEDIUM confidence on civil multiplier ... ambiguous" and Santa
//   Monica carries "§1803(f) cite corrected to §1803(s)". Publishing that would
//   undercut the exact credibility this block exists to build. `statutes[].full`
//   is the display field; `primarySource` is the audit trail.
//
//   ⚠️ Date formatting MUST pin timeZone: 'UTC'. `lastVerified` is a bare ISO
//   date ('2026-07-05'), which JS parses as UTC midnight — formatting it in a
//   negative-offset zone (e.g. US Eastern) would render the PREVIOUS day. Every
//   date on the site would silently be off by one.
//
// JULY 11, 2026 — "Local ordinances" section added.
//   Lists EVERY city overlay for this state, INCLUDING the 'defers' cities.
//   This is deliberate and load-bearing: 'defers' cities (Boston, Cambridge,
//   NYC, Philadelphia, Baltimore) get NO page of their own — a page could only
//   say "see the state page," which is a thin/doorway page. This section is how
//   they stay visible and useful without shipping a stub. See the page-
//   eligibility rule in lib/cityHelpers.ts before changing this.

import Link from 'next/link';
import type { Jurisdiction } from '@/lib/stateLawData';
import {
  getCitiesForState,
  cityHasPage,
  cityShortName,
  toCitySegment,
} from '@/lib/cityHelpers';
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildStateFaqs,
  stateBreadcrumbs,
} from '@/lib/schema';
import SiteFooter from './SiteFooter';

/** Format a bare ISO date ('2026-07-05') as 'July 5, 2026' without timezone drift. */
function formatVerifiedDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** U4 (Aug 2026): state slug → published sample-letter blog post. Ohio's post
 *  predates the naming convention — keep its slug as-is. Update this map when a
 *  new state post ships (it is the ONLY place the state→post mapping lives). */
const SAMPLE_POST_SLUGS: Record<string, string> = {
  florida: '/blog/sample-security-deposit-demand-letter-florida',
  ohio: '/blog/ohio-landlord-not-returned-security-deposit-30-days',
  texas: '/blog/sample-security-deposit-demand-letter-texas',
  arizona: '/blog/sample-security-deposit-demand-letter-arizona',
  'new-york': '/blog/sample-security-deposit-demand-letter-new-york',
  nevada: '/blog/sample-security-deposit-demand-letter-nevada',
  colorado: '/blog/sample-security-deposit-demand-letter-colorado',
  maryland: '/blog/sample-security-deposit-demand-letter-maryland',
  california: '/blog/sample-security-deposit-demand-letter-california',
  connecticut: '/blog/sample-security-deposit-demand-letter-connecticut',
  wisconsin: '/blog/sample-security-deposit-demand-letter-wisconsin',
  georgia: '/blog/sample-security-deposit-demand-letter-georgia',
  oregon: '/blog/sample-security-deposit-demand-letter-oregon',
  illinois: '/blog/sample-security-deposit-demand-letter-illinois',
};

export default function StatePage({ jurisdiction }: { jurisdiction: Jurisdiction }) {
  const j = jurisdiction;
  const cities = getCitiesForState(j.slug);
  const faqs = buildStateFaqs(j);

  return (
    <div className="min-h-screen bg-[#FAFAF7]" style={{ fontFamily: 'var(--font-sans)' }}>

      {/* Structured data (Task 6). Organization + Service already ship from the
          root layout — do NOT add them here. The FAQPage schema below is legal
          ONLY because the same Q&A is rendered visibly further down this page. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbSchema(stateBreadcrumbs(j))) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqSchema(faqs)) }}
      />

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
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#B45309]">{j.name} Tenants</p>
        <h1 className="text-4xl font-medium tracking-tight text-slate-900 sm:text-5xl md:text-6xl" style={{ fontFamily: 'var(--font-display)' }}>
          Get your security deposit back in {j.name}.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-700">
          {j.copy.heroSummary}
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
            <p className="mt-2 text-2xl font-medium text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{j.deadlineLabel}</p>
            <p className="mt-1 text-sm text-slate-600">to return your deposit after move-out</p>
          </div>
          <div className="rounded-xl border border-[#E7E5E0] bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Penalty</p>
            <p className="mt-2 text-2xl font-medium text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{j.penaltyCardLabel}</p>
            <p className="mt-1 text-sm text-slate-600">{j.penaltyCardSubtext}</p>
          </div>
          <div className="rounded-xl border border-[#E7E5E0] bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Statute</p>
            <p className="mt-2 text-2xl font-medium text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{j.statuteCardLabel}</p>
            <p className="mt-1 text-sm text-slate-600">{j.statuteCardSubtext}</p>
          </div>
        </div>
      </section>

      {/* What the law says */}
      <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
        <h2 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
          What {j.name} law actually says.
        </h2>
        <div className="mt-8 space-y-6 text-slate-700">
          <p>{j.copy.lawSummary}</p>

          {/* Conditional: show the branch table */}
          {j.type === 'conditional' && (
            <div className="overflow-hidden rounded-lg border border-[#E7E5E0]">
              {j.branches.map((b, i) => (
                <div
                  key={i}
                  className={
                    'flex flex-col gap-1 p-4 sm:flex-row sm:items-baseline sm:gap-4' +
                    (i > 0 ? ' border-t border-[#E7E5E0]' : '')
                  }
                >
                  <span className="shrink-0 font-medium text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>
                    {b.deadlineDays} days
                  </span>
                  <span className="text-sm text-slate-600">{b.condition}</span>
                </div>
              ))}
            </div>
          )}

          <p>{j.copy.penaltyLeadIn}</p>
          <ul className="ml-6 list-disc space-y-2">
            {j.copy.penaltyBullets.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          <p>{j.copy.penaltyExample}</p>

          {/* Scope-gated: appliesTo / exemptFallback split */}
          {j.type === 'scope_gated' && (
            <div className="rounded-lg border border-[#E7E5E0] bg-white p-5 text-sm text-slate-600">
              <p><strong className="text-slate-900">Who this covers:</strong> {j.scope.appliesTo}</p>
              <p className="mt-3"><strong className="text-slate-900">If it doesn&apos;t apply:</strong> {j.scope.exemptFallback}</p>
            </div>
          )}

          {/* Nuance notes → the bordered callout boxes */}
          {j.notes.map((note, i) => (
            <p key={i} className="rounded-lg border border-[#E7E5E0] bg-white p-5 text-sm text-slate-600">
              <strong className="text-slate-900">{note.heading}</strong> {note.body}
            </p>
          ))}
        </div>
      </section>

      {/* AUG 2026 CODE BATCH — U1: sample-letter preview + U4: blog cross-links.
          The skeleton is deliberately BRACKETED and asserts no penalty, fee, or
          deadline figure — same convention as the hub post's generic sample: the
          only per-state facts drawn in are `statutes[0].label` (guarded; some
          jurisdictions ship an empty statutes[] ) and the state name. The paid
          generator is what computes real figures. Styling is Tailwind-only by
          design — do NOT move this into globals.css (styles-scoping rule).
          SAMPLE_POST_SLUGS maps the states that have a published sample-letter
          blog post; states without one just get the hub + checker links. */}
      <section className="mx-auto max-w-3xl px-5 pb-16 sm:px-8">
        <h2 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
          What a {j.name} demand letter looks like.
        </h2>
        <p className="mt-6 text-slate-700">
          Every letter follows the structure courts expect &mdash; your facts, the statute, a
          specific demand, and a deadline. Here&apos;s the skeleton; the generator fills the
          brackets from your answers and computes {j.name}&apos;s deadlines
          {j.statutes.length > 0 ? <> under {j.statutes[0].label}</> : null}.
        </p>
        <div className="mt-8 rounded-xl border border-[#E7E5E0] bg-white p-6 text-sm leading-relaxed text-slate-700 sm:p-8">
          <p>[Date]</p>
          <p className="mt-4">[Your name]<br />[Your forwarding address]</p>
          <p className="mt-4">[Landlord&apos;s name and address]</p>
          <p className="mt-5 font-medium text-slate-900">RE: Security Deposit &mdash; Formal Demand for Return of $[Amount]</p>
          <p className="mt-5">
            I am the former tenant of [rental property address]. You accepted a security
            deposit of $[Amount], and my tenancy ended on [move-out date]. My forwarding
            address for return of the deposit is stated above, which I am providing to you
            in writing.
          </p>
          <p className="mt-4">
            Under {j.statutes.length > 0 ? j.statutes[0].label : '[the governing statute]'}, you were
            required to [return the deposit or provide an itemized statement] within [the
            statutory period]. That period has passed, and you have done neither. [The
            specific consequence {j.name} law attaches, cited by section.]
          </p>
          <p className="mt-4">
            I demand return of $[Amount] no later than [deadline]. If I do not receive it,
            I am prepared to pursue all remedies available under [statute], including
            filing suit in the appropriate court.
          </p>
          <p className="mt-5">Sincerely,<br />[Your name]</p>
        </div>
        <div className="mt-6 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
          {SAMPLE_POST_SLUGS[j.slug] && (
            <Link href={SAMPLE_POST_SLUGS[j.slug]} className="font-medium text-[#B45309] transition hover:text-[#92400E]">
              Read a complete {j.name} sample letter &rarr;
            </Link>
          )}
          <Link href="/blog/sample-security-deposit-demand-letter" className="font-medium text-[#B45309] transition hover:text-[#92400E]">
            Sample demand letters for every state &rarr;
          </Link>
          <Link href="/security-deposit-deadline-calculator" className="font-medium text-[#B45309] transition hover:text-[#92400E]">
            Check your {j.name} deadline free &rarr;
          </Link>
        </div>
      </section>

      {/* Local ordinances — every city overlay for this state, including the
          'defers' cities, which never get their own page by design. */}
      {cities.length > 0 && (
        <section className="border-y border-[#E7E5E0] bg-white">
          <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
            <h2 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
              Local ordinances in {j.name}.
            </h2>
            <p className="mt-6 text-slate-700">
              Some cities layer their own security deposit rules on top of state law &mdash; and some
              don&apos;t. Here&apos;s where {j.name}&apos;s major cities stand.
            </p>
            <div className="mt-8 space-y-4">
              {cities.map((c) => {
                const short = cityShortName(c);
                if (cityHasPage(c)) {
                  return (
                    <Link
                      key={c.slug}
                      href={`/states/${j.slug}/${toCitySegment(c.slug)}`}
                      className="block rounded-lg border border-[#E7E5E0] bg-[#FAFAF7] p-5 transition hover:border-[#B45309]"
                    >
                      <p className="font-medium text-slate-900">
                        {short}
                        <span className="ml-2 text-xs font-semibold uppercase tracking-widest text-[#B45309]">
                          {c.type === 'replaces' ? 'Own ordinance' : 'Extra local rules'}
                        </span>
                      </p>
                      <p className="mt-2 text-sm text-slate-600">{c.homepageSummary}</p>
                      <p className="mt-3 text-sm font-medium text-[#B45309]">See the {short} rule &rarr;</p>
                    </Link>
                  );
                }
                // 'defers' — no page. Label defaults to 'State law applies';
                // cardLabel overrides it where that default would mislead
                // (Evanston: 'Not yet covered' — its own ordinance is unverified).
                return (
                  <div key={c.slug} className="rounded-lg border border-[#E7E5E0] bg-[#FAFAF7] p-5">
                    <p className="font-medium text-slate-900">
                      {short}
                      <span className="ml-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
                        {c.cardLabel ?? 'State law applies'}
                      </span>
                    </p>
                    <p className="mt-2 text-sm text-slate-600">{c.homepageSummary}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* FAQ — VISIBLE. Required for the FAQPage schema above to be legitimate.
          Removing this section means removing that schema too. */}
      {faqs.length > 0 && (
        <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
          <h2 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
            Common questions about {j.name} deposits.
          </h2>
          <div className="mt-8 space-y-6">
            {faqs.map((f, i) => (
              <div key={i} className="rounded-lg border border-[#E7E5E0] bg-white p-5">
                <h3 className="font-medium text-slate-900">{f.q}</h3>
                <p className="mt-2 text-sm text-slate-600">{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sources & verification — E-E-A-T trust block (Task 2) */}
      {j.statutes.length > 0 && (
        <section className="mx-auto max-w-3xl px-5 pb-16 sm:px-8 sm:pb-20">
          <div className="rounded-xl border border-[#E7E5E0] bg-white p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Sources &amp; verification
            </p>

            <p className="mt-4 text-sm text-slate-600">
              The {j.name} rules on this page were verified against the statute text itself:
            </p>
            <ul className="mt-3 space-y-1.5">
              {j.statutes.map((s, i) => (
                <li key={i} className="text-sm font-medium text-slate-900">
                  {s.full}
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-col gap-2 border-t border-[#E7E5E0] pt-5 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-slate-600">
                Last verified against primary sources on{' '}
                <time dateTime={j.lastVerified} className="font-medium text-slate-900">
                  {formatVerifiedDate(j.lastVerified)}
                </time>
                .
              </p>
              <Link href="/about" className="shrink-0 font-medium text-[#B45309] transition hover:text-[#92400E]">
                How we verify this →
              </Link>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Laws change. If you spot something out of date, tell us at{' '}
              <a href="mailto:support@gettenantshield.com" className="underline transition hover:text-slate-700">
                support@gettenantshield.com
              </a>{' '}
              and we&apos;ll correct it.
            </p>
          </div>
        </section>
      )}

      {/* What TenantShield does */}
      <section className="bg-white border-y border-[#E7E5E0]">
        <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-20">
          <h2 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
            What you get for $39.
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="font-medium text-slate-900">A professional demand letter</h3>
              <p className="mt-2 text-sm text-slate-600">Properly formatted, addressed to your landlord by name, citing the exact {j.name} statutes that apply to your situation.</p>
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Specific statute citations</h3>
              <p className="mt-2 text-sm text-slate-600">{j.copy.statuteLine}</p>
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Calculated penalty math</h3>
              <p className="mt-2 text-sm text-slate-600">The letter computes the exact dollar amount you&apos;re entitled to demand based on your deposit and the deductions at issue.</p>
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
        <p className="mt-4 text-slate-700">Most {j.name} landlords return the deposit within days of receiving a properly drafted demand letter.</p>
        <Link
          href="/generate"
          className="mt-8 inline-flex items-center rounded-md bg-[#B45309] px-7 py-3.5 text-base font-medium text-white transition hover:bg-[#92400E]"
        >
          Generate my letter — $39
        </Link>
      </section>



      <SiteFooter />
    </div>
  );
}
