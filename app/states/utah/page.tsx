import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';
import { buildStateMetadata } from '@/lib/stateMetadata';

export const metadata: Metadata = buildStateMetadata({
  slug: 'utah',
  title: 'Security Deposit Demand Letter Utah',
  description: 'Get your security deposit back in Utah. State-specific demand letter citing Utah Code § 57-17-3 & § 57-17-5, the 30 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
});

export default function UtahPage() {
  const jurisdiction = getJurisdiction('utah')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
