// app/admin/DownloadPdfButton.tsx  — CLIENT (Project D)
//
// Rebuilds and downloads the letter PDF using the SAME shared builder
// (lib/letterPdf.ts) as the success page, the receipt email, and the customer
// dashboard — so the admin's copy is byte-identical to what the customer
// received.
//
// W1 fix (post-launch batch 1): letter text is fetched from
// /api/admin/letter-text AT CLICK TIME instead of being baked in at page
// render. Previously, a download clicked after a regeneration but before a
// page refresh served the OLD letter (stale RSC payload in the client router
// cache). On fetch failure we surface an error and download NOTHING — falling
// back to the render-time text would silently re-introduce the bug.
'use client';

import { useState } from 'react';
import { buildLetterPdfDoc, LETTER_PDF_FILENAME } from '../../lib/letterPdf';

export default function DownloadPdfButton({ refNumber }: { refNumber: string }) {
  const [busy, setBusy] = useState(false);

  const handleDownload = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/letter-text?ref=${encodeURIComponent(refNumber)}`,
        { cache: 'no-store' },
      );
      if (!res.ok) throw new Error(`letter-text fetch failed (${res.status})`);
      const { letterText } = (await res.json()) as { letterText?: string };
      if (!letterText) throw new Error('letter-text response missing letterText');
      buildLetterPdfDoc(letterText).save(LETTER_PDF_FILENAME);
    } catch (err) {
      console.error('DownloadPdfButton:', err);
      alert('Could not fetch the current letter text — PDF not downloaded. Refresh and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-full border border-[#E7E5E0] bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:text-slate-900 disabled:cursor-wait disabled:opacity-60"
    >
      {busy ? 'Preparing…' : 'Download PDF'}
    </button>
  );
}
