import type { InputHTMLAttributes } from "react";

export function FormField({
  label,
  name,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <input
        type="text"
        name={name}
        required
        {...props}
        className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
      />
    </label>
  );
}
