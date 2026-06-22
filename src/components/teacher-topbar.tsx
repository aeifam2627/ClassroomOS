"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, ClipboardList, Menu } from "lucide-react";
import { Logo } from "@/components/logo";
import { useSidebar } from "@/components/sidebar-context";
import type { PendingWorkSummary } from "@/lib/pending-work";

const MAX_NOTIFICATIONS_SHOWN = 5;

export function TeacherTopbar({
  name,
  pendingWork,
}: {
  name: string;
  pendingWork: PendingWorkSummary;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const { open } = useSidebar();
  const [notifOpen, setNotifOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!notifOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  const shownItems = pendingWork.items.slice(0, MAX_NOTIFICATIONS_SHOWN);

  return (
    <header className="flex items-center justify-between gap-4 border-b border-[var(--border)] bg-white px-4 py-3 print:hidden sm:px-6">
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

      <div className="ml-auto flex items-center gap-4">
        <div ref={panelRef} className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            className="relative rounded-full p-2 text-[var(--muted)] hover:bg-slate-50"
            aria-label="การแจ้งเตือน"
          >
            <Bell className="h-5 w-5" />
            {pendingWork.totalPending > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                {pendingWork.totalPending > 99 ? "99+" : pendingWork.totalPending}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 z-20 mt-2 w-80 rounded-2xl border border-[var(--border)] bg-white p-2 shadow-lg">
              <p className="px-3 py-2 text-sm font-semibold text-[var(--primary-dark)]">
                การแจ้งเตือน
              </p>

              {shownItems.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-[var(--muted)]">
                  ไม่มีงานค้างตรวจ 🎉
                </p>
              ) : (
                <div className="flex flex-col">
                  {shownItems.map((item) => (
                    <Link
                      key={item.itemId}
                      href={`/teacher/courses/${item.courseId}/scores?category=${item.categoryId}`}
                      onClick={() => setNotifOpen(false)}
                      className="flex items-start gap-3 rounded-[var(--radius)] px-3 py-2.5 text-left hover:bg-slate-50"
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                        <ClipboardList className="h-4 w-4" />
                      </span>
                      <span className="flex-1 text-sm">
                        <span className="block font-medium text-[var(--foreground)]">
                          {item.courseName} · ใบงานที่ {item.orderInCourse}
                        </span>
                        <span className="block text-xs text-[var(--muted)]">
                          เหลืออีก {item.pendingCount} คนที่ยังไม่มีคะแนน
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              <Link
                href="/teacher/pending"
                onClick={() => setNotifOpen(false)}
                className="mt-1 block rounded-[var(--radius)] px-3 py-2 text-center text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary)]/5"
              >
                ดูทั้งหมด
              </Link>
            </div>
          )}
        </div>

        <Link href="/teacher/settings" className="flex items-center gap-2 rounded-full hover:opacity-80">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary)]/10 text-sm font-semibold text-[var(--primary)]">
            {initial}
          </span>
          <div className="hidden text-sm sm:block">
            <p className="font-medium text-[var(--foreground)]">{name}</p>
            <p className="text-xs text-[var(--muted)]">ครูผู้สอน</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
