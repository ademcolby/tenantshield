import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';
import { buildStateMetadata } from '@/lib/stateMetadata';

export const metadata: Metadata = buildStateMetadata({
  slug: 'tennessee',
  title: 'Security Deposit Demand Letter Tennessee',
  description: 'Get your security deposit back in Tennessee. State-specific demand letter citing TCA § 66-28-301, the 30-day deadline, and the forfeiture remedy for improper withholding. Ready in minutes for $39.',
});

export default function TennesseePage() {
  const jurisdiction = getJurisdiction('tennessee')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
