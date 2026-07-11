import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';
import { buildStateMetadata } from '@/lib/stateMetadata';

export const metadata: Metadata = buildStateMetadata({
  slug: 'vermont',
  title: 'Security Deposit Demand Letter Vermont',
  description: 'Get your security deposit back in Vermont. State-specific demand letter citing 9 V.S.A. § 4461, the 14 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
});

export default function VermontPage() {
  const jurisdiction = getJurisdiction('vermont')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
