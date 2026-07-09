import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter Texas | TenantShield',
  description: 'Get your security deposit back in Texas. State-specific demand letter citing Texas Property Code § 92.103 and § 92.109, the 30-day deadline, and 3x penalty law. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/texas',
  },
};

export default function TexasPage() {
  const jurisdiction = getJurisdiction('texas')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
