import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';
import { buildStateMetadata } from '@/lib/stateMetadata';

export const metadata: Metadata = buildStateMetadata({
  slug: 'delaware',
  title: 'Security Deposit Demand Letter Delaware',
  description: 'Get your security deposit back in Delaware. State-specific demand letter citing 25 Del. C. § 5514, the 20 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
});

export default function DelawarePage() {
  const jurisdiction = getJurisdiction('delaware')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
