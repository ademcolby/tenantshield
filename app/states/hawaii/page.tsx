import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter Hawaii | TenantShield',
  description: 'Get your security deposit back in Hawaii. State-specific demand letter citing HRS § 521-44, the 14 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/hawaii',
  },
};

export default function HawaiiPage() {
  const jurisdiction = getJurisdiction('hawaii')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
