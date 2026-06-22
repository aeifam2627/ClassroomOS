import { BookOpen } from "lucide-react";

export function Logo({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const color = variant === "light" ? "text-white" : "text-[var(--primary-dark)]";

  return (
    <div className={`flex items-center gap-2 font-semibold ${color}`}>
      <BookOpen className="h-6 w-6 text-[var(--primary)]" strokeWidth={2.25} />
      <span className="text-xl">ClassScore</span>
    </div>
  );
}
