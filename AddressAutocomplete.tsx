// AddressAutocomplete.tsx  (repo root) — CLIENT (Aug 2026 address autofill)
//
// A street-address <input> with Google Places (New) autocomplete layered ON
// TOP: type a few characters, pick a real address, and onSelectAddress fires
// with parsed components so the parent can fill city/state/ZIP. Design rules:
//
//  - PROGRESSIVE ENHANCEMENT ONLY. With no API key configured, on any network
//    or API error, or if the user ignores the dropdown, this behaves exactly
//    like the plain input it replaces — manual typing is never blocked (new
//    construction, PO boxes, rural routes all still work).
//  - The parent owns all form state. This component only reports the raw text
//    (onChangeText) and, on selection, the parsed parts (onSelectAddress).
//    Apt/Unit stays a separate manual field — Google predictions drop unit
//    numbers, so autofill must never touch it.
//  - WIZARD INTEGRATION: the form advances a step on Enter. While the
//    suggestion list is OPEN, Enter selects the highlighted suggestion and
//    stops propagation so the step does NOT advance; when it's closed, Enter
//    passes through untouched. Escape closes the list (and is swallowed).
//  - COST GUARDS (Google bills per session; 10K autocomplete requests/month
//    free): 300ms debounce, 4-char minimum, max 5 suggestions, and a session
//    token that spans typing + the Place Details call and is regenerated
//    after each selection (Google's session pricing requires exactly this).
//    Details uses a FieldMask of addressComponents only (Essentials tier).
//
// Key: NEXT_PUBLIC_GOOGLE_PLACES_API_KEY (browser-exposed BY DESIGN — it must
// be locked to our domains via HTTP-referrer restriction in Google Cloud
// Console, with only "Places API (New)" enabled and a daily quota cap).
'use client';

import { useEffect, useRef, useState } from 'react';

// What a selection parses into. stateFullName is Google's long name
// ("Florida"), which matches the form's US_STATES / STATE_ABBR vocabulary.
// county + sublocality exist for jurisdiction mapping (Cook County overlay,
// NYC boroughs) — the FORM decides what they mean, not this component.
export interface AutofillAddress {
  street: string; // "1428 Magnolia Ave" (street_number + route)
  city: string; // best-effort locality (with sublocality/postal_town fallbacks)
  stateFullName: string; // administrative_area_level_1 long name
  zip: string; // postal_code (may be blank for some places)
  county: string; // administrative_area_level_2, e.g. "Cook County"
  sublocality: string; // e.g. "Brooklyn"
}

interface Suggestion {
  placeId: string;
  label: string;
}

interface PlacePredictionJson {
  placeId?: string;
  text?: { text?: string };
}
interface AutocompleteResponseJson {
  suggestions?: { placePrediction?: PlacePredictionJson }[];
}
interface AddressComponentJson {
  types?: string[];
  longText?: string;
  shortText?: string;
}
interface PlaceDetailsJson {
  addressComponents?: AddressComponentJson[];
}

const KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || '';
const MIN_CHARS = 4;
const DEBOUNCE_MS = 300;
const MAX_SUGGESTIONS = 5;

function newSessionToken(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export default function AddressAutocomplete({
  value,
  onChangeText,
  onSelectAddress,
  placeholder,
  className,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSelectAddress: (address: AutofillAddress) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [active, setActive] = useState(-1);
  const sessionRef = useRef<string>(newSessionToken());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (blurRef.current) clearTimeout(blurRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const close = () => {
    setOpen(false);
    setItems([]);
    setActive(-1);
  };

  const fetchSuggestions = async (input: string) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': KEY },
        body: JSON.stringify({
          input,
          sessionToken: sessionRef.current,
          includedRegionCodes: ['us'],
        }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`autocomplete ${res.status}`);
      const data = (await res.json()) as AutocompleteResponseJson;
      const list: Suggestion[] = (data.suggestions || [])
        .map((s) => s.placePrediction)
        .filter((p): p is PlacePredictionJson => Boolean(p))
        .slice(0, MAX_SUGGESTIONS)
        .map((p) => ({ placeId: p.placeId || '', label: p.text?.text || '' }))
        .filter((p) => p.placeId && p.label);
      setItems(list);
      setActive(list.length > 0 ? 0 : -1);
      setOpen(list.length > 0);
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        console.warn('AddressAutocomplete suggestions:', err);
        close();
      }
    }
  };

  const handleChange = (v: string) => {
    onChangeText(v);
    if (!KEY) return; // no key configured — plain input behavior
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = v.trim();
    if (trimmed.length < MIN_CHARS) {
      close();
      return;
    }
    debounceRef.current = setTimeout(() => fetchSuggestions(trimmed), DEBOUNCE_MS);
  };

  const select = async (item: Suggestion) => {
    close();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const token = sessionRef.current;
    // The Details call terminates the billing session; the NEXT lookup gets a
    // fresh token whether this call succeeds or fails.
    sessionRef.current = newSessionToken();
    try {
      const res = await fetch(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(item.placeId)}?sessionToken=${encodeURIComponent(token)}`,
        { headers: { 'X-Goog-Api-Key': KEY, 'X-Goog-FieldMask': 'addressComponents' } },
      );
      if (!res.ok) throw new Error(`place details ${res.status}`);
      const data = (await res.json()) as PlaceDetailsJson;
      const comps = data.addressComponents || [];
      const get = (type: string): string => {
        const c = comps.find((c) => c.types?.includes(type));
        return c?.longText || c?.shortText || '';
      };
      const street = [get('street_number'), get('route')].filter(Boolean).join(' ');
      const city =
        get('locality') ||
        get('sublocality_level_1') ||
        get('sublocality') ||
        get('postal_town') ||
        get('administrative_area_level_3') ||
        get('neighborhood');
      onSelectAddress({
        street,
        city,
        stateFullName: get('administrative_area_level_1'),
        zip: get('postal_code'),
        county: get('administrative_area_level_2'),
        sublocality: get('sublocality_level_1') || get('sublocality'),
      });
    } catch (err) {
      // Selection failed — the user's typed text is untouched; they can keep
      // typing manually. Never write a half-parsed address.
      console.warn('AddressAutocomplete details:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // List closed: do nothing — Enter bubbles to the form's step-advance.
    if (!open || items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a <= 0 ? items.length - 1 : a - 1));
    } else if (e.key === 'Enter') {
      // Select instead of advancing the wizard step.
      e.preventDefault();
      e.stopPropagation();
      void select(items[active >= 0 ? active : 0]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (blurRef.current) clearTimeout(blurRef.current);
          blurRef.current = setTimeout(close, 150);
        }}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
      />
      {open && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-[#E7E5E0] bg-white shadow-lg"
        >
          {items.map((item, i) => (
            <li
              key={item.placeId}
              role="option"
              aria-selected={i === active}
              // onMouseDown + preventDefault so the input's blur doesn't close
              // the list before the click lands.
              onMouseDown={(e) => {
                e.preventDefault();
                void select(item);
              }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-3 py-2 text-sm text-slate-800 ${
                i === active ? 'bg-[#FAFAF7]' : ''
              }`}
            >
              {item.label}
            </li>
          ))}
          <li
            aria-hidden="true"
            className="border-t border-[#E7E5E0] px-3 py-1 text-right text-[10px] text-slate-400"
          >
            Powered by Google
          </li>
        </ul>
      )}
    </div>
  );
}
