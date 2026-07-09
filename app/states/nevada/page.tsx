import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter Nevada | TenantShield',
  description: 'Get your security deposit back in Nevada. State-specific demand letter citing NRS § 118A.242, the 30 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/nevada',
  },
};

export default function NevadaPage() {
  const jurisdiction = getJurisdiction('nevada')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
