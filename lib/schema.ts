// lib/schema.ts
//
// Structured data (Task 6) — July 11, 2026.
//
// SCOPE NOTE: Organization + Service schema ALREADY ship site-wide from the root
// layout. Do not add a second Organization block on any page — two Organization
// entities on one URL muddies entity parsing (this exact mistake was made and
// caught on /about, July 11, 2026). This file covers the PER-PAGE gap:
// BreadcrumbList and FAQPage.
//
// ⚠️ FAQPage RULE — THE ONE THAT MATTERS.
// Google's structured-data policy requires marked-up content to be VISIBLE on
// the page. FAQPage markup with no visible FAQ section is spam markup and is a
// manual-action risk. So these FAQs are NOT invisible metadata: StatePage.tsx and
// CityPage.tsx RENDER them as a real, readable FAQ section, and the schema simply
// describes what's already on screen. If you ever remove the visible FAQ section,
// you MUST remove the FAQPage schema with it.
//
// (FAQ rich results were deprecated in Google's SERP display, but FAQPage still
// carries indexing / AI-extraction value — which is the actual goal here.)
//
// ⚠️ BREADCRUMB RULE. Every breadcrumb item must point at a URL that EXISTS.
// The /states hub was built on July 11, 2026 (it previously 404'd, which is why
// the States node was originally omitted). The trails are now:
//     state page → Home > States > {State}
//     city page  → Home > States > {State} > {City}
// If app/states/page.tsx is ever deleted, REVERT these trails — a breadcrumb
// pointing at a dead URL is worse than a shorter trail.
//
// All answers are derived from lib/stateLawData.ts, so the FAQ can never drift
// from the audited legal facts on the rest of the page.

import type { Jurisdiction } from '@/lib/stateLawData';
import {
  cityShortName,
  getCitiesForState,
  getParentState,
  toCitySegment,
  type PageCity,
} from '@/lib/cityHelpers';

const SITE_URL = 'https://gettenantshield.com';

export interface Faq {
  q: string;
  a: string;
}

interface Crumb {
  name: string;
  url: string;
}

/** BreadcrumbList JSON-LD from an ordered trail. */
export function buildBreadcrumbSchema(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
}

/** FAQPage JSON-LD. Only call this when the same Q&A is VISIBLY rendered. */
export function buildFaqSchema(faqs: Faq[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

// ---------------------------------------------------------------------------
// State pages
// ---------------------------------------------------------------------------

export function stateBreadcrumbs(j: Jurisdiction): Crumb[] {
  return [
    { name: 'Home', url: SITE_URL },
    { name: 'States', url: `${SITE_URL}/states` },
    { name: j.name, url: `${SITE_URL}/states/${j.slug}` },
  ];
}

export function buildStateFaqs(j: Jurisdiction): Faq[] {
  const faqs: Faq[] = [];

  // 1. Deadline — type-aware, so conditional/scope-gated states aren't flattened
  //    into a single misleading number.
  let deadlineAnswer: string;
  if (j.type === 'conditional') {
    const branches = j.branches
      .map((b) => `${b.deadlineDays} days ${b.condition}`)
      .join('; ');
    deadlineAnswer = `It depends on the circumstances: ${branches}. ${j.triggerSummary}`;
  } else if (j.type === 'scope_gated') {
    deadlineAnswer = `${j.deadlineLabel}, where the statute applies. ${j.scope.appliesTo} ${j.scope.exemptFallback}`;
  } else {
    deadlineAnswer = `${j.deadlineLabel} after you move out.`;
  }
  faqs.push({
    q: `How long does a landlord have to return a security deposit in ${j.name}?`,
    a: deadlineAnswer,
  });

  // 2. Penalty
  faqs.push({
    q: `What is the penalty if a ${j.name} landlord wrongfully withholds a deposit?`,
    a: j.penalty.long,
  });

  // 3. Statute
  faqs.push({
    q: `Which law covers security deposits in ${j.name}?`,
    a: `${j.statutes.map((s) => s.full).join(' and ')}. We verify these against the statute text itself; the date we last checked is shown on this page.`,
  });

  // 4. City overlays, if any — includes 'defers' cities, honestly.
  const cities = getCitiesForState(j.slug);
  if (cities.length > 0) {
    const withRules = cities.filter((c) => c.type !== 'defers').map(cityShortName);
    const deferring = cities.filter((c) => c.type === 'defers').map(cityShortName);
    const parts: string[] = [];
    if (withRules.length) {
      parts.push(
        `${withRules.join(', ')} ${withRules.length === 1 ? 'has' : 'have'} local ordinance rules on top of (or instead of) the state default.`
      );
    }
    if (deferring.length) {
      parts.push(
        `${deferring.join(', ')} ${deferring.length === 1 ? 'has' : 'have'} no separate deposit ordinance — ${j.name} state law applies.`
      );
    }
    faqs.push({
      q: `Do any cities in ${j.name} have their own security deposit rules?`,
      a: parts.join(' '),
    });
  }

  return faqs;
}

// ---------------------------------------------------------------------------
// City pages
// ---------------------------------------------------------------------------

export function cityBreadcrumbs(c: PageCity): Crumb[] {
  const state = getParentState(c);
  return [
    { name: 'Home', url: SITE_URL },
    { name: 'States', url: `${SITE_URL}/states` },
    { name: state.name, url: `${SITE_URL}/states/${state.slug}` },
    { name: cityShortName(c), url: `${SITE_URL}/states/${state.slug}/${toCitySegment(c.slug)}` },
  ];
}

export function buildCityFaqs(c: PageCity): Faq[] {
  const state = getParentState(c);
  const city = cityShortName(c);
  const faqs: Faq[] = [];

  if (c.type === 'replaces') {
    faqs.push({
      q: `How long does a landlord have to return a security deposit in ${city}?`,
      a: `${c.deadlineLabel}, under the ${city} ordinance. ${c.displaces}`,
    });
    faqs.push({
      q: `What is the penalty for a deposit violation in ${city}?`,
      a: c.penalty.long,
    });
  } else {
    // 'augments' — BOTH laws apply. Keep the two penalties separate (Portland trap).
    faqs.push({
      q: `Does ${state.name} state law still apply in ${city}?`,
      a: `Yes. ${c.stateStillApplies}`,
    });
    faqs.push({
      q: `What extra rules does ${city} add?`,
      a: c.cityDuties.join(' '),
    });
    faqs.push({
      q: `What is the ${city} penalty for a deposit violation?`,
      a: `${c.cityPenalty.long} This is a separate remedy from the ${state.name} state penalty, which also applies: ${state.penalty.long}`,
    });
  }

  faqs.push({
    q: `Which law covers security deposits in ${city}?`,
    a: `${c.statutes.map((s) => s.full).join(' and ')}. We verify these against the ordinance text itself; the date we last checked is shown on this page.`,
  });

  return faqs;
}
