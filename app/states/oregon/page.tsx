import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter Oregon',
  description: 'Get your security deposit back in Oregon. State-specific demand letter citing ORS § 90.300, the 31 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/oregon',
  },
};

export default function OregonPage() {
  const jurisdiction = getJurisdiction('oregon')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
