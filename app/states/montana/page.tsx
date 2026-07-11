import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter Montana',
  description: 'Get your security deposit back in Montana. State-specific demand letter citing Mont. Code § 70-25-202 & § 70-25-204, the 10 / 30 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/montana',
  },
};

export default function MontanaPage() {
  const jurisdiction = getJurisdiction('montana')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
