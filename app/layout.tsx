import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TenantShield - Get Your Security Deposit Back',
  description: 'Generate state-specific security deposit demand letters with real legal citations in 60 seconds.',
  verification: {
    google: 'J3ScHTY5sizuugxxEYLDZkRezugJeSYDSajUNYJ_W7Y',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
