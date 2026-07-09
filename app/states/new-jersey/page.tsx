import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter New Jersey | TenantShield',
  description: 'Get your security deposit back in New Jersey. State-specific demand letter citing NJSA § 46:8-21.1, the 30-day deadline, and the double-damages penalty for wrongful withholding. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/new-jersey',
  },
};

export default function NewJerseyPage() {
  const jurisdiction = getJurisdiction('new-jersey')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
