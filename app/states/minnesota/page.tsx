import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter Minnesota | TenantShield',
  description: 'Get your security deposit back in Minnesota. State-specific demand letter citing Minn. Stat. § 504B.178, the 21-day deadline, and the double-damages plus $500 penalty. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/minnesota',
  },
};

export default function MinnesotaPage() {
  const jurisdiction = getJurisdiction('minnesota')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
