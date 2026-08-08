// app/components/AttributionCapture.tsx
'use client';

// Project J v1 (August 2026) — the sitewide attribution mount.
//
// PLACEMENT LESSON (batch 7, learned on staging): this was first mounted in
// SiteChrome, on the assumption that SiteChrome wraps every route. It does
// NOT — blog pages render their own chrome and import SiteFooter directly, so
// the capture never ran on exactly the pages organic first touches land on.
// Staging DOM verification caught it before main.
//
// This component therefore lives in app/layout.tsx (the ROOT layout), which
// Next.js guarantees wraps EVERY route — no page can opt out. Do not move it
// into any chrome/layout component below the root.
//
// It renders nothing. captureAttribution() is fully try/catch'd and can never
// throw, block hydration, or affect any page. See lib/attribution.ts for the
// first/last-touch rules.

import { useEffect } from 'react';
import { captureAttribution } from '../../lib/attribution';

export default function AttributionCapture() {
  useEffect(() => {
    captureAttribution();
  }, []);
  return null;
}
