"use client";

import type { ReactNode } from "react";
import { useConfirmSubmit } from "@/lib/use-confirm-submit";

export function ConfirmSubmitButton({
  action,
  confirmMessage,
  hiddenFields,
  className,
  children,
}: {
  action: (formData: FormData) => void;
  confirmMessage: string;
  hiddenFields: Record<string, string>;
  className?: string;
  children: ReactNode;
}) {
  const onSubmit = useConfirmSubmit(confirmMessage, { danger: true });

  return (
    <form action={action} onSubmit={onSubmit}>
      {Object.entries(hiddenFields).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
