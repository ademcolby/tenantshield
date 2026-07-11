import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter Wisconsin',
  description: 'Get your security deposit back in Wisconsin. State-specific demand letter citing Wis. Admin. Code ATCP 134.06, the 21 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/wisconsin',
  },
};

export default function WisconsinPage() {
  const jurisdiction = getJurisdiction('wisconsin')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
