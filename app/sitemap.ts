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

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://gettenantshield.com'

  // Bare ISO date ('2026-07-05') → Date at UTC midnight. Parsing without the
  // explicit Z can drift a day backwards in negative-offset timezones.
  const asDate = (iso: string) => new Date(`${iso}T00:00:00Z`)

  const statePages: MetadataRoute.Sitemap = JURISDICTIONS.map((j) => ({
    url: `${baseUrl}/states/${j.slug}`,
    lastModified: asDate(j.lastVerified),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  // Only the 10 cities that HAVE pages (7 augments + 3 replaces). The 5 'defers'
  // cities have no page by design — see the eligibility rule in lib/cityHelpers.ts.
  const cityPages: MetadataRoute.Sitemap = getPageCities().map((c) => ({
    url: `${baseUrl}/states/${c.parentStateSlug}/${toCitySegment(c.slug)}`,
    lastModified: asDate(c.lastVerified),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  // Blog: /blog + one URL per post, DERIVED from getAllPosts() so a new article
  // is in the sitemap the moment it's published. The blog index and all 3 posts
  // were live but MISSING from the sitemap until July 11, 2026 — invisible to
  // Google. Do not hardcode post slugs here.
  const blogPages: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
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
