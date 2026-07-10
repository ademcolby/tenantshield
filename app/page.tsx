// app/page.tsx
import type { Metadata } from 'next'
import HomeClient from './HomeClient'
import { getHomepageStates, getHomepageCityMap } from '@/lib/stateLawData'

// This is a SERVER component (no 'use client') so it can export metadata.
// A self-referencing canonical tells Google the homepage is the primary page
// for the brand, so /terms stops outranking it in branded search.
export const metadata: Metadata = {
  title: 'TenantShield — State-Specific Security Deposit Demand Letters',
  description:
    'Generate a state-specific security deposit demand letter with real statute citations in minutes. All 50 states plus DC. One flat $39 fee — no subscription.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'TenantShield',
    title: 'TenantShield — Get Your Security Deposit Back Today',
    description:
      'Generate a state-specific demand letter with real statute citations in minutes. Covers all 50 states plus DC. One flat fee of $39 — no subscription.',
    url: 'https://gettenantshield.com',
  },
}

export default function Page() {
  // Derived server-side so the full legal data file never ships to the client.
  return (
    <HomeClient
      deadlineStates={getHomepageStates()}
      cityOverlaysByState={getHomepageCityMap()}
    />
  )
}
