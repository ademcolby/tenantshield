# TenantShield - Security Deposit Demand Letter Generator

A Next.js application that generates state-specific security deposit demand letters with real legal citations.

## What's Been Built (Step 2.1 - Complete)

✅ **Complete intake form** with:
- All 50 states + DC
- Major city selection with sub-jurisdictional rules
- 10 sub-type chips (security deposit scenarios)
- 8 special circumstances (Tier 1 complications)
- Conditional fields (lease designation for AZ/WA/OR, rent-stabilized for NYC)
- Full form validation
- Professional, trustworthy UI design

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## What's Next

**Step 2.2** - Wire the form to the Anthropic API
**Step 2.3** - Add Stripe payment wall  
**Step 2.4** - PDF generation
**Step 2.5** - Deploy to Vercel
**Step 2.6** - Landing page copy

## Project Structure

```
/app
  /page.tsx          - Main page component
  /layout.tsx        - Root layout
  /globals.css       - Global styles with Tailwind
/SecurityDepositForm.tsx  - Main form component
/package.json       - Dependencies
/tailwind.config.ts - Tailwind configuration
```

## The Form Data Structure

When submitted, the form captures:

```typescript
{
  state: string,
  city: string,
  tenantName: string,
  tenantAddress: string,
  landlordName: string,
  landlordAddress: string,
  rentalPropertyAddress: string,
  depositAmount: string,
  vacatedDate: string,
  situation: string,
  subtypes: string[],              // e.g., ['no_response', 'wear_and_tear']
  specialCircumstances: string[],  // e.g., ['multiple_tenants_on_lease']
  leaseDesignation: string,        // 'yes_designated' | 'no_not_designated' | 'unknown'
  isRentStabilized: string,        // 'yes' | 'no' | 'unknown'
}
```

This data will be passed to the Anthropic API with the system prompt we built earlier.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Vercel (next step)

## Current Status

✅ Step 2.1 - Intake form complete
⏳ Step 2.2 - API integration (next)
⏳ Step 2.3 - Stripe payment
⏳ Step 2.4 - PDF generation
⏳ Step 2.5 - Deployment
⏳ Step 2.6 - Landing page

---

**Built for**: Security deposit demand letter generation (first category of 6 planned)
**Production-ready system prompt**: Already complete and tested across 25+ scenarios
