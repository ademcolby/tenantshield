import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';
import { buildStateMetadata } from '@/lib/stateMetadata';

export const metadata: Metadata = buildStateMetadata({
  slug: 'south-dakota',
  title: 'Security Deposit Demand Letter South Dakota',
  description: 'Get your security deposit back in South Dakota. State-specific demand letter citing SDCL § 43-32-24, the 14 / 45 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
});

export default function SouthDakotaPage() {
  const jurisdiction = getJurisdiction('south-dakota')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
