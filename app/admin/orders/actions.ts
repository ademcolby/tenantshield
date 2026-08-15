// app/admin/orders/actions.ts  — SERVER ACTIONS (Project D v3)
//
// The order LIST's write path: bulk-set the test flag on the checkbox-selected
// orders. Same rules as the drill-in's actions: server actions are public
// endpoints, so requireAdmin() runs INSIDE the action (the page-level gate
// alone would not protect it), and every path ends in redirect(...?status=X)
// so the result is visible as a banner instead of a silent re-render.
//
// The redirect preserves the admin's active filters: the form carries the
// current filter params as ctx_* hidden inputs, and only those WHITELISTED
// keys are rebuilt into the redirect URL (never a raw query string from the
// client), so mid-testing bulk flags don't dump you back to the unfiltered
// list.
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '../../../lib/adminAuth';
import { bulkUpdateIsTest } from '../../../lib/db';

// The order list's filter params — the only keys the redirect will carry.
const FILTER_KEYS = ['q', 'date', 'from', 'to', 'state', 'strength', 'type', 'customer'] as const;

export async function bulkSetTestFlag(formData: FormData): Promise<void> {
  await requireAdmin();

  // Rebuild the return query string from whitelisted ctx_* fields only.
  const qs = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = String(formData.get(`ctx_${key}`) ?? '').trim();
    if (value) qs.set(key, value);
  }

  const backTo = (status: string, n?: number): never => {
    revalidatePath('/admin/orders');
    revalidatePath('/admin'); // metrics exclude test orders, so flags move them
    qs.set('status', status);
    if (n !== undefined) qs.set('n', String(n));
    redirect(`/admin/orders?${qs.toString()}`);
  };

  const refs = formData
    .getAll('refs')
    .map((r) => String(r).trim())
    .filter(Boolean);
  if (refs.length === 0) backTo('bulk_none');

  // Two submit buttons share the form; the clicked one supplies mode.
  const mode = String(formData.get('mode') ?? '');
  if (mode !== 'test' && mode !== 'real') backTo('bulk_failed');
  const isTest = mode === 'test';

  const updated = await bulkUpdateIsTest(refs, isTest);
  if (updated < 0) backTo('bulk_failed');

  backTo(isTest ? 'bulk_flagged' : 'bulk_unflagged', updated);
}
