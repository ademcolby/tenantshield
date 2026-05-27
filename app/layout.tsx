import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'TenantShield — State-Specific Security Deposit Demand Letters',
    template: '%s | TenantShield',
  },
  description:
    'Generate a state-specific security deposit demand letter with real statute citations in minutes. One flat fee. No subscription.',
  metadataBase: new URL('https://gettenantshield.com'),
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
