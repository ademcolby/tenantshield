import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter Kansas',
  description: 'Get your security deposit back in Kansas. State-specific demand letter citing K.S.A. § 58-2550, the 30 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/kansas',
  },
};

export default function KansasPage() {
  const jurisdiction = getJurisdiction('kansas')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
