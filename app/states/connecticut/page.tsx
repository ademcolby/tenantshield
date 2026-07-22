import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';
import { buildStateMetadata } from '@/lib/stateMetadata';

export const metadata: Metadata = buildStateMetadata({
  slug: 'connecticut',
  title: 'Security Deposit Demand Letter Connecticut',
  description: 'Get your security deposit back in Connecticut. State-specific demand letter citing Conn. Gen. Stat. § 47a-21, the 21-day deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
});

export default function ConnecticutPage() {
  const jurisdiction = getJurisdiction('connecticut')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
