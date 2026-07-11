// lib/stateMetadata.ts
//
// Shared metadata builder for the 51 state pages (Task 2 follow-on, July 11, 2026).
//
// WHY THIS EXISTS: state pages previously defined only `title`, `description`,
// and `alternates.canonical`. They set NO `openGraph`/`twitter`, so every state
// page inherited the ROOT LAYOUT's generic social tags:
//   - og:title / twitter:title  = "TenantShield — Get Your Security Deposit Back Today"
//   - og:url                    = "https://gettenantshield.com"  ← the HOMEPAGE
// Every state page shared one identical social preview, and every share resolved
// to the homepage instead of the state page. Verified live before the fix.
//
// ⚠️ THE TRAP THIS FILE EXISTS TO AVOID: Next.js merges metadata SHALLOWLY.
// A page that defines `openGraph` with only { title, description, url } does not
// merge with the layout's openGraph — it REPLACES it, silently dropping
// og:image, og:image:width/height/alt, and og:site_name. Same for `twitter`
// (drops twitter:card and twitter:image). So any per-page openGraph MUST re-state
// the image/site fields. Centralizing that here means it's stated once, not 51
// times, and a future change to the OG image is a one-line edit.
//
// TITLE/DESCRIPTION ARE PASSED IN, NOT GENERATED. These pages are already indexed
// in GSC, and the Project K "Option B" decision (July 9, 2026) locked their search
// copy as verbatim. This helper reuses the existing literals rather than
// regenerating them from a template — the social tags are new, the search copy is
// untouched.
//
// NOTE: do NOT append "| TenantShield" to `title` — the root layout applies a
// `%s | TenantShield` template and it will render doubled (fixed July 11, 2026).

import type { Metadata } from 'next';

const SITE_URL = 'https://gettenantshield.com';

/** Mirrors the root layout's OG image so per-page openGraph doesn't drop it. */
const OG_IMAGE = {
  url: `${SITE_URL}/og-image.png`,
  width: 1200,
  height: 630,
  alt: 'TenantShield — Get your security deposit back',
};

export function buildStateMetadata({
  slug,
  title,
  description,
}: {
  /** URL segment, e.g. 'texas' or 'district-of-columbia'. */
  slug: string;
  /** Existing verbatim page title — no "| TenantShield" suffix. */
  title: string;
  /** Existing verbatim meta description. */
  description: string;
}): Metadata {
  const url = `${SITE_URL}/states/${slug}`;

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
