import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter New York | TenantShield',
  description: 'Get your security deposit back in New York. State-specific demand letter citing NY General Obligations Law § 7-108, the 14-day deadline, and 2x willful violation penalty. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/new-york',
  },
};

export default function NewYorkPage() {
  const jurisdiction = getJurisdiction('new-york')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
