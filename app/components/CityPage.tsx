// app/components/CityPage.tsx
//
// Shared city-overlay page component (July 11, 2026). The city counterpart to
// StatePage.tsx: one presentational component that renders any PageCity from
// lib/stateLawData.ts, so city legal facts live in ONE audited place.
//
// Renders the two overlay types that get pages:
//   'replaces' → the city ordinance GOVERNS instead of the state default. Show
//                the CITY's deadline + penalty, and say plainly what it displaces.
//   'augments' → city duties STACK ON TOP of state law. BOTH apply.
//
// ⚠️ THE PORTLAND TRAP — the single most important rule in this file.
// For 'augments' cities the city penalty and the state penalty are SEPARATE
// remedies that BOTH apply. Portland is the canonical case: ORS 90.300's 2x is
// a different thing from PCC 30.01.087's $250/violation. They must NEVER be
// collapsed, summed, or presented as one number. This component therefore renders
// them as two visually distinct blocks, explicitly labelled, and shows
// `stateStillApplies` so the stacking is stated in words as well as layout.
// If you are tempted to "simplify" this into a single penalty card: don't.
//
// ⚠️ 'defers' cities never reach this component — they have no page by design.
// See the eligibility rule in lib/cityHelpers.ts.
//
// NOTE: cities carry no `copy` block (unlike states), so prose here is built from
// structured fields + notes. City pages are legitimately shorter than state pages.

import Link from 'next/link';
import type { Penalty } from '@/lib/stateLawData';
import {
  cityShortName,
  getParentState,
  type PageCity,
} from '@/lib/cityHelpers';
import {
  buildBreadcrumbSchema,
  buildCityFaqs,
  buildFaqSchema,
  cityBreadcrumbs,
} from '@/lib/schema';
import SiteFooter from './SiteFooter';

/** Same UTC-pinned formatter as StatePage — a bare ISO date parses as UTC
 *  midnight, so formatting it in a negative-offset zone would render the
 *  PREVIOUS day. Do not remove timeZone: 'UTC'. */
function formatVerifiedDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function PenaltyBlock({
  label,
  sublabel,
  penalty,
}: {
  label: string;
  sublabel: string;
  penalty: Penalty;
}) {
  return (
    <div className="rounded-xl border border-[#E7E5E0] bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#B45309]">{label}</p>
      <p
        className="mt-2 text-2xl font-medium text-slate-900"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {penalty.short}
      </p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{sublabel}</p>
      <p className="mt-3 text-sm text-slate-600">{penalty.long}</p>
      {penalty.attorneyFees && (
        <p className="mt-3 text-sm text-slate-600">Attorney&apos;s fees may also be recoverable.</p>
      )}
    </div>
  );
}

