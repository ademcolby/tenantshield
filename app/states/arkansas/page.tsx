import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';
import { buildStateMetadata } from '@/lib/stateMetadata';

export const metadata: Metadata = buildStateMetadata({
  slug: 'arkansas',
  title: 'Security Deposit Demand Letter Arkansas',
  description: 'Get your security deposit back in Arkansas. State-specific demand letter citing Ark. Code § 18-16-305 & § 18-16-306, the 60 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
});

export default function ArkansasPage() {
  const jurisdiction = getJurisdiction('arkansas')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
