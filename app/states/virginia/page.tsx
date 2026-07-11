import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';
import { buildStateMetadata } from '@/lib/stateMetadata';

export const metadata: Metadata = buildStateMetadata({
  slug: 'virginia',
  title: 'Security Deposit Demand Letter Virginia',
  description: 'Get your security deposit back in Virginia. State-specific demand letter citing Va. Code § 55.1-1226, the 45-day deadline, and the remedies for wrongful withholding. Ready in minutes for $39.',
});

export default function VirginiaPage() {
  const jurisdiction = getJurisdiction('virginia')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
