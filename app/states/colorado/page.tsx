import type { Metadata } from 'next';
import StatePage from '@/app/components/StatePage';
import { getJurisdiction } from '@/lib/stateLawData';

export const metadata: Metadata = {
  title: 'Security Deposit Demand Letter Colorado',
  description: 'Get your security deposit back in Colorado. State-specific demand letter citing CRS § 38-12-103, the 30-day deadline, the treble-damages penalty, and the new 2026 tenant protections (HB25-1249). Ready in minutes for $39.',
  alternates: {
    canonical: 'https://gettenantshield.com/states/colorado',
  },
};

export default function ColoradoPage() {
  const jurisdiction = getJurisdiction('colorado')!;
  return <StatePage jurisdiction={jurisdiction} />;
}
