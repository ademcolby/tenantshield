import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter Alabama',
  description: 'Get your security deposit back in Alabama. State-specific demand letter citing Ala. Code § 35-9A-201, the 60 days deadline, and the penalty for wrongful withholding. Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/alabama',
  },
};

export default function AlabamaPage() {
  const jurisdiction = getJurisdiction('alabama')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
