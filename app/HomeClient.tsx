// app/HomeClient.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Fraunces, DM_Sans } from 'next/font/google'
import type { Session } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/auth'
import {
  STATE_DEADLINES,
  getCityOverlaysForState,
} from '@/lib/stateDeadlines'

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

const Check = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
    <path d="M4 10.5l3.5 3.5L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const ShieldMark = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M12 2.5l8 3v6.5c0 4.5-3.4 8.6-8 9.5-4.6-.9-8-5-8-9.5V5.5l8-3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M8.5 12l2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const Arrow = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
    <path d="M4 10h12m0 0l-4.5-4.5M16 10l-4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const Quote = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M9.5 6C6.5 7.2 4.7 9.9 4.7 13.2V18h5.2v-5.2H7.4c0-1.9 1-3.3 2.9-4.2L9.5 6zm9 0c-3 1.2-4.8 3.9-4.8 7.2V18h5.2v-5.2h-2.5c0-1.9 1-3.3 2.9-4.2L18.5 6z" />
  </svg>
)

// ==================== TESTIMONIALS ====================
// Real customer reviews only. This array is intentionally EMPTY until genuine
// testimonials are collected from real users (planned: free/discounted letters
// to real tenants sourced from renter communities, with permission to quote).
// The section below auto-detects whether this array has entries: empty -> an
// honest "be the first" invite; populated -> a real review grid. To go live
// with reviews, just add objects here — no other code changes needed.
//
// FTC note: only add entries for real people who actually used the product and
// gave permission. Never fabricate. Use first name + state (or "Verified
// customer" if they prefer anonymity). `result` is an optional short outcome.
type Testimonial = {
  quote: string
  name: string
  location: string
  result?: string
}
const TESTIMONIALS: Testimonial[] = [
  // Example shape (do NOT ship until real):
  // { quote: 'Had my full deposit back within two weeks.', name: 'Sarah M.', location: 'Austin, TX', result: '$1,800 recovered' },
]

