import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';
import { buildStateMetadata } from '@/lib/stateMetadata';

export const metadata: Metadata = buildStateMetadata({
  slug: 'west-virginia',
  title: 'Security Deposit Demand Letter West Virginia',
  description: 'Get your security deposit back in West Virginia. State-specific demand letter citing W. Va. Code § 37-6A-1, the 60 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
});

export default function WestVirginiaPage() {
  const jurisdiction = getJurisdiction('west-virginia')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
