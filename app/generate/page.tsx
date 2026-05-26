import SiteChrome from '../components/SiteChrome'
import SecurityDepositForm from '../../SecurityDepositForm'

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
