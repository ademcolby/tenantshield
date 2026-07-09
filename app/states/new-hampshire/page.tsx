import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter New Hampshire | TenantShield',
  description: 'Get your security deposit back in New Hampshire. State-specific demand letter citing RSA 540-A:7, the 30 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/new-hampshire',
  },
};

export default function NewHampshirePage() {
  const jurisdiction = getJurisdiction('new-hampshire')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
