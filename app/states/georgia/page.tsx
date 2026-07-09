import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter Georgia | TenantShield',
  description: 'Get your security deposit back in Georgia. State-specific demand letter citing OCGA § 44-7-34 and § 44-7-35, the 30-day deadline, and the triple-damages penalty. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/georgia',
  },
};

export default function GeorgiaPage() {
  const jurisdiction = getJurisdiction('georgia')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
