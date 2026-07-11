import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';
import { buildStateMetadata } from '@/lib/stateMetadata';

export const metadata: Metadata = buildStateMetadata({
  slug: 'washington',
  title: 'Security Deposit Demand Letter Washington',
  description: 'Get your security deposit back in Washington. State-specific demand letter citing RCW § 59.18.280, the 30-day deadline, and the 2x penalty for wrongful withholding. Ready in minutes for $39.',
});

export default function WashingtonPage() {
  const jurisdiction = getJurisdiction('washington')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
