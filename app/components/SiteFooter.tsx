// app/components/SiteFooter.tsx
//
// THE site footer — built July 11, 2026 (Backlog #1).
//
// WHY THIS EXISTS: the footer used to live as ELEVEN hand-maintained copies
// (SiteChrome, HomeClient, StatePage, CityPage, /states, /about, /blog,
// /blog/[slug], /terms, /privacy, /refund). That duplication caused three
// separate link-drift failures, the last one DURING the session that was
// fixing the previous one: /blog/[slug] — the highest-authority pages on the
// site — shipped with a 3-link footer missing /states, /about, and /blog.
//
// DEFINITION OF DONE, and the rule going forward: adding a new page to the
// site requires ZERO footer edits, and adding a footer link means editing
// exactly ONE file — this one. Do not inline a footer anywhere ever again.
//
// Deliberately NOT 'use client': plain presentational markup, so it renders
// server-side on the 64 static SEO pages and works inside client components
// (SiteChrome, HomeClient) equally.
//
// `width` matches the footer to the page's content column:
//   wide   → max-w-6xl (default: home, states, cities, blog, about)
//   narrow → max-w-3xl (legal pages: terms, privacy, refund)
// ⚠️ Widths MUST stay in this lookup map as complete literal class names.
// Tailwind's JIT scanner cannot see interpolated fragments like
// `max-w-${x}` — the class would be silently dropped from the production
// CSS and the footer would collapse to full-bleed only in prod.

import Link from 'next/link'

const WIDTHS = {
  wide: 'max-w-6xl',
  narrow: 'max-w-3xl',
} as const

const LINKS = [
  { label: 'All states', href: '/states' },
  // Aug 2026 code batch — the checker's last discoverability gap (U6 follow-up):
  // one edit here puts it in the footer of every page on the site, per this
  // file's single-source rule.
  { label: 'Deadline Checker', href: '/security-deposit-deadline-calculator' },
  { label: 'Blog', href: '/blog' },
  { label: 'About', href: '/about' },
  { label: 'Terms', href: '/terms' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Refund Policy', href: '/refund' },
] as const

const ENTITY = 'TenantShield LLC'
const ADDRESS = '7901 4th St N Ste 300, St. Petersburg, FL 33702'

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

export default function SiteFooter({
  width = 'wide',
}: {
  width?: keyof typeof WIDTHS
}) {
  const w = WIDTHS[width]

  return (
    <footer className="border-t border-[#E7E5E0] bg-[#FAFAF7]">
      <div
        className={`mx-auto flex ${w} flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8`}
      >
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
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
          <a
            href="mailto:support@gettenantshield.com"
            className="transition hover:text-slate-900"
          >
            Contact
          </a>
        </nav>
      </div>
      <div className="border-t border-[#E7E5E0]">
        <div
          className={`mx-auto ${w} px-5 py-5 text-xs text-slate-500 sm:px-8 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between`}
        >
          <span className="max-w-xl">
            &copy; {new Date().getFullYear()} {ENTITY}. Not legal advice. The
            information provided does not, and is not intended to, constitute
            legal advice. For case-specific advice, consult a licensed attorney
            in your state.
          </span>
          <span className="shrink-0 text-slate-400">{ADDRESS}</span>
        </div>
      </div>
    </footer>
  )
}
