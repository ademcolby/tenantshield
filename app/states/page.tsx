// app/states/page.tsx
//
// THE /states HUB — built July 11, 2026.
//
// WHY THIS EXISTS (this is the important part — do not delete this page):
// Before this, /states was a 404 and EVERY ONE of the 51 state pages was an
// ORPHAN: a live check found ZERO crawlable <a> links to any /states/* URL from
// anywhere on the site. The homepage lookup is a <select> dropdown, and search
// engines do not follow links inside dropdowns. The blog — including the article
// literally titled "Security Deposit Return Deadlines — All 50 States" — linked
// to none of them either. The pages were indexed (via sitemap.xml) but received
// no internal link equity at all: a sitemap says a page EXISTS, a link says a
// page MATTERS.
//
// This page is the parent those 61 pages never had. It is also what makes the
// Home > States > {State} breadcrumb legitimate (schema.ts deliberately omitted
// the States node while this URL 404'd — a breadcrumb must never point at a dead
// URL).
//
// If you ever remove this page, you must ALSO revert the breadcrumb trails in
// lib/schema.ts and remove /states from app/sitemap.ts.

import type { Metadata } from 'next';
import Link from 'next/link';
import { JURISDICTIONS } from '@/lib/stateLawData';
import { getPageCities, cityShortName, toCitySegment, getParentState } from '@/lib/cityHelpers';
import { buildBreadcrumbSchema } from '@/lib/schema';
import SiteFooter from '@/app/components/SiteFooter'

const SITE_URL = 'https://gettenantshield.com';

// NOTE: root layout applies a `%s | TenantShield` title template — do NOT append
// the suffix here or it renders doubled.
export const metadata: Metadata = {
  title: 'Security Deposit Laws by State — All 50 States + DC',
  description:
    'Security deposit return deadlines, penalties, and statutes for all 50 states and Washington DC, plus 11 city ordinances. Every jurisdiction verified against primary sources.',
  alternates: { canonical: `${SITE_URL}/states` },
  openGraph: {
    title: 'Security Deposit Laws by State — All 50 States + DC',
    description:
      'Security deposit return deadlines, penalties, and statutes for all 50 states and Washington DC, plus 11 city ordinances.',
    url: `${SITE_URL}/states`,
    siteName: 'TenantShield',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'TenantShield — Get your security deposit back',
      },
    ],
  },
};

const breadcrumb = buildBreadcrumbSchema([
  { name: 'Home', url: SITE_URL },
  { name: 'States', url: `${SITE_URL}/states` },
]);

export default function StatesIndexPage() {
  const states = [...JURISDICTIONS].sort((a, b) => a.name.localeCompare(b.name));
  const cities = [...getPageCities()].sort((a, b) =>
    cityShortName(a).localeCompare(cityShortName(b))
  );

  return (
    <div className="min-h-screen bg-[#FAFAF7]" style={{ fontFamily: 'var(--font-sans)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
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
      <section className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-20">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#B45309]">By Jurisdiction</p>
        <h1 className="text-4xl font-medium tracking-tight text-slate-900 sm:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>
          Security deposit laws, state by state.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-700">
          Every state sets its own return deadline, penalty, and statute — and they are not
          alike. Pick your state to see the rule that actually binds your landlord, the date
          they had to meet, and what they owe you if they missed it.
        </p>
        <p className="mt-4 max-w-2xl text-sm text-slate-600">
          All 51 jurisdictions were verified against the statute text itself, and each page
          shows the date we last checked it.{' '}
          <Link href="/about" className="font-medium text-[#B45309] transition hover:text-[#92400E]">
            How we verify this →
          </Link>
        </p>
      </section>

      {/* All states */}
      <section className="border-y border-[#E7E5E0] bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <h2 className="text-2xl font-medium tracking-tight text-slate-900 sm:text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
            All 50 states + DC
          </h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {states.map((j) => (
              <Link
                key={j.slug}
                href={`/states/${j.slug}`}
                className="flex items-baseline justify-between gap-3 rounded-lg border border-[#E7E5E0] bg-[#FAFAF7] px-4 py-3 transition hover:border-[#B45309]"
              >
                <span className="font-medium text-slate-900">{j.name}</span>
                <span className="shrink-0 text-sm text-slate-500">{j.deadlineLabel}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* City ordinances */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <h2 className="text-2xl font-medium tracking-tight text-slate-900 sm:text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
          Cities with their own rules
        </h2>
        <p className="mt-4 max-w-2xl text-slate-700">
          A handful of cities layer their own ordinance on top of state law — or replace it
          outright. If you rented in one of these, the city rule may change your deadline, your
          penalty, or both.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {cities.map((c) => {
            const state = getParentState(c);
            return (
              <Link
                key={c.slug}
                href={`/states/${state.slug}/${toCitySegment(c.slug)}`}
                className="rounded-lg border border-[#E7E5E0] bg-white px-4 py-3 transition hover:border-[#B45309]"
              >
                <p className="font-medium text-slate-900">
                  {cityShortName(c)}
                  <span className="ml-2 text-xs font-normal text-slate-500">{state.name}</span>
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-[#B45309]">
                  {c.type === 'replaces' ? 'Own ordinance' : 'Extra local rules'}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#E7E5E0] bg-white">
        <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-24 text-center">
          <h2 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
            Ready to get your deposit back?
          </h2>
          <p className="mt-4 text-slate-700">
            Your letter cites the exact statute for your jurisdiction and the deadline your
            landlord missed.
          </p>
          <Link
            href="/generate"
            className="mt-8 inline-flex items-center rounded-md bg-[#B45309] px-7 py-3.5 text-base font-medium text-white transition hover:bg-[#92400E]"
          >
            Generate my letter — $39
          </Link>
        </div>
      </section>



      <SiteFooter />
    </div>
  );
}
