// app/admin/CopyButton.tsx  — CLIENT (Project D)
//
// Small copy-to-clipboard affordance used in the admin drill-in view (ref #,
// email, Stripe session id). Shows a brief "Copied" confirmation.
'use client';

import { useEffect, useRef, useState } from 'react';

export default function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopied(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        // Clipboard can be unavailable (permissions, non-secure context).
        // Fail silently — the value is visible on screen to copy manually.
      });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-md border border-[#E7E5E0] bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 transition hover:text-slate-900"
      aria-label="Copy to clipboard"
    >
      {copied ? 'Copied ✓' : 'Copy'}
    </button>
  );
}
