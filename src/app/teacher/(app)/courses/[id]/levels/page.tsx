import Link from "next/link";
import { notFound } from "next/navigation";
import { Sparkles, Trophy, Medal, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StudentAvatar } from "@/components/student-avatar";
import { EmptyState } from "@/components/empty-state";
import { formatStudentFullName } from "@/lib/student-name";
import { getCourseXpBoard } from "@/lib/xp";

const RANK_ICON_CLASS: Record<number, string> = {
  1: "text-amber-500",
  2: "text-slate-400",
  3: "text-orange-700",
};

export default async function TeacherLevelsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: courseId } = await params;

  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id, name")
    .eq("id", courseId)
    .single();

  if (!course) notFound();

  const entries = await getCourseXpBoard(courseId);

  return (
    <div>
      <p className="mb-1 text-sm text-[var(--muted)]">
        <Link href="/teacher/courses" className="hover:underline">
          รายวิชา
        </Link>{" "}
        <span className="mx-1">{">"}</span>
        {course.name}
      </p>

      <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold text-[var(--primary-dark)]">
        <Sparkles className="h-6 w-6" />
        เลเวลนักเรียน - {course.name}
      </h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        XP คำนวณอัตโนมัติจากพฤติกรรมการส่งงาน (ตรงเวลา/สาย/ส่งต่อเนื่อง) เป็นหลัก และคะแนนจริงเป็นตัวเสริม
        — แยกจาก Leaderboard ที่ครูให้แต้มเอง
      </p>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
        <div className="border-b border-[var(--border)] px-5 py-3">
          <p className="text-sm font-semibold text-[var(--primary-dark)]">อันดับตาม XP รวม</p>
        </div>

        {entries.length === 0 ? (
          <EmptyState
            icon={Users}
            title="วิชานี้ยังไม่มีนักเรียน"
            description="เพิ่มนักเรียนเข้าวิชานี้เพื่อเริ่มเห็นเลเวล"
            actionHref={`/teacher/courses/${courseId}/students/new`}
            actionLabel="ไปเพิ่มนักเรียน"
          />
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {entries.map((entry) => (
              <div key={entry.studentId} className="flex items-center gap-3 px-5 py-3">
                <span
                  className={`w-6 text-center font-bold ${RANK_ICON_CLASS[entry.rank] ?? "text-[var(--muted)]"}`}
                >
                  {entry.rank <= 3 ? (
                    entry.rank === 1 ? (
                      <Trophy className="h-5 w-5" />
                    ) : (
                      <Medal className="h-5 w-5" />
                    )
                  ) : (
                    entry.rank
                  )}
                </span>
                <StudentAvatar name={entry.name} title={entry.title} size={28} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {formatStudentFullName(entry.title, entry.name)}
                  </p>
                  <p className="text-xs text-[var(--muted)]">{entry.studentCode}</p>
                  <div className="mt-1 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[var(--primary)]"
                      style={{ width: `${entry.level.progressPercent}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[var(--primary)]">เลเวล {entry.level.level}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {entry.level.totalXp.toLocaleString("th-TH")} XP
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
