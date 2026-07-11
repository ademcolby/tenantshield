import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';
import { buildStateMetadata } from '@/lib/stateMetadata';

export const metadata: Metadata = buildStateMetadata({
  slug: 'massachusetts',
  title: 'Security Deposit Demand Letter Massachusetts',
  description: 'Get your security deposit back in Massachusetts. State-specific demand letter citing MGL c. 186 § 15B, the 30-day deadline, and the triple-damages penalty. Ready in minutes for $39.',
});

export default function MassachusettsPage() {
  const jurisdiction = getJurisdiction('massachusetts')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
