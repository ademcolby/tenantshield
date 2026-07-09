import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter Missouri | TenantShield',
  description: 'Get your security deposit back in Missouri. State-specific demand letter citing RSMo § 535.300, the 30-day deadline, and the up-to-double-damages penalty for wrongful withholding. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/missouri',
  },
};

export default function MissouriPage() {
  const jurisdiction = getJurisdiction('missouri')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
