import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';
import { buildStateMetadata } from '@/lib/stateMetadata';

export const metadata: Metadata = buildStateMetadata({
  slug: 'new-mexico',
  title: 'Security Deposit Demand Letter New Mexico',
  description: 'Get your security deposit back in New Mexico. State-specific demand letter citing NMSA § 47-8-18, the 30 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
});

export default function NewMexicoPage() {
  const jurisdiction = getJurisdiction('new-mexico')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
