// lib/email.ts  (repo root /lib)  — SERVER ONLY (uses Buffer + RESEND_API_KEY)
import { Resend } from 'resend';
import { buildLetterPdfDoc, LETTER_PDF_FILENAME } from './letterPdf';

const FROM = 'TenantShield <support@gettenantshield.com>';
const SUPPORT = 'support@gettenantshield.com';
const SUBJECT = 'Your security deposit demand letter — TenantShield';
const SITE_URL = 'https://gettenantshield.com';

// Instantiate guarded so a missing key NEVER throws at import/build time. Until
// RESEND_API_KEY is set in the environment, sendLetterEmail() simply no-ops and
// returns false — letter generation and the on-screen download are unaffected.
const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

export interface LetterEmailInput {
  to: string;
  tenantName: string;
  letterText: string;
  // Project C: the TS-YYYYMMDD-XXXX order reference. Optional so older callers
  // (and any path that hasn't got one) still work; when present it is shown in
  // the receipt so the customer can quote it to support.
  refNumber?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildHtml(tenantName: string, refNumber?: string): string {
  const name = escapeHtml((tenantName || '').trim()) || 'there';
  const ref = (refNumber || '').trim();
  const refBlock = ref
    ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#374151;">Your reference number is <strong style="color:#0f172a;">${escapeHtml(ref)}</strong>. Keep it handy if you ever need to contact support about this order.</p>`
    : '';
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
      <div style="font-size:18px;font-weight:700;color:#0f172a;margin-bottom:20px;">TenantShield</div>
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:28px 24px;">
        <h1 style="margin:0 0 14px;font-size:20px;color:#0f172a;">Your demand letter is ready</h1>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Hi ${name}, your security deposit demand letter is attached to this email as a PDF. Keep this email — you can download the letter again from the attachment anytime.</p>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#374151;">Want to access your letter anytime? Visit <a href="${SITE_URL}" style="color:#b45309;font-weight:600;">gettenantshield.com</a> to create a free account or sign in — every letter you've purchased is available in your dashboard, no expiry.</p>
        ${refBlock}
        <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#0f172a;">What to do next</p>
        <ol style="margin:0 0 18px;padding-left:20px;font-size:14px;line-height:1.7;color:#374151;">
          <li>Print the attached PDF and sign it in blue or black ink.</li>
          <li>Send it to your landlord by USPS Certified Mail with Return Receipt.</li>
          <li>Keep your tracking number and the green return-receipt card.</li>
          <li>Wait for the deadline stated in the letter before taking further action.</li>
          <li>If there is no response by the deadline, the letter becomes key evidence in small claims court.</li>
        </ol>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#374151;">Questions? Just reply to this email or reach us at <a href="mailto:${SUPPORT}" style="color:#b45309;">${SUPPORT}</a>.</p>
      </div>
      <p style="margin:18px 4px 0;font-size:12px;line-height:1.6;color:#6b7280;">TenantShield generates demand letters for informational purposes. This is not legal advice. Consult an attorney for guidance specific to your situation.</p>
    </div>
  </body>
</html>`;
}

function buildText(tenantName: string, refNumber?: string): string {
  const name = (tenantName || '').trim() || 'there';
  const ref = (refNumber || '').trim();
  const lines = [
    `Hi ${name},`,
    '',
    'Your security deposit demand letter is attached to this email as a PDF. Keep this email — you can download the letter again from the attachment anytime.',
    '',
    `Want to access your letter anytime? Visit ${SITE_URL} to create a free account or sign in — every letter you've purchased is available in your dashboard, no expiry.`,
  ];
  if (ref) {
    lines.push('', `Your reference number is ${ref}. Keep it handy if you ever need to contact support about this order.`);
  }
  lines.push(
    '',
    'What to do next:',
    '1. Print the attached PDF and sign it in blue or black ink.',
    '2. Send it to your landlord by USPS Certified Mail with Return Receipt.',
    '3. Keep your tracking number and the green return-receipt card.',
    '4. Wait for the deadline stated in the letter before taking further action.',
    '5. If there is no response by the deadline, the letter becomes key evidence in small claims court.',
    '',
    `Questions? Reply to this email or reach us at ${SUPPORT}.`,
    '',
    'TenantShield generates demand letters for informational purposes. This is not legal advice. Consult an attorney for guidance specific to your situation.',
  );
  return lines.join('\n');
}

/**
 * Emails the finished letter to the customer as a PDF attachment.
 *
 * Best-effort by design: this NEVER throws. The receipt is a bonus delivery
 * channel layered on top of the on-screen download, so any failure (missing
 * key, Resend outage, bad address) must not affect the paid product. Returns
 * true only when Resend accepted the message.
 */
export async function sendLetterEmail(input: LetterEmailInput): Promise<boolean> {
  try {
    if (!resend) {
      console.warn('RESEND_API_KEY not set — skipping receipt email.');
      return false;
    }
    const to = (input.to || '').trim();
    if (!to) {
      console.warn('No recipient email — skipping receipt email.');
      return false;
    }

    const pdfBuffer = Buffer.from(buildLetterPdfDoc(input.letterText).output('arraybuffer'));

    const { error } = await resend.emails.send({
      from: FROM,
      to,
      replyTo: SUPPORT,
      subject: SUBJECT,
      html: buildHtml(input.tenantName, input.refNumber),
      text: buildText(input.tenantName, input.refNumber),
      attachments: [
        {
          filename: LETTER_PDF_FILENAME,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error('Resend send error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('sendLetterEmail unexpected error (non-fatal):', err);
    return false;
  }
}
