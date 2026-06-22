"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LogOut, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { useSidebar } from "@/components/sidebar-context";
import { studentLogout } from "@/app/s/actions";

export function StudentSidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();
  const active = pathname.startsWith("/s/courses") || pathname.startsWith("/s/");

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-[var(--border)] bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div>
            <Logo />
            <p className="mt-0.5 text-xs text-[var(--muted)]">พอร์ทัลนักเรียน</p>
          </div>
          <button
            type="button"
            onClick={close}
            className="text-[var(--muted)] hover:text-[var(--foreground)] lg:hidden"
            aria-label="ปิดเมนู"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3">
          <ul className="flex flex-col gap-1">
            <li>
              <Link
                href="/s/courses"
                onClick={close}
                className={`flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "text-[var(--foreground)] hover:bg-slate-50"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                วิชาของฉัน
              </Link>
            </li>
          </ul>
        </nav>

        <form action={studentLogout} className="border-t border-[var(--border)] p-3">
          <input type="hidden" name="redirectTo" value="/s" />
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium text-[var(--muted)] transition-colors hover:bg-slate-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            ออกจากระบบ
          </button>
        </form>
      </aside>
    </>
  );
}
