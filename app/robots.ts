import { MetadataRoute } from 'next'

// ---------------------------------------------------------------------------
// SEPTEMBER 2026 — added. Until now /robots.txt returned the 404 page.
//
// That was NOT blocking indexing: an absent robots.txt means "crawl
// everything," and Google already had the sitemap via Search Console. The
// reason this file exists is the crawlers that have no Search Console —
// Bing and the AI crawlers — which discover a sitemap primarily from the
// Sitemap: line below.
//
// Keep this DERIVED and minimal. The sitemap itself is generated in
// app/sitemap.ts from stateLawData.ts and getAllPosts(); do not duplicate
// any URL list here.
//
// Disallow list rationale — every entry verified to be a real route:
//   /api/       — endpoints, never useful in an index
//   /admin/     — the order + funnel surfaces (batch 10)
//   /success    — post-checkout confirmation; carries order context and must
//                 never be indexed
//   /dashboard  — the customer's own account page (Project E / Supabase auth)
//   /auth       — sign-in and password reset
// Everything else stays open: every state page, every city page, every blog
// post, the deadline checker, /generate, and the legal pages.
//
// This is a crawl directive, NOT a security control. /admin and /dashboard are
// protected by auth, and must stay that way — naming a path here tells a
// hostile reader it exists. Never rely on this file to hide anything.
// ---------------------------------------------------------------------------

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://gettenantshield.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/success', '/dashboard', '/auth'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
