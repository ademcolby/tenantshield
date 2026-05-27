import SiteChrome from '../components/SiteChrome'
import SecurityDepositForm from '../../SecurityDepositForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Generate Your Demand Letter',
  description:
    'Answer a few questions about your security deposit dispute and generate a state-specific demand letter with real statute citations. $39, one-time.',
}

function WaitlistBanner() {
  return (
    <div className="w-full bg-amber-50 border-b border-amber-200">
      <div className="mx-auto max-w-4xl px-5 py-4 sm:px-8">
        <p className="text-sm font-medium text-amber-900">
          🚀 Full launch coming soon — payment processing is being finalized. Check back shortly.
        </p>
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
