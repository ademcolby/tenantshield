import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter Indiana',
  description: 'Get your security deposit back in Indiana. State-specific demand letter citing Ind. Code § 32-31-3-12, the 45 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/indiana',
  },
};

export default function IndianaPage() {
  const jurisdiction = getJurisdiction('indiana')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
