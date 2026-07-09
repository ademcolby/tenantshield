import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter Nebraska | TenantShield',
  description: 'Get your security deposit back in Nebraska. State-specific demand letter citing Neb. Rev. Stat. § 76-1416, the 14 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/nebraska',
  },
};

export default function NebraskaPage() {
  const jurisdiction = getJurisdiction('nebraska')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
