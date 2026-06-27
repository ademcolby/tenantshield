// lib/letterPdf.ts  (repo root /lib)
import jsPDF from 'jspdf';

/**
 * Single source of truth for the demand-letter PDF layout.
 *
 * Imported by BOTH of these, which must stay byte-for-byte identical:
 *   - app/success/page.tsx              -> on-screen "Download PDF" button
 *   - app/api/generate-letter/route.ts  -> the PDF attached to the receipt email
 *
 * If the layout ever changes, it changes here once and both outputs follow.
 * This module is isomorphic (no Node-only globals), so it is safe to import
 * from the client success page and from the server route alike. The server
 * route does its own Buffer conversion via output('arraybuffer').
 *
 * The letter is the customer's OWN correspondence, so NOTHING about TenantShield
 * is printed on it: no header, no footer disclaimer, no branding. The only
 * footer is a neutral "Page X of Y", and only when the letter runs past a single
 * page (preserves the prior P11 footer-placement fix).
 */
export const LETTER_PDF_FILENAME = 'Security_Deposit_Demand_Letter.pdf';

export function buildLetterPdfDoc(letterText: string): jsPDF {
  const pdf = new jsPDF({ unit: 'pt', format: 'letter' });

  const pageWidth = 612;
  const pageHeight = 792;
  const marginX = 40;
  const contentTop = 80;
  const bottomMargin = 56; // unchanged, so pagination matches prior behavior
  const lineHeight = 14;
  const maxY = pageHeight - bottomMargin;

  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);

  const lines = pdf.splitTextToSize(letterText, pageWidth - marginX * 2);
  let y = contentTop;

  lines.forEach((line: string) => {
    if (y > maxY) {
      pdf.addPage();
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      y = contentTop;
    }
    pdf.text(line, marginX, y);
    y += lineHeight;
  });

  // Neutral page numbers, added ONLY when the letter runs to more than one page.
  const pageCount = pdf.getNumberOfPages();
  if (pageCount > 1) {
    pdf.setFontSize(9);
    pdf.setTextColor(120, 120, 120);
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      const label = `Page ${i} of ${pageCount}`;
      const labelWidth = pdf.getTextWidth(label);
      pdf.text(label, pageWidth - marginX - labelWidth, pageHeight - 36);
    }
  }

  return pdf;
}
