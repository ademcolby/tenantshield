import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter North Carolina',
  description: 'Get your security deposit back in North Carolina. State-specific demand letter citing NCGS § 42-52 and § 42-55, the 30-day deadline, and the forfeiture remedy for noncompliance. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/north-carolina',
  },
};

export default function NorthCarolinaPage() {
  const jurisdiction = getJurisdiction('north-carolina')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
