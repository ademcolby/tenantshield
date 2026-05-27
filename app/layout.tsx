import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'TenantShield — State-Specific Security Deposit Demand Letters',
    template: '%s | TenantShield',
  },
  description:
    'Generate a state-specific security deposit demand letter with real statute citations in minutes. One flat fee. No subscription.',
  metadataBase: new URL('https://gettenantshield.com'),
  verification: {
    google: 'J3ScHTY5sizuugxxEYLDZkRezugJeSYDSajUNYJ_W7Y',
  },
  openGraph: {
    type: 'website',
    siteName: 'TenantShield',
    title: 'TenantShield — Get Your Security Deposit Back',
    description:
      'State-specific demand letters with real statute citations. All 50 states. $39 flat fee.',
    url: 'https://gettenantshield.com',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'TenantShield — Get your security deposit back',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TenantShield — Get Your Security Deposit Back',
    description:
      'State-specific demand letters with real statute citations. All 50 states. $39 flat fee.',
    images: ['/og-image.svg'],
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'TenantShield',
  legalName: 'TenantShield LLC',
  url: 'https://gettenantshield.com',
  logo: 'https://gettenantshield.com/icon.svg',
  image: 'https://gettenantshield.com/og-image.svg',
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'support@gettenantshield.com',
    contactType: 'customer support',
  },
  sameAs: [],
  description:
    'TenantShield generates state-specific security deposit demand letters with real statute citations for tenants in all 50 US states.',
};

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'Legal Document Preparation',
  name: 'Security Deposit Demand Letter Generator',
  description:
    'Generate a state-specific, statute-cited security deposit demand letter in minutes. Covers all 50 US states plus DC, including city-level ordinances for Chicago, NYC, San Francisco, Seattle, and more.',
  provider: {
    '@type': 'Organization',
    name: 'TenantShield',
    url: 'https://gettenantshield.com',
  },
  areaServed: {
    '@type': 'Country',
    name: 'United States',
  },
  offers: {
    '@type': 'Offer',
    price: '39.00',
    priceCurrency: 'USD',
    description: 'One-time fee per demand letter. No subscription.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(serviceSchema),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
