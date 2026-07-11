import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';
import { buildStateMetadata } from '@/lib/stateMetadata';

export const metadata: Metadata = buildStateMetadata({
  slug: 'arizona',
  title: 'Security Deposit Demand Letter Arizona',
  description: 'Get your security deposit back in Arizona. State-specific demand letter citing ARS § 33-1321, the 14-business-day deadline, and the 2x penalty for wrongful withholding. Ready in minutes for $39.',
});

export default function ArizonaPage() {
  const jurisdiction = getJurisdiction('arizona')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
