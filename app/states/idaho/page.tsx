import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter Idaho',
  description: 'Get your security deposit back in Idaho. State-specific demand letter citing Idaho Code § 6-321, the 21 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/idaho',
  },
};

export default function IdahoPage() {
  const jurisdiction = getJurisdiction('idaho')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
