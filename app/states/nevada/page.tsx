import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';
import { buildStateMetadata } from '@/lib/stateMetadata';

export const metadata: Metadata = buildStateMetadata({
  slug: 'nevada',
  title: 'Security Deposit Demand Letter Nevada',
  description: 'Get your security deposit back in Nevada. State-specific demand letter citing NRS § 118A.242, the 30 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
});

export default function NevadaPage() {
  const jurisdiction = getJurisdiction('nevada')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