export default function HomeClient() {
  // Deadline lookup state — visitor picks a state and we render its baseline
  // deadline plus any city overlays inline. Data comes from lib/stateDeadlines.ts.
  const [selectedState, setSelectedState] = useState('')
  const selected = STATE_DEADLINES.find((s) => s.state === selectedState)
  const cityOverlays = selectedState ? getCityOverlaysForState(selectedState) : []

  // Project E: session-aware nav. null = still checking (render nothing to avoid
  // a flash); true/false swaps "Sign in" <-> "My account". Mirrors SiteChrome.
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    let active = true

    supabase.auth
      .getSession()
      .then(({ data }: { data: { session: Session | null } }) => {
        if (active) setAuthed(!!data.session)
      })

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        if (active) setAuthed(!!session)
      },
    )

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return (
    <div
      className={`${fraunces.variable} ${dmSans.variable} min-h-screen bg-[#FAFAF7] text-slate-900 antialiased`}
      style={{ fontFamily: 'var(--font-body), system-ui, sans-serif' }}
    >
      {/* ==================== NAVBAR ==================== */}
      <header className="sticky top-0 z-50 border-b border-[#E7E5E0] bg-[#FAFAF7]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center gap-2"
          >
            <ShieldMark className="h-6 w-6 text-slate-900" />
            <span
              className="text-xl font-semibold tracking-tight text-slate-900"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              TenantShield
            </span>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-700 md:flex">
            <a href="#how-it-works" className="transition hover:text-slate-900">How it works</a>
            <a href="#deadlines" className="transition hover:text-slate-900">State deadlines</a>
            <a href="#faq" className="transition hover:text-slate-900">FAQ</a>
          </nav>
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Project E: swaps with auth state. Hidden while unknown. */}
            {authed !== null && (
              <Link
                href={authed ? '/dashboard' : '/auth'}
                className="text-sm font-medium text-slate-700 transition hover:text-slate-900"
              >
                {authed ? 'My account' : 'Sign in'}
              </Link>
            )}
            <Link
              href="/generate"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#B45309] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#92400E] sm:gap-2 sm:px-5 sm:py-2.5"
            >
              Generate my letter
              <span className="hidden text-amber-100/80 sm:inline">— $39</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ==================== HERO ==================== */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-60"
          style={{
            background:
              'radial-gradient(900px 500px at 15% 0%, rgba(180,83,9,0.07), transparent 60%), radial-gradient(700px 400px at 90% 20%, rgba(15,23,42,0.05), transparent 60%)',
          }}
        />
        <div className="mx-auto grid max-w-6xl gap-12 px-5 pt-14 pb-20 sm:px-8 sm:pt-20 sm:pb-28 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/60 px-3 py-1 text-xs font-medium uppercase tracking-widest text-slate-700">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B45309]" />
              Demand letters for tenants — all 50 states + DC
            </div>
            <h1
              className="text-[2.65rem] font-medium leading-[1.04] tracking-[-0.02em] text-slate-900 sm:text-6xl lg:text-[4.25rem]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Get your security{' '}
              <span className="italic text-[#B45309]" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>
                deposit
              </span>{' '}
              back.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600 sm:text-xl">
              Answer a few questions. Get a state-specific demand letter with real statute
              citations — ready to print, sign, and send.
            </p>
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-700">
              <li className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-[#15803D]" />
                All 50 states + DC
              </li>
              <li className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-[#15803D]" />
                Real statute citations
              </li>
              <li className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-[#15803D]" />
                Ready in about two minutes
              </li>
            </ul>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/generate"
                className="group inline-flex items-center gap-2 rounded-full bg-slate-900 px-7 py-4 text-base font-semibold text-white shadow-[0_6px_24px_-8px_rgba(15,23,42,0.5)] transition hover:bg-slate-800"
              >
                Generate my letter — $39
                <Arrow className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <span className="text-sm text-slate-500">One-time payment. No subscription.</span>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Average security deposit: <span className="font-medium text-slate-700">$1,500–$2,500</span> — spend $39 to recover it.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Not legal advice. Every citation in your letter is a real statute.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div
              aria-hidden
              className="absolute inset-0 translate-x-3 translate-y-3 rotate-2 rounded-md border border-[#E7E5E0] bg-white/70 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.18)]"
            />
            <div className="relative -rotate-[1.5deg] rounded-md border border-[#E7E5E0] bg-white p-7 shadow-[0_30px_70px_-20px_rgba(15,23,42,0.28)] sm:p-9">
              <div className="mt-1 space-y-3 text-[13px] leading-relaxed text-slate-700" style={{ fontFamily: 'var(--font-display)' }}>
                <p className="text-slate-500">May 11, 2026</p>
                <p><span className="font-medium text-slate-900">RE:</span> Return of security deposit — 1428 Magnolia Ave, Unit 3</p>
                <p>Dear Mr. Patterson,</p>
                {/* Body paragraphs are intentionally blurred so the preview shows a
                    real, formatted letter without exposing copyable content. */}
                <div className="relative select-none" aria-hidden>
                  <div className="space-y-3 blur-[5px]">
                    <p>
                      Pursuant to <span className="font-semibold text-[#B45309]">Fla. Stat. § 83.49(3)(a)</span>, a
                      landlord must return a tenant&apos;s security deposit within{' '}
                      <span className="font-semibold">15 days</span> of lease termination, or
                      provide written notice of intent to impose a claim within{' '}
                      <span className="font-semibold">30 days</span>.
                    </p>
                    <p>
                      As of the date of this letter, <span className="font-semibold">45 days</span>{' '}
                      have elapsed since I vacated the premises on March 27, 2026, and you have
                      failed to comply with either obligation…
                    </p>
                  </div>
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0) 35%, rgba(255,255,255,0.85) 100%)' }}
                  />
                </div>
                <div className="!mt-5 flex h-1 w-12 rounded-full bg-slate-200" />
                <div className="flex h-1 w-2/3 rounded-full bg-slate-200" />
                <div className="flex h-1 w-1/2 rounded-full bg-slate-200" />
              </div>
            </div>
            <div className="absolute -bottom-4 left-6 hidden rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-lg sm:left-10 sm:inline-flex">
              ✓ Statute-cited
            </div>
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section id="how-it-works" className="border-y border-[#E7E5E0] bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#B45309]">How it works</p>
            <h2 className="text-4xl font-medium tracking-tight text-slate-900 sm:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>
              Three steps. Roughly two minutes.
            </h2>
          </div>
          <ol className="mt-12 grid gap-8 md:grid-cols-3 md:gap-6">
            {[
              { n: '01', title: 'Describe your situation', body: 'Tell us your state, what happened with your landlord, and the deposit amount. Most people finish in about two minutes.' },
              { n: '02', title: 'Pay securely — $39', body: 'One-time payment via Stripe. No subscription, no upsells, no account to create.' },
              { n: '03', title: 'Download your PDF', body: 'Your letter is generated instantly with real statute citations, exact deadlines, and professional formatting. Sign and mail.' },
            ].map((step) => (
              <li key={step.n} className="relative">
                <div className="text-5xl font-medium text-[#B45309]/30" style={{ fontFamily: 'var(--font-display)' }}>{step.n}</div>
                <h3 className="mt-3 text-2xl font-medium tracking-tight text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{step.title}</h3>
                <p className="mt-2 text-slate-600 leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ==================== WHY A DEMAND LETTER WORKS ==================== */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#B45309]">Why it works</p>
            <h2 className="text-4xl font-medium leading-[1.1] tracking-tight text-slate-900 sm:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>
              Most landlords pay up once they see real statute citations.
            </h2>
            <p className="mt-5 text-lg text-slate-600 leading-relaxed">
              A demand letter isn&apos;t a lawsuit. It&apos;s a clear, professional notice
              that you know your rights — and you&apos;re prepared to enforce them.
            </p>
          </div>
          <ul className="space-y-5">
            {[
              { title: 'Puts your landlord on notice', body: 'Real statute citations show this isn&apos;t a generic template — and that you&apos;re ready to act.' },
              { title: 'Creates a paper trail', body: 'Courts heavily favor tenants who can show they gave the landlord a clear chance to comply.' },
              { title: 'Required in some states', body: 'Several states require a written demand before you can file in small claims court.' },
              { title: 'Triggers penalty multipliers', body: 'Many statutes allow 2x or 3x damages when a landlord ignores a properly delivered demand.' },
            ].map((item) => (
              <li key={item.title} className="flex gap-4 rounded-xl border border-[#E7E5E0] bg-white p-5 transition hover:border-slate-300 hover:shadow-sm">
                <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#B45309]/10 text-[#B45309]">
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600" dangerouslySetInnerHTML={{ __html: item.body }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ==================== WHAT'S INCLUDED ==================== */}
      <section className="border-y border-[#E7E5E0] bg-slate-900 text-slate-100">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-300">What you get</p>
            <h2 className="text-4xl font-medium tracking-tight text-white sm:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>
              Everything a real demand letter needs.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'State-specific citations', body: 'Exact statute references for your state — not a generic template.' },
              { title: 'Calculated deadlines', body: 'We do the math on return windows, response windows, and effective dates.' },
              { title: 'Penalty language', body: 'Where applicable, your letter cites 2x or 3x damages and attorney-fee provisions.' },
              { title: 'Next-step guidance', body: 'Clear instructions on small claims court if your landlord still refuses.' },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/20 hover:bg-white/[0.06]">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-300/15 text-amber-300">
                  <Check className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== STATE DEADLINE LOOKUP ==================== */}
      <section id="deadlines" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#B45309]">Know your deadline</p>
          <h2 className="text-4xl font-medium tracking-tight text-slate-900 sm:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>
            Security deposit return deadlines by state.
          </h2>
          <p className="mt-5 text-slate-600 leading-relaxed">
            Every state sets its own deadline for landlords to return security deposits. If
            your landlord missed it, you may be entitled to penalties on top of your deposit.
          </p>
        </div>

        <div className="mt-10 max-w-2xl">
          <label htmlFor="deadline-state" className="block text-sm font-medium text-slate-700 mb-2">
            Select your state
          </label>
          <select
            id="deadline-state"
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#B45309]/40 focus:border-[#B45309] transition"
          >
            <option value="">Choose a state…</option>
            {STATE_DEADLINES.map((row) => (
              <option key={row.state} value={row.state}>{row.state}</option>
            ))}
          </select>

          {selected && (
            <div className="mt-6 overflow-hidden rounded-xl border border-[#E7E5E0] bg-white">
              <div className="border-b border-[#E7E5E0] bg-slate-50/70 px-6 py-4">
                <h3 className="text-lg font-semibold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>
                  {selected.state}
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Return deadline</p>
                  <p className="mt-1 text-2xl font-medium text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>
                    {selected.days}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Statute</p>
                  <p className="mt-1 font-mono text-sm text-slate-700">{selected.statute}</p>
                </div>
              </div>

              {cityOverlays.length > 0 && (
                <div className="border-t border-[#E7E5E0] bg-[#FAFAF7]/60 px-6 py-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#B45309]">
                    City-level variations
                  </p>
                  <p className="mt-1 mb-4 text-sm text-slate-600">
                    Some cities in {selected.state} add protections or set different deadlines.
                    If your rental is in one of these, your letter will apply the local rules too.
                  </p>
                  <ul className="space-y-4">
                    {cityOverlays.map((overlay) => (
                      <li key={overlay.city} className="rounded-lg border border-[#E7E5E0] bg-white p-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                          <h4 className="font-semibold text-slate-900">{overlay.city}</h4>
                          <span className="font-mono text-xs text-slate-500">{overlay.ordinance}</span>
                        </div>
                        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{overlay.summary}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-6 max-w-2xl text-sm text-slate-500">
          Some cities have additional protections or different deadlines — select your state to
          see city-level variations where they apply.
        </p>
        <p className="mt-2 max-w-2xl text-xs text-slate-500">
          Deadlines and citations are general references. Your actual letter will cite the specific subsection that applies to your situation.
        </p>
      </section>

      {/* ==================== FAQ ==================== */}
      <section id="faq" className="border-y border-[#E7E5E0] bg-white">
        <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-24">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#B45309]">Questions</p>
          <h2 className="text-4xl font-medium tracking-tight text-slate-900 sm:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>
            Common questions, answered.
          </h2>
          <div className="mt-10 divide-y divide-[#E7E5E0] border-t border-[#E7E5E0]">
            {[
              { q: 'Is this legal advice?', a: "No. TenantShield generates a demand letter based on the law in your state, but we&apos;re not a law firm and we don&apos;t represent you. The letter is a tool — for case-specific legal advice, consult a licensed attorney in your state." },
              { q: 'What if my landlord ignores the letter?', a: "Most landlords respond once they see real statute citations. If yours doesn&apos;t, your next step is small claims court — your letter becomes a key piece of evidence, and many state statutes allow you to recover 2x or 3x your deposit plus attorney fees." },
              { q: 'What states do you cover?', a: 'All 50 states and Washington, D.C. — with special handling for cities that have additional protections (Chicago, NYC, Seattle, Portland, SF, LA, Berkeley, West Hollywood, Santa Monica, DC).' },
              { q: 'How is this different from a free template?', a: "Free templates are generic — same letter for every state, no citations, no calculated deadlines. Our letters are written for your specific state, situation, and timeline, with real statute references that signal to your landlord this isn&apos;t a fishing expedition." },
              { q: 'Can I get a refund?', a: "Because letters are generated and delivered instantly, we don&apos;t offer refunds once your letter has been produced. If a technical issue prevented you from receiving your letter, contact us and we&apos;ll make it right." },
              { q: 'Is my data safe?', a: 'We never sell or share your personal information. Payment is handled by Stripe (PCI compliant), and your form data is only used to generate your letter.' },
            ].map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-left">
                  <span className="text-lg font-medium text-slate-900">{item.q}</span>
                  <span aria-hidden className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-500 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 pr-10 leading-relaxed text-slate-600" dangerouslySetInnerHTML={{ __html: item.a }} />
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== COMPARISON ==================== */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#B45309]">Why TenantShield</p>
          <h2 className="text-4xl font-medium tracking-tight text-slate-900 sm:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>
            Not all demand letters are equal.
          </h2>
        </div>
        <div className="overflow-hidden rounded-xl border border-[#E7E5E0] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E7E5E0]">
                <th className="px-6 py-4 text-left font-medium text-slate-500 w-1/2"></th>
                <th className="px-6 py-4 text-center font-semibold text-slate-900 bg-amber-50/60 border-x border-[#E7E5E0]">TenantShield</th>
                <th className="px-6 py-4 text-center font-medium text-slate-500">Free template</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5E0]">
              {[
                { feature: 'State-specific statute citations', us: true, them: false },
                { feature: 'Calculated deadlines for your situation', us: true, them: false },
                { feature: 'Penalty multiplier language (2x, 3x)', us: true, them: false },
                { feature: 'Special city protections (NYC, Chicago, SF…)', us: true, them: false },
                { feature: 'Professional PDF formatting', us: true, them: false },
                { feature: 'Ready in about two minutes', us: true, them: true },
                { feature: 'Free', us: false, them: true },
              ].map((row) => (
                <tr key={row.feature} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-slate-700">{row.feature}</td>
                  <td className="px-6 py-4 text-center bg-amber-50/40 border-x border-[#E7E5E0]">
                    {row.us
                      ? <Check className="h-5 w-5 text-[#15803D] mx-auto" />
                      : <span className="text-slate-300 text-lg leading-none">—</span>
                    }
                  </td>
                  <td className="px-6 py-4 text-center">
                    {row.them
                      ? <Check className="h-5 w-5 text-[#15803D] mx-auto" />
                      : <span className="text-slate-300 text-lg leading-none">—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ==================== FOUNDER NOTE + TESTIMONIALS ==================== */}
      <section className="border-y border-[#E7E5E0] bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
          {/* Founder note — honest early-stage trust signal */}
          <div className="mx-auto max-w-3xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#B45309]">Why I built this</p>
            <h2 className="text-4xl font-medium tracking-tight text-slate-900 sm:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>
              A note from the founder.
            </h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-slate-600">
              <p>
                Too many tenants never get their deposit back simply because writing a
                proper demand letter — one that cites the actual statute, the exact
                deadline, and the penalties a landlord faces — felt out of reach. So they
                let it go, and landlords count on exactly that.
              </p>
              <p>
                I built TenantShield to close that gap: the same state-specific,
                statute-cited letter a tenant might pay a lawyer hundreds for, generated in
                about two minutes for $39. Every citation in your letter is a real statute
                I&apos;ve verified against primary sources across all 50 states and DC —
                nothing generic, nothing invented.
              </p>
              <p className="font-medium text-slate-700">
                If it doesn&apos;t help, email me directly at{' '}
                <a href="mailto:support@gettenantshield.com" className="text-[#B45309] underline-offset-2 hover:underline">
                  support@gettenantshield.com
                </a>
                . A real person reads it.
              </p>
            </div>
          </div>

          {/* Testimonials — auto-flips based on whether TESTIMONIALS has entries */}
          <div className="mt-16 border-t border-[#E7E5E0] pt-16">
            {TESTIMONIALS.length > 0 ? (
              <>
                <div className="mx-auto max-w-2xl text-center">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#B45309]">What tenants say</p>
                  <h2 className="text-4xl font-medium tracking-tight text-slate-900 sm:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>
                    Real results from real tenants.
                  </h2>
                </div>
                <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {TESTIMONIALS.map((t, i) => (
                    <figure key={i} className="flex flex-col rounded-xl border border-[#E7E5E0] bg-[#FAFAF7] p-6">
                      <Quote className="h-6 w-6 text-[#B45309]/40" />
                      <blockquote className="mt-4 flex-1 text-slate-700 leading-relaxed">
                        &ldquo;{t.quote}&rdquo;
                      </blockquote>
                      <figcaption className="mt-5 border-t border-[#E7E5E0] pt-4">
                        <div className="font-semibold text-slate-900">{t.name}</div>
                        <div className="text-sm text-slate-500">{t.location}</div>
                        {t.result && (
                          <div className="mt-2 inline-block rounded-full bg-[#15803D]/[0.08] px-3 py-1 text-xs font-semibold text-[#15803D]">
                            {t.result}
                          </div>
                        )}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </>
            ) : (
              /* Honest pre-launch state — no fabricated reviews. Invites the
                 first real customers to be quoted, and reinforces real proof. */
              <div className="mx-auto max-w-2xl text-center">
                <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#B45309]/10 text-[#B45309]">
                  <Quote className="h-6 w-6" />
                </div>
                <h2 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
                  Be one of the first.
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-slate-600">
                  TenantShield is new, so we&apos;re not going to show you reviews from
                  people who don&apos;t exist. What we will show you: real statute
                  citations, exact deadlines, and a letter you can read before you pay.
                  Use it, and if it helps get your deposit back, we&apos;d be honored to
                  share your story here — with your permission.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-slate-700">
                  <span className="inline-flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#15803D]" /> All 50 states + DC
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#15803D]" /> Verified against primary sources
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#15803D]" />{' '}
                    <Link href="/refund" className="underline-offset-2 hover:underline">
                      Backed by our refund policy
                    </Link>
                  </span>
                </div>
                <p className="mt-8 text-sm text-slate-500">
                  Already used TenantShield?{' '}
                  <a
                    href="mailto:support@gettenantshield.com?subject=My%20TenantShield%20story"
                    className="font-medium text-[#B45309] underline-offset-2 hover:underline"
                  >
                    Share your story
                  </a>{' '}
                  — we&apos;d love to feature it here.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==================== FINAL CTA ==================== */}
      <section className="px-5 pb-20 sm:px-8 sm:pb-28">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl bg-slate-900 px-8 py-16 text-center sm:px-16 sm:py-20">
          <h2
            className="mx-auto max-w-3xl text-4xl font-medium leading-[1.05] tracking-tight text-white sm:text-6xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Ready to get your{' '}
            <span className="italic text-amber-300">deposit</span> back?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-slate-300 sm:text-lg">
            Two minutes of your time. A real, statute-cited letter on the other side.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/generate"
              className="group inline-flex items-center gap-2 rounded-full bg-amber-400 px-8 py-4 text-base font-semibold text-slate-900 shadow-[0_10px_30px_-10px_rgba(251,191,36,0.6)] transition hover:bg-amber-300"
            >
              Generate my letter — $39
              <Arrow className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <span className="text-sm text-slate-400">One-time payment. No subscription.</span>
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Not legal advice. Every citation in your letter is a real statute.
          </p>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="border-t border-[#E7E5E0] bg-[#FAFAF7]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-2">
            <ShieldMark className="h-5 w-5 text-slate-900" />
            <span className="font-semibold tracking-tight text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>
              TenantShield
            </span>
          </div>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
            <Link href="/terms" className="transition hover:text-slate-900">Terms</Link>
            <Link href="/privacy" className="transition hover:text-slate-900">Privacy</Link>
            <Link href="/refund" className="transition hover:text-slate-900">Refund Policy</Link>
            <a href="mailto:support@gettenantshield.com" className="transition hover:text-slate-900">Contact</a>
          </nav>
        </div>
        <div className="border-t border-[#E7E5E0]">
          <div className="mx-auto max-w-6xl px-5 py-5 text-xs text-slate-500 sm:px-8 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} TenantShield LLC. Not legal advice. The information provided does not, and is not intended to, constitute legal advice. For case-specific advice, consult a licensed attorney in your state.</span>
            <span className="shrink-0 text-slate-400">7901 4th St N Ste 300, St. Petersburg, FL 33702</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
