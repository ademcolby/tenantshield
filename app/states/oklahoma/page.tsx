import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter Oklahoma',
  description: 'Get your security deposit back in Oklahoma. State-specific demand letter citing 41 O.S. § 115, the 45 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/oklahoma',
  },
};

export default function OklahomaPage() {
  const jurisdiction = getJurisdiction('oklahoma')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
