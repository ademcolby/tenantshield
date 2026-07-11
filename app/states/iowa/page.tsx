import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter Iowa',
  description: 'Get your security deposit back in Iowa. State-specific demand letter citing Iowa Code § 562A.12, the 30 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/iowa',
  },
};

export default function IowaPage() {
  const jurisdiction = getJurisdiction('iowa')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
