import { MetadataRoute } from 'next'
import { JURISDICTIONS } from '@/lib/stateLawData'
import { getPageCities, toCitySegment } from '@/lib/cityHelpers'
import { getAllPosts } from '@/lib/posts'

// ---------------------------------------------------------------------------
// JULY 11, 2026 — rewritten to DERIVE from lib/stateLawData.ts.
//
// This file used to hardcode all 51 state slugs by hand. That made it a FOURTH
// copy of jurisdiction data (alongside systemPrompt.ts, stateLawData.ts, and the
// now-deleted stateDeadlines.ts) — and the one place where drift is silent:
// forget to add a slug here and the page simply never gets discovered by Google.
// It now maps over JURISDICTIONS, so a new state is in the sitemap the moment
// it's in the data. Do NOT reintroduce a hardcoded list.
//
// `lastModified` for state/city pages uses the jurisdiction's own `lastVerified`
// date rather than `new Date()`. Stamping every URL with the build time claims
// every page changed on every deploy, which is false and trains crawlers to
// ignore the signal. `lastVerified` is the date the content actually last
// changed, which is what lastmod is for.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// OCT 31, 2026 — TEMPLATE FLOORS.
//
// lastVerified (state/city) and publishedAt/updatedAt (blog) only move when the
// legal facts or a post's own text change. But the SHARED TEMPLATES those pages
// render through have changed since — and every page's real HTML changed with
// them. Google showed the cost: 32 pages went "Crawled - currently not indexed"
// (Sept 18 - Oct 22), most last crawled in June/July, i.e. judged on versions
// that predate the hub, footer links, FAQ, sources block and preview. A sitemap
// still saying "unchanged since July 20" gave crawlers no reason to come back.
//
// So each page's lastmod = the LATER of its own content date and the date its
// template last changed in a reader-visible way. This is still a true "this
// page's HTML last changed on" date — NOT build time, NOT new Date().
//
// ⚠️ BUMP THESE BY HAND when the template materially changes (new section,
// new links, new schema) — never on copy tweaks, never automatically.
// ⚠️ This does NOT touch lastVerified. That field stays a manual, human-audit
// claim (MARKETING_TRACKER standing rule); this is a separate signal.
// ---------------------------------------------------------------------------
// StatePage.tsx / CityPage.tsx: U1 letter preview + U4 cross-links (e6664ec).
const STATE_TEMPLATE_UPDATED = '2026-08-08'
// app/blog/[slug]/page.tsx: FAQPage + BreadcrumbList schema, outbound statute
// links in new tab (23306e5).
const BLOG_TEMPLATE_UPDATED = '2026-09-06'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://gettenantshield.com'

  // Bare ISO date ('2026-07-05') → Date at UTC midnight. Parsing without the
  // explicit Z can drift a day backwards in negative-offset timezones.
  const asDate = (iso: string) => new Date(`${iso}T00:00:00Z`)

  // Later of two bare ISO dates (YYYY-MM-DD strings sort chronologically).
  const later = (a: string, b: string) => (a > b ? a : b)

  const statePages: MetadataRoute.Sitemap = JURISDICTIONS.map((j) => ({
    url: `${baseUrl}/states/${j.slug}`,
    lastModified: asDate(later(j.lastVerified, STATE_TEMPLATE_UPDATED)),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  // Only the 11 cities that HAVE pages (9 augments + 2 replaces, post-correction
  // batch). The 'defers' cities (incl. Evanston, retired to 'Not yet covered')
  // have no page by design — see the eligibility rule in lib/cityHelpers.ts.
  const cityPages: MetadataRoute.Sitemap = getPageCities().map((c) => ({
    url: `${baseUrl}/states/${c.parentStateSlug}/${toCitySegment(c.slug)}`,
    lastModified: asDate(later(c.lastVerified, STATE_TEMPLATE_UPDATED)),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  // Blog: /blog + one URL per post, DERIVED from getAllPosts() so a new article
  // is in the sitemap the moment it's published. The blog index and all 3 posts
  // were live but MISSING from the sitemap until July 11, 2026 — invisible to
  // Google. Do not hardcode post slugs here.
  const blogPages: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: asDate(
      later((post.updatedAt ?? post.publishedAt).slice(0, 10), BLOG_TEMPLATE_UPDATED),
    ),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${baseUrl}/generate`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      // Free deadline checker (U6, shipped Aug 1 2026). Fixed lastModified per
      // this file's own lastmod philosophy — bump it when the page materially
      // changes (next expected: Jan 2027 holiday-list refresh).
      url: `${baseUrl}/security-deposit-deadline-calculator`,
      lastModified: asDate('2026-08-01'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/states`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...statePages,
    ...cityPages,
    ...blogPages,
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/refund`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}
