"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MoreVertical } from "lucide-react";
import { useConfirmSubmit } from "@/lib/use-confirm-submit";

export function CardActionsMenu({
  editHref,
  deleteAction,
  deleteHiddenFields,
  deleteConfirmMessage,
}: {
  editHref: string;
  deleteAction: (formData: FormData) => void;
  deleteHiddenFields: Record<string, string>;
  deleteConfirmMessage: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const onDeleteSubmit = useConfirmSubmit(deleteConfirmMessage, {
    danger: true,
    title: "ยืนยันการลบ",
    onConfirmed: () => setOpen(false),
  });

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[var(--muted)] hover:text-[var(--foreground)]"
        aria-label="ตัวเลือก"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-6 z-10 w-32 overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-white shadow-lg">
          <Link
            href={editHref}
            className="block px-3 py-2 text-sm hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            แก้ไข
          </Link>
          <form action={deleteAction} onSubmit={onDeleteSubmit}>
            {Object.entries(deleteHiddenFields).map(([key, value]) => (
              <input key={key} type="hidden" name={key} value={value} />
            ))}
            <button
              type="submit"
              className="block w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50"
            >
              ลบ
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
