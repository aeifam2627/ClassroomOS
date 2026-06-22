"use client";

import { KeyRound } from "lucide-react";
import { useConfirmSubmit } from "@/lib/use-confirm-submit";

export function ResetPinButton({
  action,
  hiddenFields,
}: {
  action: (formData: FormData) => void;
  hiddenFields: Record<string, string>;
}) {
  const onSubmit = useConfirmSubmit("รีเซ็ต PIN ใหม่ให้นักเรียนคนนี้? PIN เดิมจะใช้ไม่ได้อีก", {
    danger: true,
    title: "ยืนยันการรีเซ็ต PIN",
  });

  return (
    <form action={action} onSubmit={onSubmit}>
      {Object.entries(hiddenFields).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <button type="submit" className="text-amber-500 hover:opacity-70" aria-label="รีเซ็ต PIN">
        <KeyRound className="h-4 w-4" />
      </button>
    </form>
  );
}
