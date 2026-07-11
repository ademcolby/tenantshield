import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';
import { buildStateMetadata } from '@/lib/stateMetadata';

export const metadata: Metadata = buildStateMetadata({
  slug: 'california',
  title: 'Security Deposit Demand Letter California',
  description: 'Get your security deposit back in California. State-specific demand letter citing Civil Code § 1950.5, the 21-day deadline, the bad-faith penalty, and the new photo-evidence requirements (AB 2801). Ready in minutes for $39.',
});

export default function CaliforniaPage() {
  const jurisdiction = getJurisdiction('california')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
