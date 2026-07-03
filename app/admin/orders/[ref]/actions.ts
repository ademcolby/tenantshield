// app/admin/orders/[ref]/actions.ts  — SERVER ACTION (Project D)
//
// Saves the admin note + test flag from the drill-in view. Server actions are
// public endpoints (they can be invoked outside our UI), so requireAdmin()
// runs HERE as well as in the page — the page gate alone would not protect
// this write path.
'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '../../../../lib/adminAuth';
import { updateOrderAdminFields } from '../../../../lib/db';

export async function saveAdminFields(formData: FormData): Promise<void> {
  await requireAdmin();

  const ref = String(formData.get('ref') ?? '').trim();
  if (!ref) return;

  const noteRaw = String(formData.get('admin_note') ?? '').trim();
  const isTest = formData.get('is_test') === 'on';

  await updateOrderAdminFields(ref, {
    adminNote: noteRaw || null,
    isTest,
  });

  // Refresh everything that displays these fields.
  revalidatePath(`/admin/orders/${ref}`);
  revalidatePath('/admin/orders');
  revalidatePath('/admin');
}
