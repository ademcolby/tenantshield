// app/admin/orders/SelectAllCheckbox.tsx  — CLIENT (Project D v3)
//
// The header "select all" checkbox for the bulk test-flag form. The rows are
// server-rendered, so this simply toggles every input[name="refs"] in its own
// form via the DOM — no state, no re-render, and the page stays otherwise
// server-only. (One of the two deliberate client islands added in v3; the
// other is TableScroller.)
'use client';

export default function SelectAllCheckbox() {
  return (
    <input
      type="checkbox"
      aria-label="Select all orders on this page"
      className="h-4 w-4 rounded border-[#E7E5E0] accent-[#B45309]"
      onChange={(e) => {
        const form = e.currentTarget.form;
        if (!form) return;
        const checked = e.currentTarget.checked;
        form
          .querySelectorAll<HTMLInputElement>('input[name="refs"]')
          .forEach((cb) => {
            cb.checked = checked;
          });
      }}
    />
  );
}
