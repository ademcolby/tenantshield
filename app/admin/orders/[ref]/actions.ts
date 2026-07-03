// app/admin/orders/[ref]/actions.ts  — SERVER ACTIONS (Project D)
//
// The admin drill-in's write paths. Server actions are public endpoints (they
// can be invoked outside our UI), so requireAdmin() runs in EVERY action —
// the page-level gate alone would not protect these.
//
// v2 pattern: every action finishes with redirect(...?status=X) so the page
// re-renders with a visible confirmation/error banner (the v1 "did it save?"
// gap). redirect() throws internally, so it must be the last statement on
// each path.
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '../../../../lib/adminAuth';
import {
  getOrderByRef,
  updateOrderAdminFields,
  regenerateOrderLetter,
} from '../../../../lib/db';
import { sendLetterEmail } from '../../../../lib/email';
import {
  regenerateLetterFromForm,
  type FormData as LetterFormData,
} from '../../../../lib/generateLetterCore';

function detailPath(ref: string): string {
  return `/admin/orders/${encodeURIComponent(ref)}`;
}

function refreshAndRedirect(ref: string, status: string): never {
  revalidatePath(detailPath(ref));
  revalidatePath('/admin/orders');
  revalidatePath('/admin');
  redirect(`${detailPath(ref)}?status=${status}`);
}

/** Save the admin note + test flag (the only writable order fields in /admin). */
export async function saveAdminFields(formData: FormData): Promise<void> {
  await requireAdmin();

  const ref = String(formData.get('ref') ?? '').trim();
  if (!ref) redirect('/admin/orders');

  const noteRaw = String(formData.get('admin_note') ?? '').trim();
  const isTest = formData.get('is_test') === 'on';

  const ok = await updateOrderAdminFields(ref, {
    adminNote: noteRaw || null,
    isTest,
  });

  refreshAndRedirect(ref, ok ? 'saved' : 'save_failed');
}

/**
 * Re-send the receipt email (with PDF) to the order's email address.
 * Deliberately bypasses the paid pipeline's Redis idempotency flag — a manual
 * admin resend should ALWAYS attempt to send.
 */
export async function resendReceiptEmail(formData: FormData): Promise<void> {
  await requireAdmin();

  const ref = String(formData.get('ref') ?? '').trim();
  if (!ref) redirect('/admin/orders');

  const order = await getOrderByRef(ref);
  if (!order) redirect('/admin/orders');

  const sent = await sendLetterEmail({
    to: order.email,
    tenantName: order.tenantName,
    letterText: order.letterText,
    refNumber: order.refNumber,
  });

  refreshAndRedirect(ref, sent ? 'resent' : 'resend_failed');
}

/**
 * Regenerate the letter from the order's stored form payload.
 *
 * Overwrite semantics (decided in scoping): on SUCCESS the old letter_text is
 * overwritten (no history) and "[Regenerated {date} by admin]" is appended to
 * the admin note. On ANY non-letter outcome (missing_info / out_of_scope /
 * error) NOTHING is written — the original letter stays intact and the banner
 * explains why.
 */
export async function regenerateLetter(formData: FormData): Promise<void> {
  await requireAdmin();

  const ref = String(formData.get('ref') ?? '').trim();
  if (!ref) redirect('/admin/orders');

  const order = await getOrderByRef(ref);
  if (!order) redirect('/admin/orders');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('regenerateLetter: ANTHROPIC_API_KEY is not set');
    refreshAndRedirect(ref, 'regen_error');
  }

  const result = await regenerateLetterFromForm(
    order.formPayload as unknown as LetterFormData,
    apiKey as string,
  );

  if (result.kind === 'letter') {
    const dateStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const ok = await regenerateOrderLetter(
      ref,
      result.letter,
      `[Regenerated ${dateStr} by admin]`,
    );
    refreshAndRedirect(ref, ok ? 'regenerated' : 'regen_error');
  }

  if (result.kind === 'missing_info') refreshAndRedirect(ref, 'regen_missing_info');
  if (result.kind === 'out_of_scope') refreshAndRedirect(ref, 'regen_out_of_scope');

  console.error('regenerateLetter error:', result.kind === 'error' ? result.message : result);
  refreshAndRedirect(ref, 'regen_error');
}
