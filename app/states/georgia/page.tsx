import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';
import { buildStateMetadata } from '@/lib/stateMetadata';

export const metadata: Metadata = buildStateMetadata({
  slug: 'georgia',
  title: 'Security Deposit Demand Letter Georgia',
  description: 'Get your security deposit back in Georgia. State-specific demand letter citing OCGA § 44-7-34 and § 44-7-35, the 30-day deadline, and the triple-damages penalty. Ready in minutes for $39.',
});

export default function GeorgiaPage() {
  const jurisdiction = getJurisdiction('georgia')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
