import SiteChrome from '../components/SiteChrome'
import SecurityDepositForm from '../../SecurityDepositForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Generate Your Demand Letter',
  description:
    'Answer a few questions about your security deposit dispute and generate a state-specific demand letter with real statute citations. $39, one-time.',
}

export default function GeneratePage() {
  return (
    <SiteChrome>
      <SecurityDepositForm />
    </SiteChrome>
  )
}
