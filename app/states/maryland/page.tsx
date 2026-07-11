import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter Maryland',
  description: 'Get your security deposit back in Maryland. State-specific demand letter citing MD Real Property § 8-203, the 45-day deadline, and the up-to-3x penalty for withholding without a reasonable basis. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/maryland',
  },
};

export default function MarylandPage() {
  const jurisdiction = getJurisdiction('maryland')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
