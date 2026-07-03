// app/admin/DownloadPdfButton.tsx  — CLIENT (Project D)
//
// Rebuilds and downloads the letter PDF from stored letter text, using the
// SAME shared builder (lib/letterPdf.ts) as the success page, the receipt
// email, and the customer dashboard — so the admin's copy is byte-identical
// to what the customer received.
'use client';

import { buildLetterPdfDoc, LETTER_PDF_FILENAME } from '../../lib/letterPdf';

export default function DownloadPdfButton({ letterText }: { letterText: string }) {
  const handleDownload = () => {
    buildLetterPdfDoc(letterText).save(LETTER_PDF_FILENAME);
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="inline-flex items-center gap-1.5 rounded-full border border-[#E7E5E0] bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:text-slate-900"
    >
      Download PDF
    </button>
  );
}
