// app/admin/orders/export/route.ts  — SERVER ROUTE (Project D v2)
//
// CSV export of ALL orders (including test orders — is_test is an explicit
// column so it can be filtered in Excel; decided in scoping for
// bookkeeping/reconciliation use). Gated by requireAdmin() like every other
// /admin surface: non-admins are redirected before any data is read.
import { requireAdmin } from '../../../../lib/adminAuth';
import { getAllOrdersForExport } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

// RFC-4180-ish escaping: always quote, double any internal quotes, and
// flatten newlines (notes can be multi-line) so every order stays one row.
function csvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const s = String(value).replace(/"/g, '""').replace(/\r?\n/g, ' / ');
  return `"${s}"`;
}

export async function GET(): Promise<Response> {
  await requireAdmin();

  const orders = await getAllOrdersForExport();

  const header = [
    'ref_number',
    'created_at',
    'email',
    'tenant_name',
    'state',
    'city',
    'deposit_amount_usd',
    'amount_paid_usd',
    'case_strength',
    'is_test',
    'admin_note',
    'stripe_session_id',
    'user_id',
  ];

  const rows = orders.map((o) =>
    [
      csvCell(o.refNumber),
      csvCell(o.createdAt),
      csvCell(o.email),
      csvCell(o.tenantName),
      csvCell(o.state),
      csvCell(o.city),
      csvCell(o.depositAmount.toFixed(2)),
      // Blank (not 0) when unrecorded, so estimates never masquerade as data.
      csvCell(o.amountPaidCents !== undefined ? (o.amountPaidCents / 100).toFixed(2) : ''),
      csvCell(o.caseStrength ?? ''),
      csvCell(o.isTest),
      csvCell(o.adminNote ?? ''),
      csvCell(o.stripeSessionId),
      csvCell(o.userId ?? ''),
    ].join(','),
  );

  const csv = [header.map(csvCell).join(','), ...rows].join('\r\n');
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="tenantshield-orders-${today}.csv"`,
    },
  });
}
