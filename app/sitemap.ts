import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://gettenantshield.com'

  const states = [
    // Batch 1 — original
    'texas',
    'california',
    'florida',
    'new-york',
    // Batch 2
    'illinois',
    'georgia',
    'washington',
    'colorado',
    'arizona',
    'north-carolina',
    'ohio',
    'pennsylvania',
    // Batch 3
    'michigan',
    'new-jersey',
    'virginia',
    'tennessee',
    'maryland',
    'massachusetts',
    'minnesota',
    'missouri',
    // Batch 4 — remaining jurisdictions (all 51 now covered)
    'wisconsin',
    'south-carolina',
    'alabama',
    'louisiana',
    'kentucky',
    'oregon',
    'oklahoma',
    'connecticut',
    'utah',
    'iowa',
    'nevada',
    'arkansas',
    'mississippi',
    'kansas',
    'new-mexico',
    'nebraska',
    'idaho',
    'west-virginia',
    'hawaii',
    'new-hampshire',
    'maine',
    'rhode-island',
    'montana',
    'delaware',
    'south-dakota',
    'north-dakota',
    'alaska',
    'vermont',
    'district-of-columbia',
    'wyoming',
    'indiana',
  ]

  const statePages: MetadataRoute.Sitemap = states.map((state) => ({
    url: `${baseUrl}/states/${state}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
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
    ...statePages,
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
