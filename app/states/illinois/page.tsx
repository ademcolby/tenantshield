import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter Illinois | TenantShield',
  description: 'Get your security deposit back in Illinois. State-specific demand letter citing the Security Deposit Return Act (765 ILCS 710), the 45-day deadline, and the 2x bad-faith penalty. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/illinois',
  },
};

export default function IllinoisPage() {
  const jurisdiction = getJurisdiction('illinois')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
