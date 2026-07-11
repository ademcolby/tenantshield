import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';
import { buildStateMetadata } from '@/lib/stateMetadata';

export const metadata: Metadata = buildStateMetadata({
  slug: 'pennsylvania',
  title: 'Security Deposit Demand Letter Pennsylvania',
  description: 'Get your security deposit back in Pennsylvania. State-specific demand letter citing 68 P.S. § 250.512, the 30-day deadline, and the double-damages penalty. Ready in minutes for $39.',
});

export default function PennsylvaniaPage() {
  const jurisdiction = getJurisdiction('pennsylvania')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
