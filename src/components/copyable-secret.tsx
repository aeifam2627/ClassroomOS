"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyableSecret({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white px-2.5 py-1 font-mono font-semibold text-[var(--primary-dark)]">
      {value}
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="text-[var(--muted)] hover:text-[var(--foreground)]"
        aria-label="คัดลอก"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </span>
  );
}
