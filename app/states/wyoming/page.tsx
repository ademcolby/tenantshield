import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter Wyoming',
  description: 'Get your security deposit back in Wyoming. State-specific demand letter citing Wyo. Stat. § 1-21-1208, the 30 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/wyoming',
  },
};

export default function WyomingPage() {
  const jurisdiction = getJurisdiction('wyoming')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
