import type { TextareaHTMLAttributes } from "react";

export function FormTextarea({
  label,
  name,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; name: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <textarea
        name={name}
        rows={3}
        {...props}
        className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
      />
    </label>
  );
}
