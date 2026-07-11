import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';
import { buildStateMetadata } from '@/lib/stateMetadata';

export const metadata: Metadata = buildStateMetadata({
  slug: 'louisiana',
  title: 'Security Deposit Demand Letter Louisiana',
  description: 'Get your security deposit back in Louisiana. State-specific demand letter citing La. R.S. § 9:3251 & § 9:3252, the 1 month deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
});

export default function LouisianaPage() {
  const jurisdiction = getJurisdiction('louisiana')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
