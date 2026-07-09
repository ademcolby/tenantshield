import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter Rhode Island | TenantShield',
  description: 'Get your security deposit back in Rhode Island. State-specific demand letter citing R.I. Gen. Laws § 34-18-19, the 20 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/rhode-island',
  },
};

export default function RhodeIslandPage() {
  const jurisdiction = getJurisdiction('rhode-island')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
