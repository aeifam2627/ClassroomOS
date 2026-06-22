"use client";

import { Menu } from "lucide-react";
import { Logo } from "@/components/logo";
import { useSidebar } from "@/components/sidebar-context";
import { StudentAvatar } from "@/components/student-avatar";
import { formatStudentFullName } from "@/lib/student-name";

export function StudentTopbar({ name, title }: { name: string; title: string }) {
  const { open } = useSidebar();

  return (
    <header className="flex items-center justify-between gap-4 border-b border-[var(--border)] bg-white px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3 lg:hidden">
        <button
          type="button"
          onClick={open}
          className="rounded-full p-2 text-[var(--muted)] hover:bg-slate-50"
          aria-label="เปิดเมนู"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Logo />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <StudentAvatar name={name} title={title} size={36} />
        <div className="hidden text-sm sm:block">
          <p className="font-medium text-[var(--foreground)]">{formatStudentFullName(title, name)}</p>
          <p className="text-xs text-[var(--muted)]">นักเรียน</p>
        </div>
      </div>
    </header>
  );
}
