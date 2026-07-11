// app/privacy/page.tsx
import Link from 'next/link'
import { Fraunces, DM_Sans } from 'next/font/google'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How TenantShield collects, uses, and protects your information. We only use your data to generate and deliver your letter — we never sell or share it.',
  alternates: {
    canonical: '/privacy',
  },
}

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

// ============================================================
//  EDIT THESE TWO LINES WHEN YOUR LLC IS APPROVED / ON REVISION
// ============================================================
const ENTITY = 'TenantShield LLC'
const LAST_UPDATED = 'June 27, 2026'
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

export default function PrivacyPage() {
  return (
    <div
      className={`${fraunces.variable} ${dmSans.variable} min-h-screen bg-[#FAFAF7] text-slate-900 antialiased`}
      style={{ fontFamily: 'var(--font-body), system-ui, sans-serif' }}
    >
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
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>

        <div className="mt-8 rounded-xl border border-[#E7E5E0] bg-white p-5 text-sm leading-relaxed text-slate-700">
          <strong className="font-semibold text-slate-900">The short version.</strong> We
          collect only what we need to generate your letter, process your payment, and
          deliver and support your order. We store your order details — including your
          letter — so we can email it to you, let you access it again, and help you if you
          contact support. We do not sell or rent your personal information. Payment is
          handled by Stripe — we never see your full card number.
        </div>

        <Section n="1." title="Who we are">
          <p>
            This Privacy Policy explains how {ENTITY} (&quot;we&quot;, &quot;us&quot;)
            handles information collected through TenantShield at gettenantshield.com (the
            &quot;Service&quot;).
          </p>
        </Section>

        <Section n="2." title="Information we collect">
          <p>
            <strong className="font-semibold text-slate-900">
              Information you provide to generate a letter.
            </strong>{' '}
            This includes the details you enter into our intake form — for example your
            name, the rental property address, your landlord or property manager&apos;s
            name, your state and city, the deposit amount, relevant dates, and a
            description of your dispute.
          </p>
          <p>
            <strong className="font-semibold text-slate-900">
              Your order record, including your letter.
            </strong>{' '}
            When your letter is generated, we store your order details — the form data you
            submitted, the generated letter text, your email address, and an order
            reference number — in our database. We keep this so we can email your letter to
            you, allow you to access or re-download it later, and assist you with support or
            dispute-resolution requests. We regenerate the PDF from the stored letter text
            when you need another copy; we do not store the PDF file itself.
          </p>
          <p>
            <strong className="font-semibold text-slate-900">
              Your email address.
            </strong>{' '}
            We collect the email address you provide so we can email you your completed
            letter as a PDF and a confirmation of your order, and so we can help you with
            support requests.
          </p>
          <p>
            <strong className="font-semibold text-slate-900">Payment information.</strong>{' '}
            Payment is processed by Stripe, Inc. Stripe collects and processes your card
            details directly under its own privacy policy. We receive only limited
            confirmation information (such as that a payment succeeded) and do not store
            your full card number.
          </p>
          <p>
            <strong className="font-semibold text-slate-900">
              Information you send us directly.
            </strong>{' '}
            If you email us, we receive your email address and the contents of your
            message.
          </p>
          <p>
            <strong className="font-semibold text-slate-900">
              Limited technical data.
            </strong>{' '}
            Our hosting provider may automatically log standard technical information such
            as IP address and browser type for security and reliability. We do not use
            this to build advertising profiles.
          </p>
        </Section>

        <Section n="3." title="How we use your information">
          <p>
            We use the information you provide to generate your demand letter, process your
            payment, and deliver the result to you — including emailing your completed
            letter and an order confirmation to the address you provide. We also store your
            order so we can give you ongoing access to your letter, respond to support
            requests, resolve billing or service disputes, prevent abuse, maintain the
            security and reliability of the Service, and comply with legal and accounting
            obligations. We do not use your dispute details for advertising.
          </p>
        </Section>

        <Section n="4." title="AI processing of your letter content">
          <p>
            To generate your letter, the information you enter is transmitted to our
            third-party AI provider (Anthropic) through its API, which produces the letter
            text. This transmission is necessary to deliver the product you purchased.
            Your form content is sent only for the purpose of generating your letter and
            is not used by us to train any model.
          </p>
        </Section>

        <Section n="5." title="Service providers we share data with">
          <p>
            We share information only with the providers that make the Service function:
          </p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong className="font-semibold text-slate-900">Stripe</strong> — payment
              processing.
            </li>
            <li>
              <strong className="font-semibold text-slate-900">Anthropic</strong> —
              AI generation of your letter text.
            </li>
            <li>
              <strong className="font-semibold text-slate-900">Supabase</strong> — database
              and infrastructure used to securely store your order details and letter.
            </li>
            <li>
              <strong className="font-semibold text-slate-900">Vercel</strong> — website
              hosting and infrastructure.
            </li>
            <li>
              <strong className="font-semibold text-slate-900">Resend</strong> — email
              delivery (sending your completed letter and order confirmation to you).
            </li>
          </ul>
          <p>
            These providers process data on our behalf to deliver the Service. We do not
            sell, rent, or trade your personal information to anyone, and we do not share
            it for third-party advertising.
          </p>
        </Section>

        <Section n="6." title="How your form data is handled in your browser">
          <p>
            While you fill out the intake form, your entries are held in your
            browser&apos;s working memory for the duration of your visit so you can review
            and edit them before submitting. When you submit the form, your information is
            transmitted to our servers to generate and store your letter (see Section 2).
            We do not keep your form entries in local storage, cookies, or any other
            long-term browser storage, and we do not use third-party advertising or
            tracking cookies.
          </p>
        </Section>

        <Section n="7." title="Data retention">
          <p>
            We retain your order data — including your form details, generated letter text,
            email address, and reference number — for as long as needed to provide the
            Service, give you continued access to your letter, resolve disputes, prevent
            abuse, and meet our legal, tax, and accounting obligations. You may request
            deletion of your order data at any time by emailing{' '}
            <a
              href="mailto:support@gettenantshield.com"
              className="font-medium text-[#B45309] underline"
            >
              support@gettenantshield.com
            </a>
            , and we will delete it unless we are required to retain certain records for
            legal, tax, or fraud-prevention reasons. Payment records are retained by Stripe
            under its own policies and as required for financial recordkeeping.
          </p>
        </Section>

        <Section n="8." title="Your choices and rights">
          <p>
            You may request access to, correction of, or deletion of the personal
            information we hold about you by emailing{' '}
            <a
              href="mailto:support@gettenantshield.com"
              className="font-medium text-[#B45309] underline"
            >
              support@gettenantshield.com
            </a>
            . We will respond within a reasonable time. Some information may need to be
            retained for legal, tax, or fraud-prevention reasons.
          </p>
        </Section>

        <Section n="9." title="Security">
          <p>
            We use reasonable administrative and technical measures, and rely on
            established providers (Stripe, Vercel, Anthropic, Supabase) that maintain their
            own security programs, to protect your information. No method of transmission or
            storage is completely secure, and we cannot guarantee absolute security.
          </p>
        </Section>

        <Section n="10." title="Children">
          <p>
            The Service is intended for adults (18+) and is not directed to children. We
            do not knowingly collect personal information from anyone under 18.
          </p>
        </Section>

        <Section n="11." title="Changes to this policy">
          <p>
            We may update this Privacy Policy from time to time. The &quot;Last
            updated&quot; date above reflects the latest version. Material changes will be
            reflected on this page.
          </p>
        </Section>

        <Section n="12." title="Contact">
          <p>
            Privacy questions or data requests:{' '}
            <a
              href="mailto:support@gettenantshield.com"
              className="font-medium text-[#B45309] underline"
            >
              support@gettenantshield.com
            </a>
            . Legal notices:{' '}
            <a
              href="mailto:legal@gettenantshield.com"
              className="font-medium text-[#B45309] underline"
            >
              legal@gettenantshield.com
            </a>
            .
          </p>
        </Section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E7E5E0] bg-[#FAFAF7]">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-2">
            <ShieldMark className="h-5 w-5 text-slate-900" />
            <span
              className="font-semibold tracking-tight text-slate-900"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              TenantShield
            </span>
          </div>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
            <Link href="/states" className="transition hover:text-slate-900">
              All states
            </Link>
            <Link href="/blog" className="transition hover:text-slate-900">
              Blog
            </Link>
            <Link href="/about" className="transition hover:text-slate-900">
              About
            </Link>
            <Link href="/terms" className="transition hover:text-slate-900">
              Terms
            </Link>
            <Link href="/privacy" className="transition hover:text-slate-900">
              Privacy
            </Link>
            <Link href="/refund" className="transition hover:text-slate-900">
              Refund Policy
            </Link>
          </nav>
        </div>
        <div className="border-t border-[#E7E5E0]">
          <div className="mx-auto max-w-3xl px-5 py-5 text-xs text-slate-500 sm:px-8">
            © {new Date().getFullYear()} {ENTITY}. Not legal advice.
          </div>
        </div>
      </footer>
    </div>
  )
}
