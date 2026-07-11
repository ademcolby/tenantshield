import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';
import { buildStateMetadata } from '@/lib/stateMetadata';

export const metadata: Metadata = buildStateMetadata({
  slug: 'rhode-island',
  title: 'Security Deposit Demand Letter Rhode Island',
  description: 'Get your security deposit back in Rhode Island. State-specific demand letter citing R.I. Gen. Laws § 34-18-19, the 20 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
});

export default function RhodeIslandPage() {
  const jurisdiction = getJurisdiction('rhode-island')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
