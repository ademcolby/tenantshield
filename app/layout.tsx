import type { Metadata } from 'next';
import { Fraunces, DM_Sans } from 'next/font/google';
import Script from 'next/script';
import AttributionCapture from './components/AttributionCapture';
import './globals.css';

// ============================================================
// SINGLE SOURCE OF TRUTH FOR FONTS — July 11, 2026 hoist.
//
// Before this, next/font was invoked in SIX separate files
// (SiteChrome, HomeClient, terms, privacy, refund,
// SecurityDepositForm), each scoping --font-display/--font-body
// to its own wrapper div — and NOWHERE on the 64 SEO pages
// (51 states, 10 cities, /states, /about, blog), which referenced
// var(--font-display)/var(--font-sans) that resolved to NOTHING
// and fell back to system sans. Confirmed visually in production
// July 11, 2026: homepage H1 rendered Fraunces, /states/texas H1
// rendered system default.
//
// The variables are applied to <html> here so every route
// inherits them. --font-sans is aliased to --font-body in
// globals.css. Do NOT re-add per-page Fraunces()/DM_Sans() calls.
// ============================================================

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

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
    title: 'TenantShield — Get Your Security Deposit Back Today',
    description:
      'Generate a state-specific demand letter with real statute citations in minutes. Covers all 50 states plus DC. One flat fee of $39 — no subscription.',
    url: 'https://gettenantshield.com',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TenantShield — Get your security deposit back',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TenantShield — Get Your Security Deposit Back Today',
    description:
      'Generate a state-specific demand letter with real statute citations in minutes. Covers all 50 states plus DC. One flat fee of $39 — no subscription.',
    images: ['/og-image.png'],
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'TenantShield',
  legalName: 'TenantShield LLC',
  url: 'https://gettenantshield.com',
  logo: 'https://gettenantshield.com/icon.svg',
  image: 'https://gettenantshield.com/og-image.png',
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
    <html lang="en" className={`${fraunces.variable} ${dmSans.variable}`}>
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
      <body>
        {/* ============================================================
            ANALYTICS — GA4 + Google Ads on ONE gtag load (Sept 2026).
            `next/script` with afterInteractive, NOT a raw <script> in
            <head>: App Router strips raw scripts from <head> on client
            navigations, so a hand-pasted snippet fires on first load and
            then silently stops. Do not "simplify" this back to a raw tag.

            ONE gtag.js serves BOTH IDs — GA4 for behaviour, AW for Ads
            conversion tracking. The AW id was never installed; adding it
            here is what lets Google see a purchase and bid on signal.
            Conversion events still need to be FIRED at the success page
            with the conversion label from Ads — this tag alone does not
            record a purchase.

            PRIVACY: this sets _ga / _ga_* cookies. app/privacy/page.tsx
            § 6 was updated in the same change — the two must stay in sync.
            ============================================================ */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-9K11N4PHDD"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-9K11N4PHDD');
gtag('config', 'AW-18404808095');`}
        </Script>

        {/* Project J v1: sitewide first/last-touch attribution capture.
            Mounted HERE (root layout) and nowhere else — SiteChrome does NOT
            wrap blog routes, which is exactly where organic first touches
            land. Renders nothing; can never throw. */}
        <AttributionCapture />
        {children}
      </body>
    </html>
  );
}
