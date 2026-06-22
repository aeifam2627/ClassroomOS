"use client";

import { Trash2 } from "lucide-react";
import { useConfirmSubmit } from "@/lib/use-confirm-submit";

export function ConfirmDeleteButton({
  action,
  confirmMessage,
  hiddenFields,
  label,
}: {
  action: (formData: FormData) => void;
  confirmMessage: string;
  hiddenFields: Record<string, string>;
  label?: string;
}) {
  const onSubmit = useConfirmSubmit(confirmMessage, { danger: true, title: "ยืนยันการลบ" });

  return (
    <form action={action} onSubmit={onSubmit}>
      {Object.entries(hiddenFields).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <button
        type="submit"
        aria-label="ลบ"
        className={
          label
            ? "flex items-center gap-1.5 rounded-full border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
            : "text-red-500 hover:opacity-70"
        }
      >
        <Trash2 className="h-4 w-4" />
        {label}
      </button>
    </form>
  );
}
