// lib/attribution.ts  — CLIENT ONLY (Project J v1, August 2026)
//
// First-touch + last-touch marketing attribution, captured sitewide and merged
// into the intake form payload at submit. The payload already travels wholesale
// through create-checkout-session → Redis → generateLetterCore →
// saveOrder(form_payload JSONB), and buildUserMessage() reads only named
// fields, so nothing here can ever reach the Anthropic prompt or the letter.
// No server change and no DB migration is required (verified August 8, 2026,
// batch 7 session — same pattern as caseStrength).
//
// DESIGN:
//   - FIRST-touch is write-once: captured on the very first page view that has
//     no existing record, then never overwritten. This is what makes "which
//     blog post originally brought this buyer" answerable. localStorage, so it
//     survives the multi-day consideration window typical of deposit disputes.
//   - LAST-touch is overwritten on every new ENTRY to the site (external
//     referrer, or a URL carrying utm/gclid params). Internal navigation never
//     updates it — a click from /blog/x to /generate is not a new entry.
//   - Captured fields are non-personal: landing path, referrer, UTM params,
//     gclid, timestamp. No names, no emails, no form content.
//   - Everything is wrapped in try/catch: localStorage can throw in private
//     browsing / blocked-storage contexts, and attribution must NEVER break
//     the page or the checkout. Failure mode is simply "no attribution".
//
// CONSUMERS:
//   - SiteChrome.tsx calls captureAttribution() once on mount (sitewide).
//   - SecurityDepositForm.tsx calls getAttribution() at payload build.
//   - Admin/analytics read order.form_payload.attribution off the order row.

const FIRST_KEY = 'ts_attr_first';
const LAST_KEY = 'ts_attr_last';

// One captured entry. All fields optional strings so JSON stays compact and
// absent ≠ empty-string ambiguity is avoided.
export interface AttributionTouch {
  /** Path + query of the page the visit entered on, e.g. "/blog/x?utm_source=y" */
  landingPage?: string;
  /** Full external referrer URL, e.g. "https://www.google.com/" */
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  /** Google Ads click id — presence alone marks a paid-Google entry. */
  gclid?: string;
  /** ISO timestamp of capture. */
  capturedAt?: string;
}

export interface Attribution {
  first?: AttributionTouch;
  last?: AttributionTouch;
}

function isExternalReferrer(): boolean {
  const ref = document.referrer;
  if (!ref) return false;
  try {
    return new URL(ref).origin !== window.location.origin;
  } catch {
    return false;
  }
}

function buildTouch(): AttributionTouch {
  const params = new URLSearchParams(window.location.search);
  const touch: AttributionTouch = {
    landingPage: window.location.pathname + window.location.search,
    capturedAt: new Date().toISOString(),
  };
  if (isExternalReferrer()) touch.referrer = document.referrer;
  const map: [string, keyof AttributionTouch][] = [
    ['utm_source', 'utmSource'],
    ['utm_medium', 'utmMedium'],
    ['utm_campaign', 'utmCampaign'],
    ['utm_term', 'utmTerm'],
    ['utm_content', 'utmContent'],
    ['gclid', 'gclid'],
  ];
  for (const [param, key] of map) {
    const v = params.get(param);
    if (v) touch[key] = v.slice(0, 200); // bound length; URLs can be abused
  }
  return touch;
}

/**
 * Call once per page load (SiteChrome mounts once per full load; client-side
 * route changes don't remount it, which is exactly right — internal navigation
 * is not a new entry).
 */
export function captureAttribution(): void {
  try {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const hasCampaignParams =
      params.has('gclid') ||
      params.has('utm_source') ||
      params.has('utm_medium') ||
      params.has('utm_campaign');
    const isEntry = isExternalReferrer() || hasCampaignParams;

    // FIRST-touch: write-once, ever. Direct visits count too — "no referrer,
    // no params" is itself real information (typed the URL / bookmark / dark
    // social), and leaving first empty until a "better" entry arrives would
    // silently rewrite history.
    if (!localStorage.getItem(FIRST_KEY)) {
      localStorage.setItem(FIRST_KEY, JSON.stringify(buildTouch()));
    }

    // LAST-touch: only genuine new entries overwrite.
    if (isEntry) {
      localStorage.setItem(LAST_KEY, JSON.stringify(buildTouch()));
    }
  } catch {
    // Storage unavailable (private mode, blocked). Attribution silently absent.
  }
}

/**
 * Read both touches for merging into the intake payload. Returns undefined
 * when nothing was ever captured, so JSON.stringify drops the key entirely and
 * old-payload shapes stay byte-identical.
 */
export function getAttribution(): Attribution | undefined {
  try {
    if (typeof window === 'undefined') return undefined;
    const attribution: Attribution = {};
    const first = localStorage.getItem(FIRST_KEY);
    const last = localStorage.getItem(LAST_KEY);
    if (first) attribution.first = JSON.parse(first) as AttributionTouch;
    if (last) attribution.last = JSON.parse(last) as AttributionTouch;
    if (!attribution.first && !attribution.last) return undefined;
    return attribution;
  } catch {
    return undefined;
  }
}
