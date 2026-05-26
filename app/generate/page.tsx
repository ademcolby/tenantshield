'use client';

import SiteChrome from '../components/SiteChrome'
import SecurityDepositForm from '../../SecurityDepositForm'
import { useState } from 'react'

function WaitlistBanner() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    // Store in localStorage for now — swap for a real email service post-launch
    const existing = JSON.parse(localStorage.getItem('ts_waitlist') || '[]')
    existing.push({ email, date: new Date().toISOString() })
    localStorage.setItem('ts_waitlist', JSON.stringify(existing))
    setSubmitted(true)
  }

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200">
      <div className="mx-auto max-w-4xl px-5 py-4 sm:px-8">
        {!submitted ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-amber-900">
                🚀 Full launch coming soon — payment processing is being finalized.
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Enter your email to be notified the moment we go live.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2 shrink-0">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 w-48"
              />
              <button
                type="submit"
                className="rounded-md bg-[#B45309] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[#92400E]"
              >
                Notify me
              </button>
            </form>
          </div>
        ) : (
          <p className="text-sm font-medium text-amber-900 text-center">
            ✅ You&apos;re on the list — we&apos;ll email you when TenantShield goes live.
          </p>
        )}
      </div>
    </div>
  )
}

export default function GeneratePage() {
  return (
    <SiteChrome>
      <WaitlistBanner />
      <SecurityDepositForm />
    </SiteChrome>
  )
}
