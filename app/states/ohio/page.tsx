import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';
import { buildStateMetadata } from '@/lib/stateMetadata';

export const metadata: Metadata = buildStateMetadata({
  slug: 'ohio',
  title: 'Security Deposit Demand Letter Ohio',
  description: 'Get your security deposit back in Ohio. State-specific demand letter citing ORC § 5321.16, the 30-day deadline, and the double-damages penalty for wrongful withholding. Ready in minutes for $39.',
});

export default function OhioPage() {
  const jurisdiction = getJurisdiction('ohio')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
