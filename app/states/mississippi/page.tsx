import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';
import { buildStateMetadata } from '@/lib/stateMetadata';

export const metadata: Metadata = buildStateMetadata({
  slug: 'mississippi',
  title: 'Security Deposit Demand Letter Mississippi',
  description: 'Get your security deposit back in Mississippi. State-specific demand letter citing Miss. Code § 89-8-21, the 45 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
});

export default function MississippiPage() {
  const jurisdiction = getJurisdiction('mississippi')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
