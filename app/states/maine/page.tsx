import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';
import { buildStateMetadata } from '@/lib/stateMetadata';

export const metadata: Metadata = buildStateMetadata({
  slug: 'maine',
  title: 'Security Deposit Demand Letter Maine',
  description: 'Get your security deposit back in Maine. State-specific demand letter citing 14 M.R.S. § 6033, the 30 / 21 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
});

export default function MainePage() {
  const jurisdiction = getJurisdiction('maine')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
