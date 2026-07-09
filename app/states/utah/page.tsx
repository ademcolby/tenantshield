import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter Utah | TenantShield',
  description: 'Get your security deposit back in Utah. State-specific demand letter citing Utah Code § 57-17-3 & § 57-17-5, the 30 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/utah',
  },
};

export default function UtahPage() {
  const jurisdiction = getJurisdiction('utah')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
