import type { Metadata } from 'next';
import SiteChrome from '@/app/components/SiteChrome';
import DeadlineChecker from '@/app/components/DeadlineChecker';

export const metadata: Metadata = {
  title: 'Security Deposit Deadline Calculator — Is Your Landlord Late?',
  description:
    'Free calculator: enter your state and move-out date to see exactly when your landlord must return your security deposit — and whether they are already late. Covers all 50 states + DC.',
  alternates: { canonical: '/security-deposit-deadline-calculator' },
  openGraph: {
    title: 'Security Deposit Deadline Calculator — Is Your Landlord Late?',
    description:
      'Enter your state and move-out date to see your landlord\u2019s legal deadline to return your deposit — and what they risk by missing it.',
    url: 'https://gettenantshield.com/security-deposit-deadline-calculator',
  },
};

const faqs = [
  {
    q: 'How long does my landlord have to return my security deposit?',
    a: 'It depends entirely on your state — statutory deadlines range from about 10 days to 60 days, and several states use conditional deadlines that depend on whether the landlord is claiming deductions. Select your state above for the exact rule.',
  },
  {
    q: 'When does the deadline clock actually start?',
    a: 'In most states it runs from the day you move out. But in roughly a dozen states, the clock does not start until you take a specific step — giving your landlord a written forwarding address, or demanding the deposit in writing. If you have not done that yet, your landlord may not be legally late at all — yet. A demand letter is the document that starts the clock.',
  },
  {
    q: 'What happens if my landlord misses the deadline?',
    a: 'Consequences vary by state: many states make the landlord forfeit the right to keep any of the deposit, and many add statutory penalties on top — commonly double or triple the amount wrongfully withheld, sometimes plus attorney fees. The calculator shows your state\u2019s specific exposure.',
  },
  {
    q: 'Is this calculator legal advice?',
    a: 'No. It provides general information drawn from each state\u2019s security deposit statute. It is not legal advice about your specific situation, and it does not create an attorney-client relationship.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

export default function DeadlineCalculatorPage() {
  return (
    <SiteChrome>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="ddc-page">
        <header className="ddc-hero">
          <h1>Security Deposit Deadline Calculator</h1>
          <p className="ddc-sub">
            Is your landlord late? Enter your state and move-out date to see
            the exact legal deadline for returning your deposit — and what
            your landlord risks by missing it. Free, instant, covers all 50
            states plus DC.
          </p>
        </header>

        <DeadlineChecker />

        <section className="ddc-faq">
          <h2>Frequently asked questions</h2>
          {faqs.map((f) => (
            <div key={f.q} className="ddc-faq-item">
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </section>

        <p className="ddc-fineprint ddc-page-fineprint">
          TenantShield provides general information about state security
          deposit laws, not legal advice. Statutes are verified against
          primary sources and reviewed on a recurring schedule, but laws
          change — nothing on this page creates an attorney-client
          relationship.
        </p>
      </div>

      {/* Scoped styles — same pattern as the blog letter-doc card:
          prefixed classes, kept in the page, never in globals.css. */}
      <style>{`
        .ddc-page {
          max-width: 720px;
          margin: 0 auto;
          padding: 2.5rem 1.25rem 4rem;
          font-family: var(--font-body, ui-sans-serif, system-ui, sans-serif);
        }
        .ddc-hero h1 {
          font-family: var(--font-display, Georgia, serif);
          font-size: 2.1rem;
          line-height: 1.2;
          margin: 0 0 0.75rem;
        }
        .ddc-sub {
          font-size: 1.05rem;
          line-height: 1.6;
          opacity: 0.85;
          margin: 0 0 2rem;
        }
        .ddc-card {
          border: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: 12px;
          padding: 1.5rem;
          background: #fff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        .ddc-field { margin-bottom: 1.25rem; }
        .ddc-fieldset { border: 0; padding: 0; margin: 0 0 1.25rem; }
        .ddc-label {
          display: block;
          font-weight: 600;
          font-size: 0.95rem;
          margin-bottom: 0.4rem;
        }
        .ddc-input {
          width: 100%;
          max-width: 340px;
          font: inherit;
          padding: 0.55rem 0.7rem;
          border: 1px solid rgba(0, 0, 0, 0.25);
          border-radius: 8px;
          background: #fff;
        }
        .ddc-hint {
          font-size: 0.85rem;
          opacity: 0.7;
          margin: 0.4rem 0 0;
        }
        .ddc-radio {
          display: flex;
          gap: 0.55rem;
          align-items: flex-start;
          padding: 0.35rem 0;
          font-size: 0.95rem;
          line-height: 1.5;
          cursor: pointer;
        }
        .ddc-radio input { margin-top: 0.25rem; }
        .ddc-subfield { margin: 0.6rem 0 0 1.6rem; }
        .ddc-button {
          font: inherit;
          font-weight: 600;
          padding: 0.7rem 1.4rem;
          border-radius: 8px;
          border: 0;
          background: #111;
          color: #fff;
          cursor: pointer;
        }
        .ddc-button:disabled { opacity: 0.4; cursor: not-allowed; }
        .ddc-result {
          margin-top: 1.5rem;
          border: 1px solid rgba(0, 0, 0, 0.12);
          border-left: 4px solid #111;
          border-radius: 12px;
          padding: 1.5rem;
          background: #fff;
        }
        .ddc-result-notstarted { border-left-color: #b45309; }
        .ddc-result-kicker {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          opacity: 0.6;
          margin: 0 0 0.5rem;
        }
        .ddc-result-headline {
          font-family: var(--font-display, Georgia, serif);
          font-size: 1.35rem;
          line-height: 1.3;
          margin: 0 0 0.6rem;
        }
        .ddc-deadline-block { margin-bottom: 1rem; }
        .ddc-branch-label {
          font-size: 0.85rem;
          font-weight: 600;
          opacity: 0.75;
          margin: 0 0 0.3rem;
        }
        .ddc-deadline-date { margin: 0; line-height: 1.55; }
        .ddc-exposure {
          margin-top: 1.25rem;
          padding-top: 1.1rem;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
        }
        .ddc-exposure h4 {
          font-size: 1rem;
          margin: 0 0 0.5rem;
        }
        .ddc-exposure p { line-height: 1.6; margin: 0 0 0.7rem; }
        .ddc-notes { margin-top: 0.75rem; }
        .ddc-note {
          font-size: 0.9rem;
          line-height: 1.55;
          background: rgba(0, 0, 0, 0.035);
          border-radius: 8px;
          padding: 0.7rem 0.9rem;
          margin: 0 0 0.6rem;
        }
        .ddc-cta {
          display: inline-block;
          margin-top: 1rem;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          background: #111;
          color: #fff;
          text-decoration: none;
        }
        .ddc-fineprint {
          font-size: 0.8rem;
          opacity: 0.6;
          line-height: 1.5;
          margin: 1rem 0 0;
        }
        .ddc-faq { margin-top: 3rem; }
        .ddc-faq h2 {
          font-family: var(--font-display, Georgia, serif);
          font-size: 1.5rem;
          margin: 0 0 1rem;
        }
        .ddc-faq-item h3 {
          font-size: 1.05rem;
          margin: 1.25rem 0 0.4rem;
        }
        .ddc-faq-item p { line-height: 1.65; margin: 0; }
        .ddc-page-fineprint { margin-top: 2.5rem; }
      `}</style>
    </SiteChrome>
  );
}
