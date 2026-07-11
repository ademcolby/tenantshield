// app/refund/page.tsx
import Link from 'next/link'
import type { Metadata } from 'next'
import SiteFooter from '@/app/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Refund Policy',
  description:
    'TenantShield refund policy. Full refunds for technical failures or duplicate charges. Letters are non-refundable once successfully generated and delivered.',
  alternates: {
    canonical: '/refund',
  },
}

// ============================================================
//  EDIT THESE TWO LINES WHEN YOUR LLC IS APPROVED / ON REVISION
// ============================================================
const ENTITY = 'TenantShield LLC'
const LAST_UPDATED = 'May 17, 2026'
// ============================================================

const ShieldMark = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M12 2.5l8 3v6.5c0 4.5-3.4 8.6-8 9.5-4.6-.9-8-5-8-9.5V5.5l8-3z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="M8.5 12l2.5 2.5L16 9.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

function Section({
  n,
  title,
  children,
}: {
  n: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-10">
      <h2
        className="text-2xl font-medium tracking-tight text-slate-900"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        <span className="mr-3 text-[#B45309]">{n}</span>
        {title}
      </h2>
      <div className="mt-3 space-y-4 leading-relaxed text-slate-600">{children}</div>
    </section>
  )
}

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF7] text-slate-900 antialiased">
      {/* Navbar */}
      <header className="border-b border-[#E7E5E0] bg-[#FAFAF7]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2">
            <ShieldMark className="h-6 w-6 text-slate-900" />
            <span
              className="text-xl font-semibold tracking-tight text-slate-900"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              TenantShield
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            ← Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#B45309]">
          Legal
        </p>
        <h1
          className="mt-3 text-4xl font-medium tracking-tight text-slate-900 sm:text-5xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Refund Policy
        </h1>
        <p className="mt-4 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>

        <div className="mt-8 rounded-xl border border-[#E7E5E0] bg-white p-5 text-sm leading-relaxed text-slate-700">
          <strong className="font-semibold text-slate-900">In short.</strong> Your letter
          is a digital product delivered to you instantly. Once your letter has been
          generated, the purchase is non-refundable — because the product has been fully
          delivered. If something went wrong on our end (you were charged but no letter
          was produced, a duplicate charge, or a technical failure), you are entitled to a
          full refund. Just email us.
        </div>

        <Section n="1." title="Digital product, delivered instantly">
          <p>
            TenantShield sells a single digital product: a state-specific demand letter
            generated from the information you provide. The letter is produced and made
            available to you within moments of payment. Because the full value of the
            product is delivered to you immediately and cannot be returned, all sales are
            final once the letter has been generated.
          </p>
        </Section>

        <Section n="2." title="When you ARE entitled to a refund">
          <p>We will issue a full refund in any of the following cases:</p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              You were charged but, due to a technical error on our side, no letter was
              ever generated or delivered to you.
            </li>
            <li>
              You were charged more than once for the same single letter (duplicate
              charge).
            </li>
            <li>
              A system failure prevented you from completing the process or accessing your
              letter, and we are unable to deliver it to you.
            </li>
          </ul>
          <p>
            In these situations, contact us and we will make it right — typically by
            re-delivering your letter or issuing a full refund.
          </p>
        </Section>

        <Section n="3." title="When a refund is NOT available">
          <p>Refunds are not available where:</p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              The letter was successfully generated and delivered to you. Receiving the
              letter is the completion of the sale.
            </li>
            <li>
              You changed your mind, no longer need the letter, or decided to handle the
              dispute differently after the letter was generated.
            </li>
            <li>
              You entered inaccurate, incomplete, or incorrect information. The letter is
              generated from what you provide; please review your entries before
              submitting.
            </li>
            <li>
              The landlord did not respond, or the dispute did not resolve in your favor.
              We do not guarantee any outcome, and outcomes are outside our control.
            </li>
          </ul>
        </Section>

        <Section n="4." title="How to request a refund">
          <p>
            Email{' '}
            <a
              href="mailto:support@gettenantshield.com"
              className="font-medium text-[#B45309] underline"
            >
              support@gettenantshield.com
            </a>{' '}
            within 14 days of your purchase. Include the email address used at checkout
            and a brief description of what went wrong. We aim to review every request
            within a few business days. Approved refunds are returned to your original
            payment method through Stripe.
          </p>
        </Section>

        <Section n="5." title="Chargebacks">
          <p>
            If you believe you are entitled to a refund, please contact us first — we want
            to resolve legitimate issues quickly and fairly. Filing a chargeback without
            first contacting us, particularly after a letter has been successfully
            delivered, may delay resolution. We retain records of letter generation and
            delivery and may provide them to the payment processor in response to a
            disputed charge.
          </p>
        </Section>

        <Section n="6." title="Contact">
          <p>
            Refund requests and questions:{' '}
            <a
              href="mailto:support@gettenantshield.com"
              className="font-medium text-[#B45309] underline"
            >
              support@gettenantshield.com
            </a>
            . This Refund Policy is part of our{' '}
            <Link href="/terms" className="font-medium text-[#B45309] underline">
              Terms of Service
            </Link>
            .
          </p>
        </Section>
      </main>



      <SiteFooter width="narrow" />
    </div>
  )
}
