"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, LayoutDashboard, LogOut, Settings, Users, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Logo } from "@/components/logo";
import { useSidebar } from "@/components/sidebar-context";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
};

const navItems: NavItem[] = [
  { label: "หน้าหลัก", href: "/teacher/dashboard", icon: LayoutDashboard },
  { label: "จัดการรายวิชา", href: "/teacher/courses", icon: BookOpen },
  { label: "นักเรียน", href: "/teacher/students", icon: Users },
  { label: "รายงาน", href: "/teacher/reports", icon: BarChart3 },
  { label: "ตั้งค่า", href: "/teacher/settings", icon: Settings, disabled: true },
];

export function TeacherSidebar({
  logoutAction,
}: {
  logoutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();

  return (
    <>
      {/* backdrop มือถือ: คลิกข้างนอกเพื่อปิด — จอใหญ่ไม่ต้องมีเพราะ sidebar เป็น static อยู่แล้ว */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-[var(--border)] bg-white transition-transform duration-200 print:hidden lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Logo />
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
            {navItems.map(({ label, href, icon: Icon, disabled }) => {
              const active = !disabled && pathname.startsWith(href);

              if (disabled) {
                return (
                  <li key={href}>
                    <span className="flex cursor-not-allowed items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm text-[var(--muted)]/60">
                      <Icon className="h-4 w-4" />
                      {label}
                      <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px]">
                        เร็วๆนี้
                      </span>
                    </span>
                  </li>
                );
              }

              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={close}
                    className={`flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                        : "text-[var(--foreground)] hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <form action={logoutAction} className="border-t border-[var(--border)] p-3">
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
