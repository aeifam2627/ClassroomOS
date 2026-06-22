import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  pageSize,
  total,
  buildHref,
}: {
  page: number;
  pageSize: number;
  total: number;
  buildHref: (page: number) => string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const windowStart = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => windowStart + i);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)]">
      <span>
        แสดง {from} ถึง {to} จาก {total} รายการ
      </span>
      <div className="flex items-center gap-1">
        <Link
          href={buildHref(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={`rounded-full p-1.5 ${page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-slate-100"}`}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        {pages.map((p) => (
          <Link
            key={p}
            href={buildHref(p)}
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              p === page ? "bg-[var(--primary)] text-white" : "hover:bg-slate-100"
            }`}
          >
            {p}
          </Link>
        ))}
        <Link
          href={buildHref(Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          className={`rounded-full p-1.5 ${page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-slate-100"}`}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
