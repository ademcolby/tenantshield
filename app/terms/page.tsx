// app/terms/page.tsx
import Link from 'next/link'
import { Fraunces, DM_Sans } from 'next/font/google'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'The terms and conditions governing your use of TenantShield. We are not a law firm; we generate state-specific demand letters as a self-help tool.',
  alternates: {
    canonical: '/terms',
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

export default function TermsPage() {
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

      {/* Body */}
      <main className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#B45309]">
          Legal
        </p>
        <h1
          className="mt-3 text-4xl font-medium tracking-tight text-slate-900 sm:text-5xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>

        <div className="mt-8 rounded-xl border border-[#E7E5E0] bg-white p-5 text-sm leading-relaxed text-slate-700">
          <strong className="font-semibold text-slate-900">Plain-language summary.</strong>{' '}
          {ENTITY} provides a software tool that generates a security-deposit demand
          letter based on the information you provide and the law in your state. We are
          not a law firm, we do not provide legal advice, and using this service does not
          create an attorney–client relationship. We cannot guarantee any outcome. This
          summary is for convenience only — the full terms below govern your use.
        </div>

        <Section n="1." title="Acceptance of these terms">
          <p>
            These Terms of Service (&quot;Terms&quot;) are a binding agreement between you
            and {ENTITY} (&quot;{ENTITY}&quot;, &quot;we&quot;, &quot;us&quot;, or
            &quot;our&quot;), the operator of TenantShield and the website at
            gettenantshield.com (the &quot;Service&quot;). By accessing the Service,
            submitting information, or completing a purchase, you agree to these Terms. If
            you do not agree, do not use the Service.
          </p>
        </Section>

        <Section n="2." title="What the Service is — and is not">
          <p>
            The Service is a self-help software tool. It uses the information you provide,
            together with publicly available statutory references, to generate a written
            security-deposit demand letter formatted for you to review, sign, and send
            yourself.
          </p>
          <p>
            <strong className="font-semibold text-slate-900">
              {ENTITY} is not a law firm and is not a substitute for an attorney.
            </strong>{' '}
            We do not provide legal advice, legal opinions, or legal representation.
            Generating a letter does not create an attorney–client relationship between
            you and {ENTITY} or anyone associated with it. Communications through the
            Service are not protected by attorney–client privilege. For advice about your
            specific legal situation, consult a licensed attorney in your state.
          </p>
          <p>
            Statutory references and deadlines presented by the Service are general
            information and may not reflect the most recent changes in the law or the
            specific facts of your situation. You are responsible for verifying anything
            you rely on.
          </p>
        </Section>

        <Section n="3." title="No guarantee of outcomes">
          <p>
            We do not promise, warrant, or guarantee that a letter generated by the
            Service will cause a landlord to return a deposit, that it will be accepted by
            any court, or that it will produce any particular result. The outcome of any
            dispute depends on facts and circumstances outside our control.
          </p>
        </Section>

        <Section n="4." title="Eligibility">
          <p>
            You must be at least 18 years old and a resident of the United States to use
            the Service. By using the Service you represent that you meet these
            requirements and that the information you provide is truthful and accurate.
          </p>
        </Section>

        <Section n="5." title="Your responsibilities">
          <p>
            The quality and accuracy of any generated letter depends entirely on the
            information you supply. You are solely responsible for the accuracy,
            completeness, and lawfulness of the information you enter, for reviewing the
            generated letter before using it, and for how you choose to use it. Do not use
            the Service to harass any person, to make false statements, or for any
            unlawful purpose.
          </p>
        </Section>

        <Section n="6." title="Payment">
          <p>
            The Service is offered for a one-time fee of $39 (USD) per letter, with no
            subscription. Payment is processed by Stripe, Inc. We do not collect or store
            your full payment card details. By submitting payment you authorize the charge
            for the amount shown at checkout.
          </p>
        </Section>

        <Section n="7." title="Refunds">
          <p>
            Because a letter is generated and delivered to you immediately, our refund
            policy is limited. Refunds are addressed in our{' '}
            <Link href="/refund" className="font-medium text-[#B45309] underline">
              Refund Policy
            </Link>
            , which is incorporated into these Terms by reference.
          </p>
        </Section>

        <Section n="8." title="Intellectual property">
          <p>
            The letter generated for you, once delivered, is yours to use for your own
            personal, non-commercial purpose. Everything else — the Service, the website,
            the underlying prompts, software, design, and content — is owned by {ENTITY}{' '}
            and protected by intellectual-property laws. You may not copy, resell,
            redistribute, scrape, reverse-engineer, or build a competing product from the
            Service.
          </p>
        </Section>

        <Section n="9." title="Disclaimer of warranties">
          <p>
            The Service is provided &quot;as is&quot; and &quot;as available,&quot;
            without warranties of any kind, whether express or implied, including any
            implied warranties of merchantability, fitness for a particular purpose,
            accuracy, or non-infringement. We do not warrant that the Service will be
            uninterrupted, error-free, or that any generated content is accurate, current,
            or suitable for your situation.
          </p>
        </Section>

        <Section n="10." title="Limitation of liability">
          <p>
            To the maximum extent permitted by law, {ENTITY} and its members, officers,
            and contractors will not be liable for any indirect, incidental,
            consequential, special, or punitive damages, or for any lost deposits,
            damages, or amounts arising from your use of or inability to use the Service.
            Our total aggregate liability for any claim arising out of or relating to the
            Service will not exceed the amount you actually paid us for the letter giving
            rise to the claim.
          </p>
        </Section>

        <Section n="11." title="Indemnification">
          <p>
            You agree to indemnify and hold harmless {ENTITY} from any claims, losses,
            liabilities, and expenses (including reasonable legal fees) arising from your
            use of the Service, your violation of these Terms, or your violation of any
            law or the rights of a third party.
          </p>
        </Section>

        <Section n="12." title="Governing law and disputes">
          <p>
            These Terms are governed by the laws of the State of Florida, without regard
            to its conflict-of-laws rules. Any dispute arising out of or relating to the
            Service or these Terms will be brought exclusively in the state or federal
            courts located in Florida, and you consent to their jurisdiction.
          </p>
        </Section>

        <Section n="13." title="Changes to these terms">
          <p>
            We may update these Terms from time to time. The &quot;Last updated&quot; date
            at the top reflects the most recent version. Continued use of the Service
            after changes take effect constitutes acceptance of the revised Terms.
          </p>
        </Section>

        <Section n="14." title="Contact">
          <p>
            Questions about these Terms can be sent to{' '}
            <a
              href="mailto:legal@gettenantshield.com"
              className="font-medium text-[#B45309] underline"
            >
              legal@gettenantshield.com
            </a>
            . For general support, contact{' '}
            <a
              href="mailto:support@gettenantshield.com"
              className="font-medium text-[#B45309] underline"
            >
              support@gettenantshield.com
            </a>
            .
          </p>
        </Section>

        <p className="mt-12 border-t border-[#E7E5E0] pt-6 text-xs text-slate-500">
          This page is provided for informational purposes and does not constitute legal
          advice. For advice specific to your situation, consult a licensed attorney in
          your state.
        </p>
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
