"use client";

import { X } from "lucide-react";
import { useConfirmSubmit } from "@/lib/use-confirm-submit";

export function PillRemoveButton({
  action,
  hiddenFields,
  confirmMessage,
}: {
  action: (formData: FormData) => void;
  hiddenFields: Record<string, string>;
  confirmMessage: string;
}) {
  const onSubmit = useConfirmSubmit(confirmMessage, { danger: true });

  return (
    <form action={action} className="inline" onSubmit={onSubmit}>
      {Object.entries(hiddenFields).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <button type="submit" className="ml-1 text-current/60 hover:text-red-600" aria-label="นำออก">
        <X className="h-3 w-3" />
      </button>
    </form>
  );
}
