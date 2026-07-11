// lib/cityHelpers.ts
//
// City-overlay helpers (July 11, 2026). Additive — deliberately does NOT modify
// lib/stateLawData.ts, which is the audited legal-data file.
//
// ────────────────────────────────────────────────────────────────────────────
// THE PAGE-ELIGIBILITY RULE (a LOCKED decision — read before adding a city page)
//
//   'augments' → GETS A PAGE.  City duties stack ON TOP of state law. Real,
//                differentiated content (own penalty + own duties).
//   'replaces' → GETS A PAGE.  City ordinance governs instead of the state
//                default. Real content (own deadline + own penalty).
//   'defers'   → NEVER GETS A PAGE, BY DESIGN.  The city has no separate
//                deposit ordinance; state law simply governs. A page for one of
//                these could only say "see the state page" — a textbook thin /
//                doorway page. Google's thin-content guidance targets exactly
//                that, and it would undercut the credibility the /about page is
//                built on.
//
//   The 5 'defers' cities (Boston, Cambridge, NYC, Philadelphia, Baltimore) are
//   NOT dropped — they render in the "Local ordinances" section of their PARENT
//   STATE page, which is honest and useful without shipping a stub.
//
//   Yes, those five happen to be the highest-search-volume names in the set.
//   That does not change the analysis: a thin page cannot win those queries
//   anyway. Winning them needs genuinely unique local content (small-claims
//   process, filing fees, legal aid, the NY rent-stabilized carve-out) — that is
//   a CONTENT project, not a data-wiring one. Do not "fix" this by generating
//   defers pages from a template.
// ────────────────────────────────────────────────────────────────────────────
//
// URL ARCHITECTURE (locked): cities nest under their parent state —
//   /states/california/los-angeles      NOT  /cities/los-angeles-ca
// The data model already says a city is an overlay on a parent state
// (parentStateSlug is required), so the URL tells the truth about the law.
// It also makes BreadcrumbList trivial (Home > States > California > Los Angeles)
// and makes Portland-OR/Portland-ME collisions structurally impossible.
//
// Data slugs stay as-is ('los-angeles-ca'); the URL segment is DERIVED by
// stripping the trailing '-{st}'. All 15 slugs were verified to match that
// pattern before this was written.

import type { Metadata } from 'next';
import {
  CITY_OVERLAYS,
  getJurisdiction,
  type CityOverlay,
  type Jurisdiction,
} from '@/lib/stateLawData';

const SITE_URL = 'https://gettenantshield.com';

/** Mirrors the root layout's OG image — a per-page `openGraph` REPLACES the
 *  layout's (Next merges metadata shallowly), so the image must be re-stated. */
const OG_IMAGE = {
  url: `${SITE_URL}/og-image.png`,
  width: 1200,
  height: 630,
  alt: 'TenantShield — Get your security deposit back',
};

/** City types that get their own page. See the eligibility rule above. */
export type PageCity = Extract<CityOverlay, { type: 'augments' | 'replaces' }>;

/** True if this overlay gets its own page ('defers' never does). */
export function cityHasPage(c: CityOverlay): c is PageCity {
  return c.type === 'augments' || c.type === 'replaces';
}

/** 'los-angeles-ca' → 'los-angeles'. The URL segment under the parent state. */
export function toCitySegment(dataSlug: string): string {
  return dataSlug.replace(/-[a-z]{2}$/, '');
}

/** Display name without the state: 'Los Angeles, California' → 'Los Angeles'. */
export function cityShortName(c: CityOverlay): string {
  return c.name.split(',')[0].trim();
}

/** The 10 overlays that get pages (7 augments + 3 replaces). */
export function getPageCities(): PageCity[] {
  return CITY_OVERLAYS.filter(cityHasPage);
}

/** Every overlay belonging to a state — INCLUDING 'defers'. Used by the
 *  "Local ordinances" section on the state page, which is how defers cities
 *  stay visible without getting a page of their own. */
export function getCitiesForState(stateSlug: string): CityOverlay[] {
  return CITY_OVERLAYS.filter((c) => c.parentStateSlug === stateSlug);
}

/** Look a city up by its URL path, e.g. ('california', 'los-angeles'). */
export function getCityByPath(stateSlug: string, citySegment: string): PageCity | undefined {
  return getPageCities().find(
    (c) => c.parentStateSlug === stateSlug && toCitySegment(c.slug) === citySegment
  );
}

/** The parent Jurisdiction for a city overlay. Non-null for all 15 (verified). */
export function getParentState(c: CityOverlay): Jurisdiction {
  return getJurisdiction(c.parentStateSlug)!;
}

/** Canonical URL for a city page. */
export function cityUrl(c: CityOverlay): string {
  return `${SITE_URL}/states/${c.parentStateSlug}/${toCitySegment(c.slug)}`;
}

/**
 * Metadata for a city page. Mirrors lib/stateMetadata.ts.
 *
 * NOTE: do NOT append "| TenantShield" to `title` — the root layout applies a
 * `%s | TenantShield` template and it renders doubled.
 */
export function buildCityMetadata(c: PageCity): Metadata {
  const state = getParentState(c);
  const city = cityShortName(c);
  const url = cityUrl(c);

  const title = `Security Deposit Demand Letter ${city}, ${state.name}`;
  const description =
    c.type === 'replaces'
      ? `${city} has its own security deposit ordinance that governs instead of the ${state.name} default: a ${c.deadlineLabel} return deadline. See the rule, the penalty, and generate a demand letter for $39.`
      : `${city} adds its own security deposit rules on top of ${state.name} law — both apply. See the local duties, the separate city penalty, and generate a demand letter for $39.`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'TenantShield',
      type: 'website',
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [OG_IMAGE.url],
    },
  };
}
