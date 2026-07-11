import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';
import { buildStateMetadata } from '@/lib/stateMetadata';

export const metadata: Metadata = buildStateMetadata({
  slug: 'kentucky',
  title: 'Security Deposit Demand Letter Kentucky',
  description: 'Get your security deposit back in Kentucky. State-specific demand letter citing KRS § 383.580, the 30 / 60 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
});

export default function KentuckyPage() {
  const jurisdiction = getJurisdiction('kentucky')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
