import { Apple, GraduationCap, PencilLine, Ruler } from "lucide-react";

const dotGrid =
  "bg-[radial-gradient(circle,var(--border)_1px,transparent_1px)] [background-size:14px_14px]";

export function AuthBackgroundDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <PencilLine className="absolute left-10 top-24 h-10 w-10 -rotate-12 text-[var(--primary)]/15" />
      <GraduationCap className="absolute right-12 top-16 h-14 w-14 text-[var(--primary)]/15" />
      <Apple className="absolute bottom-16 left-12 h-12 w-12 text-[var(--primary)]/15" />
      <Ruler className="absolute bottom-20 right-16 h-10 w-10 rotate-6 text-[var(--primary)]/15" />
      <div className={`absolute left-24 top-10 h-20 w-28 ${dotGrid}`} />
      <div className={`absolute bottom-10 right-28 h-20 w-28 ${dotGrid}`} />
    </div>
  );
}
