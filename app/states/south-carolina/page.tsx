import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';
import { buildStateMetadata } from '@/lib/stateMetadata';

export const metadata: Metadata = buildStateMetadata({
  slug: 'south-carolina',
  title: 'Security Deposit Demand Letter South Carolina',
  description: 'Get your security deposit back in South Carolina. State-specific demand letter citing SC Code § 27-40-410, the 30 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
});

export default function SouthCarolinaPage() {
  const jurisdiction = getJurisdiction('south-carolina')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
