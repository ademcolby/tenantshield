import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';
import { buildStateMetadata } from '@/lib/stateMetadata';

export const metadata: Metadata = buildStateMetadata({
  slug: 'florida',
  title: 'Security Deposit Demand Letter Florida',
  description: 'Get your security deposit back in Florida. State-specific demand letter citing Florida Statutes § 83.49, the 15/30-day landlord deadlines, and forfeiture rule. Ready in minutes for $39.',
});

export default function FloridaPage() {
  const jurisdiction = getJurisdiction('florida')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
