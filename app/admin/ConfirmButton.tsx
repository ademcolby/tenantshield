// app/admin/ConfirmButton.tsx  — CLIENT (Project D v2)
//
// A submit button that asks for confirmation before letting the form submit.
// Used for the Regenerate action, which costs an Anthropic call and
// overwrites the stored letter — it deserves one deliberate click of friction.
'use client';

export default function ConfirmButton({
  message,
  className,
  children,
}: {
  message: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
