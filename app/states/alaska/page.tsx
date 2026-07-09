import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter Alaska | TenantShield',
  description: 'Get your security deposit back in Alaska. State-specific demand letter citing AS § 34.03.070, the 14 / 30 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/alaska',
  },
};

export default function AlaskaPage() {
  const jurisdiction = getJurisdiction('alaska')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
