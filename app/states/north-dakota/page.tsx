import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter North Dakota',
  description: 'Get your security deposit back in North Dakota. State-specific demand letter citing N.D.C.C. § 47-16-07.1, the 30 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/north-dakota',
  },
};

export default function NorthDakotaPage() {
  const jurisdiction = getJurisdiction('north-dakota')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
