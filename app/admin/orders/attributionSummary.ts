// app/admin/orders/attributionSummary.ts  — SERVER-SAFE PURE HELPERS
//
// Project J (D7, batch 10): read the attribution (J v1) and funnel (J v2)
// riders back OUT of an order's form_payload for admin display. Pure
// functions, no imports — usable from any server component.
//
// The payload stamps being read (both optional — orders pre-dating each
// feature simply don't have them):
//   form_payload.attribution = { first?: Touch, last?: Touch }   (J v1, Aug 9)
//   form_payload.funnel      = { sessionId, autofillUsed }       (J v2)
//
// READ DEFENSIVELY: form_payload is untyped JSONB. Every accessor here
// type-guards and returns undefined rather than throwing — a malformed stamp
// must never break an admin page.

export interface TouchView {
  landingPage?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  gclid?: string;
  capturedAt?: string;
}

export interface AttributionView {
  first?: TouchView;
  last?: TouchView;
}

export interface FunnelStampView {
  sessionId?: string;
  autofillUsed?: boolean;
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

function toTouch(raw: unknown): TouchView | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const o = raw as Record<string, unknown>;
  const touch: TouchView = {
    landingPage: str(o.landingPage),
    referrer: str(o.referrer),
    utmSource: str(o.utmSource),
    utmMedium: str(o.utmMedium),
    utmCampaign: str(o.utmCampaign),
    utmTerm: str(o.utmTerm),
    utmContent: str(o.utmContent),
    gclid: str(o.gclid),
    capturedAt: str(o.capturedAt),
  };
  return Object.values(touch).some((v) => v !== undefined) ? touch : undefined;
}

/** The J v1 attribution stamp from a form_payload, if present. */
export function readAttribution(formPayload: Record<string, unknown>): AttributionView | undefined {
  const raw = formPayload?.attribution;
  if (typeof raw !== 'object' || raw === null) return undefined;
  const o = raw as Record<string, unknown>;
  const first = toTouch(o.first);
  const last = toTouch(o.last);
  if (!first && !last) return undefined;
  return { first, last };
}

/** The J v2 funnel stamp from a form_payload, if present. */
export function readFunnelStamp(
  formPayload: Record<string, unknown>,
): FunnelStampView | undefined {
  const raw = formPayload?.funnel;
  if (typeof raw !== 'object' || raw === null) return undefined;
  const o = raw as Record<string, unknown>;
  const sessionId = str(o.sessionId);
  const autofillUsed = typeof o.autofillUsed === 'boolean' ? o.autofillUsed : undefined;
  if (sessionId === undefined && autofillUsed === undefined) return undefined;
  return { sessionId, autofillUsed };
}

/** Hostname of a referrer URL, www-stripped ("https://www.google.com/" → "google.com"). */
function referrerHost(referrer: string): string | undefined {
  try {
    return new URL(referrer).hostname.replace(/^www\./, '') || undefined;
  } catch {
    return undefined;
  }
}

/**
 * One compact human label for a touch, for the order list's Source column:
 *   gclid present            → "Google Ads"
 *   utm_source[/utm_medium]  → "reddit/social"
 *   external referrer        → "google.com"
 *   captured, none of those  → "Direct"
 */
export function touchLabel(touch: TouchView | undefined): string | undefined {
  if (!touch) return undefined;
  if (touch.gclid) return 'Google Ads';
  if (touch.utmSource) {
    return touch.utmMedium ? `${touch.utmSource}/${touch.utmMedium}` : touch.utmSource;
  }
  if (touch.referrer) return referrerHost(touch.referrer) ?? 'Referral';
  return 'Direct';
}

/**
 * The Source column value for an order row: FIRST touch (the "what brought
 * them here originally" question), or undefined when no attribution was
 * captured (pre-Aug-9 orders, blocked storage).
 */
export function orderSourceLabel(formPayload: Record<string, unknown>): string | undefined {
  const attribution = readAttribution(formPayload);
  return touchLabel(attribution?.first);
}
