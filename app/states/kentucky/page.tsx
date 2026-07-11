import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter Kentucky',
  description: 'Get your security deposit back in Kentucky. State-specific demand letter citing KRS § 383.580, the 30 / 60 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/kentucky',
  },
};

export default function KentuckyPage() {
  const jurisdiction = getJurisdiction('kentucky')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
