import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter Maine | TenantShield',
  description: 'Get your security deposit back in Maine. State-specific demand letter citing 14 M.R.S. § 6033, the 30 / 21 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/maine',
  },
};

export default function MainePage() {
  const jurisdiction = getJurisdiction('maine')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
