// app/components/SiteChrome.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Fraunces, DM_Sans } from 'next/font/google'
import type { Session } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '../../lib/auth'
import { isAdminEmail } from '../../lib/adminEmail'

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

const ENTITY = 'TenantShield LLC'

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

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isHome = pathname === '/'
  // Project F (nav bug fix): the header's "Generate my letter" CTA just links
  // to /generate. When already on that page it does nothing useful — the
  // real submit button lives at the bottom of the form — so we hide it there
  // rather than have it sit as a dead, confusing duplicate control.
  const isGeneratePage = pathname === '/generate'

  // Project E: session-aware nav. null = still checking (render nothing to avoid
  // a flash); true/false swaps "Sign in" <-> "My account". Subscribes to auth
  // changes so the label updates immediately after login/logout.
  const [authed, setAuthed] = useState<boolean | null>(null)
  // Project D: the signed-in email, used ONLY to decide whether to render the
  // Admin nav link. Cosmetic — the real gate is requireAdmin() on the server.
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    let active = true

    supabase.auth
      .getSession()
      .then(({ data }: { data: { session: Session | null } }) => {
        if (active) {
          setAuthed(!!data.session)
          setUserEmail(data.session?.user?.email ?? null)
        }
      })

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        if (active) {
          setAuthed(!!session)
          setUserEmail(session?.user?.email ?? null)
        }
      },
    )

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const handleLogoClick = (e: React.MouseEvent) => {
    if (isHome) {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Nav section links: on the landing page use anchor scrolling,
  // from any other page navigate to the landing page + anchor.
  const sectionLink = (hash: string) => (isHome ? hash : `/${hash}`)

  return (
    <div
      className={`${fraunces.variable} ${dmSans.variable} min-h-screen bg-[#FAFAF7] text-slate-900 antialiased`}
      style={{ fontFamily: 'var(--font-body), system-ui, sans-serif' }}
    >
      {/* ==================== HEADER ==================== */}
      <header className="sticky top-0 z-50 border-b border-[#E7E5E0] bg-[#FAFAF7]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link
            href="/"
            onClick={handleLogoClick}
            className="flex items-center gap-2"
          >
            <ShieldMark className="h-6 w-6 text-slate-900" />
            <span
              className="text-xl font-semibold tracking-tight text-slate-900"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              TenantShield
            </span>
          </Link>
          {/* Project F (nav bug fix): raised from md:flex to lg:flex. At md
              (768px) there wasn't enough width for logo + 3 links + auth link
              + CTA button in one row, so the links wrapped awkwardly onto a
              second line. Hidden until lg (1024px) instead, where there's
              genuinely enough room for everything on a single line. */}
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-700 lg:flex">
            <a href={sectionLink('#how-it-works')} className="transition hover:text-slate-900">
              How it works
            </a>
            <a href={sectionLink('#deadlines')} className="transition hover:text-slate-900">
              State deadlines
            </a>
            <a href={sectionLink('#faq')} className="transition hover:text-slate-900">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Project D: admin-only nav link. Rendering is cosmetic; the
                server-side requireAdmin() gate is what actually protects /admin. */}
            {isAdminEmail(userEmail) && (
              <Link
                href="/admin"
                className="text-sm font-medium text-slate-700 transition hover:text-slate-900"
              >
                Admin
              </Link>
            )}
            {/* Project E: swaps with auth state. Hidden while unknown. */}
            {authed !== null && (
              <Link
                href={authed ? '/dashboard' : '/auth'}
                className="text-sm font-medium text-slate-700 transition hover:text-slate-900"
              >
                {authed ? 'My account' : 'Sign in'}
              </Link>
            )}
            {/* Project F (nav bug fix): hidden on /generate itself — it's just
                a link to this same page, so it's a dead, confusing duplicate
                of the real submit button at the bottom of the form. */}
            {!isGeneratePage && (
              <Link
                href="/generate"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#B45309] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#92400E] sm:gap-2 sm:px-5 sm:py-2.5"
              >
                Generate my letter
                <span className="hidden text-amber-100/80 sm:inline">— $39</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ==================== CONTENT ==================== */}
      {children}

      {/* ==================== FOOTER ==================== */}
      <footer className="border-t border-[#E7E5E0] bg-[#FAFAF7]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
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
          <div className="mx-auto max-w-6xl px-5 py-5 text-xs text-slate-500 sm:px-8">
            © {new Date().getFullYear()} {ENTITY}. Not legal advice. The information
            provided does not, and is not intended to, constitute legal advice. For
            case-specific advice, consult a licensed attorney in your state.
          </div>
        </div>
      </footer>
    </div>
  )
}
