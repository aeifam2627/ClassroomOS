import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-3 px-4 text-center ${compact ? "py-6" : "py-12"}`}
    >
      <div
        className={`flex items-center justify-center rounded-full bg-[var(--primary)]/10 ${
          compact ? "h-10 w-10" : "h-14 w-14"
        }`}
      >
        <Icon className={`text-[var(--primary)] ${compact ? "h-5 w-5" : "h-7 w-7"}`} />
      </div>
      <div>
        <p className="font-medium text-[var(--foreground)]">{title}</p>
        {description && <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>}
      </div>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-2 flex items-center gap-2 rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary)]/90"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
