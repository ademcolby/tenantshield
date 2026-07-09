import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter New Mexico | TenantShield',
  description: 'Get your security deposit back in New Mexico. State-specific demand letter citing NMSA § 47-8-18, the 30 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/new-mexico',
  },
};

export default function NewMexicoPage() {
  const jurisdiction = getJurisdiction('new-mexico')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