export default function CityPage({ city }: { city: PageCity }) {
  const c = city;
  const state = getParentState(c);
  const name = cityShortName(c);
  const stateHref = `/states/${state.slug}`;
  const faqs = buildCityFaqs(c);

  return (
    <div className="min-h-screen bg-[#FAFAF7]" style={{ fontFamily: 'var(--font-sans)' }}>

      {/* Structured data (Task 6). Organization + Service ship from the root
          layout — do NOT add them here. FAQPage is legitimate only because the
          same Q&A is rendered visibly below. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbSchema(cityBreadcrumbs(c))) }}
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
        <nav className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#B45309]">
          <Link href={stateHref} className="transition hover:text-[#92400E]">{state.name}</Link>
          <span className="text-slate-400">/</span>
          <span>{name}</span>
        </nav>
        <h1 className="text-4xl font-medium tracking-tight text-slate-900 sm:text-5xl md:text-6xl" style={{ fontFamily: 'var(--font-display)' }}>
          Get your security deposit back in {name}.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-700">{c.homepageSummary}</p>
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

      {/* REPLACES — the city ordinance governs instead of the state default */}
      {c.type === 'replaces' && (
        <>
          <section className="mx-auto max-w-4xl px-5 pb-16 sm:px-8">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-[#E7E5E0] bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Deadline</p>
                <p className="mt-2 text-2xl font-medium text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{c.deadlineLabel}</p>
                <p className="mt-1 text-sm text-slate-600">under the {name} ordinance</p>
              </div>
              <div className="rounded-xl border border-[#E7E5E0] bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Penalty</p>
                <p className="mt-2 text-2xl font-medium text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{c.penalty.short}</p>
                <p className="mt-1 text-sm text-slate-600">for a violation</p>
              </div>
              <div className="rounded-xl border border-[#E7E5E0] bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Ordinance</p>
                <p className="mt-2 text-2xl font-medium text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{c.statutes[0]?.label ?? '—'}</p>
                <p className="mt-1 text-sm text-slate-600">{name} municipal code</p>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-3xl px-5 pb-16 sm:px-8 sm:pb-20">
            <h2 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
              {name} has its own rule.
            </h2>
            <div className="mt-8 space-y-6 text-slate-700">
              <p className="rounded-lg border-l-4 border-[#B45309] bg-white p-5">
                <strong className="text-slate-900">This ordinance governs instead of the state default.</strong>{' '}
                {c.displaces}
              </p>
              <p>{c.penalty.long}</p>
              {c.penalty.attorneyFees && <p>Attorney&apos;s fees may also be recoverable.</p>}
            </div>
          </section>
        </>
      )}

      {/* AUGMENTS — city duties stack ON TOP of state law; BOTH apply.
          The two penalties are rendered as SEPARATE blocks. See the Portland
          trap note at the top of this file. */}
      {c.type === 'augments' && (
        <>
          <section className="mx-auto max-w-4xl px-5 pb-16 sm:px-8">
            <div className="rounded-xl border-l-4 border-[#B45309] bg-white p-6">
              <p className="text-sm font-medium text-slate-900">
                Both {state.name} law and {name}&apos;s ordinance apply to you.
              </p>
              <p className="mt-2 text-sm text-slate-600">{c.stateStillApplies}</p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <PenaltyBlock
                label={`${name} penalty`}
                sublabel="City ordinance — separate remedy"
                penalty={c.cityPenalty}
              />
              <PenaltyBlock
                label={`${state.name} penalty`}
                sublabel="State law — still applies"
                penalty={state.penalty}
              />
            </div>

            <p className="mt-4 text-sm text-slate-600">
              These are two distinct remedies under two different laws — they are not the same
              claim, and one does not replace the other. The {state.name} return deadline of{' '}
              <Link href={stateHref} className="font-medium text-[#B45309] transition hover:text-[#92400E]">
                {state.deadlineLabel}
              </Link>{' '}
              still applies.
            </p>
          </section>

          <section className="mx-auto max-w-3xl px-5 pb-16 sm:px-8 sm:pb-20">
            <h2 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
              What {name} adds on top.
            </h2>
            <ul className="mt-8 space-y-3 text-slate-700">
              {c.cityDuties.map((duty, i) => (
                <li key={i} className="rounded-lg border border-[#E7E5E0] bg-white p-5 text-sm">
                  {duty}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {/* Nuance notes */}
      {c.notes.length > 0 && (
        <section className="mx-auto max-w-3xl px-5 pb-16 sm:px-8 sm:pb-20">
          <div className="space-y-5 text-slate-700">
            {c.notes.map((note, i) => (
              <p key={i} className="rounded-lg border border-[#E7E5E0] bg-white p-5 text-sm text-slate-600">
                <strong className="text-slate-900">{note.heading}</strong> {note.body}
              </p>
            ))}
          </div>
        </section>
      )}

      {/* FAQ — VISIBLE. Required for the FAQPage schema above. */}
      {faqs.length > 0 && (
        <section className="mx-auto max-w-3xl px-5 pb-16 sm:px-8 sm:pb-20">
          <h2 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
            Common questions about {name} deposits.
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

      {/* Sources & verification */}
      {c.statutes.length > 0 && (
        <section className="mx-auto max-w-3xl px-5 pb-16 sm:px-8 sm:pb-20">
          <div className="rounded-xl border border-[#E7E5E0] bg-white p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Sources &amp; verification
            </p>
            <p className="mt-4 text-sm text-slate-600">
              The {name} rules on this page were verified against the ordinance text itself:
            </p>
            <ul className="mt-3 space-y-1.5">
              {c.statutes.map((s, i) => (
                <li key={i} className="text-sm font-medium text-slate-900">{s.full}</li>
              ))}
            </ul>
            <div className="mt-5 flex flex-col gap-2 border-t border-[#E7E5E0] pt-5 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-slate-600">
                Last verified against primary sources on{' '}
                <time dateTime={c.lastVerified} className="font-medium text-slate-900">
                  {formatVerifiedDate(c.lastVerified)}
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

      {/* Back to state */}
      <section className="border-y border-[#E7E5E0] bg-white">
        <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
          <p className="text-slate-700">
            {name} sits on top of {state.name}&apos;s statewide security deposit law.{' '}
            <Link href={stateHref} className="font-medium text-[#B45309] transition hover:text-[#92400E]">
              Read the full {state.name} rule →
            </Link>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-24 text-center">
        <h2 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
          Ready to get your deposit back?
        </h2>
        <p className="mt-4 text-slate-700">
          Your letter cites the {name} ordinance and the {state.name} statutes that apply to your situation.
        </p>
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
