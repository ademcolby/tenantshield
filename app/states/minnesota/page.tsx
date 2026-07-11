import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';
import { buildStateMetadata } from '@/lib/stateMetadata';

export const metadata: Metadata = buildStateMetadata({
  slug: 'minnesota',
  title: 'Security Deposit Demand Letter Minnesota',
  description: 'Get your security deposit back in Minnesota. State-specific demand letter citing Minn. Stat. § 504B.178, the 21-day deadline, and the double-damages plus $500 penalty. Ready in minutes for $39.',
});

export default function MinnesotaPage() {
  const jurisdiction = getJurisdiction('minnesota')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
