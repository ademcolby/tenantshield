import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';
import { buildStateMetadata } from '@/lib/stateMetadata';

export const metadata: Metadata = buildStateMetadata({
  slug: 'michigan',
  title: 'Security Deposit Demand Letter Michigan',
  description: 'Get your security deposit back in Michigan. State-specific demand letter citing MCL § 554.609 and § 554.613, the 30-day deadline, and the double-damages penalty for wrongful withholding. Ready in minutes for $39.',
});

export default function MichiganPage() {
  const jurisdiction = getJurisdiction('michigan')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
