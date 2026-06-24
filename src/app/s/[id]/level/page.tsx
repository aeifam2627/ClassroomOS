import { cookies } from "next/headers";
import Link from "next/link";
import { CalendarClock, Flame, Sparkles } from "lucide-react";
import { STUDENT_SESSION_COOKIE, verifySessionToken } from "@/lib/student-session";
import { getStudentXp } from "@/lib/xp";

export default async function StudentLevelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: courseId } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get(STUDENT_SESSION_COOKIE)?.value;
  const session = token ? verifySessionToken(token) : null;

  if (!session) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Sparkles className="h-10 w-10 text-[var(--primary)]" />
        <h1 className="text-xl font-bold text-[var(--primary-dark)]">กรุณาเข้าสู่ระบบก่อน</h1>
        <Link
          href={`/s/${courseId}`}
          className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary)]/90"
        >
          กลับไปเข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  const summary = await getStudentXp(courseId, session.studentId);

  if (!summary) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Sparkles className="h-10 w-10 text-[var(--primary)]" />
        <h1 className="text-xl font-bold text-[var(--primary-dark)]">คุณไม่ได้ลงทะเบียนวิชานี้</h1>
        <Link
          href="/s/courses"
          className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary)]/90"
        >
          ดูวิชาของฉัน
        </Link>
      </div>
    );
  }

  const { level, items } = summary;
  const sortedItems = [...items].sort((a, b) => b.points - a.points);

  return (
    <div>
      <p className="mb-1 text-sm text-[var(--muted)]">
        <Link href={`/s/${courseId}`} className="hover:underline">
          กลับไปหน้าวิชา
        </Link>
      </p>

      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold text-[var(--primary-dark)]">
        <Sparkles className="h-6 w-6" />
        เลเวลของฉัน
      </h1>

      <div className="mb-6 rounded-2xl border border-[var(--border)] bg-white p-6 text-center">
        <p className="text-sm text-[var(--muted)]">เลเวลปัจจุบัน</p>
        <p className="text-5xl font-bold text-[var(--primary)]">{level.level}</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {level.totalXp.toLocaleString("th-TH")} XP สะสม
        </p>

        <div className="mx-auto mt-4 h-3 w-full max-w-sm overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[var(--primary)]"
            style={{ width: `${level.progressPercent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">
          อีก {Math.max(0, level.nextLevelThreshold - level.totalXp).toLocaleString("th-TH")} XP จะถึงเลเวล{" "}
          {level.level + 1}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
        <div className="border-b border-[var(--border)] px-5 py-3">
          <p className="text-sm font-semibold text-[var(--primary-dark)]">XP ที่ได้รับ</p>
        </div>

        {sortedItems.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-[var(--muted)]">
            ยังไม่มี XP — ลองส่งงานตรงเวลาดูสิ!
          </p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {sortedItems.map((item) => (
              <div key={`${item.kind}-${item.gradeItemId}`} className="flex items-center gap-3 px-5 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                  {item.kind === "streak" ? (
                    <Flame className="h-4 w-4" />
                  ) : (
                    <CalendarClock className="h-4 w-4" />
                  )}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {item.kind === "streak" ? "ส่งตรงเวลาต่อกันครบ 3 ชิ้น" : item.title}
                  </p>
                  <p className="text-xs text-[var(--muted)]">{item.categoryName}</p>
                </div>
                <p className="text-sm font-semibold text-[var(--primary)]">+{item.points} XP</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
