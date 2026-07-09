import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter South Dakota | TenantShield',
  description: 'Get your security deposit back in South Dakota. State-specific demand letter citing SDCL § 43-32-24, the 14 / 45 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/south-dakota',
  },
};

export default function SouthDakotaPage() {
  const jurisdiction = getJurisdiction('south-dakota')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
