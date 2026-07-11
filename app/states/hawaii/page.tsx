import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';
import { buildStateMetadata } from '@/lib/stateMetadata';

export const metadata: Metadata = buildStateMetadata({
  slug: 'hawaii',
  title: 'Security Deposit Demand Letter Hawaii',
  description: 'Get your security deposit back in Hawaii. State-specific demand letter citing HRS § 521-44, the 14 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
});

export default function HawaiiPage() {
  const jurisdiction = getJurisdiction('hawaii')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
