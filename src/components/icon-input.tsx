import type { InputHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

export function IconInput({
  icon: Icon,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { icon: LucideIcon }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
      <input
        {...props}
        className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white py-2.5 pr-4 pl-10 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
      />
    </div>
  );
}
