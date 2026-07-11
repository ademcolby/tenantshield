import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';
import { buildStateMetadata } from '@/lib/stateMetadata';

export const metadata: Metadata = buildStateMetadata({
  slug: 'district-of-columbia',
  title: 'Security Deposit Demand Letter District of Columbia',
  description: 'Get your security deposit back in District of Columbia. State-specific demand letter citing 14 DCMR §§ 308–311, the 45 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
});

export default function DistrictOfColumbiaPage() {
  const jurisdiction = getJurisdiction('district-of-columbia')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
