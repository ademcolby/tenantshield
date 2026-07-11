import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';
import { buildStateMetadata } from '@/lib/stateMetadata';

export const metadata: Metadata = buildStateMetadata({
  slug: 'iowa',
  title: 'Security Deposit Demand Letter Iowa',
  description: 'Get your security deposit back in Iowa. State-specific demand letter citing Iowa Code § 562A.12, the 30 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
});

export default function IowaPage() {
  const jurisdiction = getJurisdiction('iowa')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
