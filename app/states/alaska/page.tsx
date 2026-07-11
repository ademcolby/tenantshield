import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';
import { buildStateMetadata } from '@/lib/stateMetadata';

export const metadata: Metadata = buildStateMetadata({
  slug: 'alaska',
  title: 'Security Deposit Demand Letter Alaska',
  description: 'Get your security deposit back in Alaska. State-specific demand letter citing AS § 34.03.070, the 14 / 30 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
});

export default function AlaskaPage() {
  const jurisdiction = getJurisdiction('alaska')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
