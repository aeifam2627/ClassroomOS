import Link from "next/link";
import { BookCopy, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";

export default async function TeacherLeaderboardPickerPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("courses")
    .select("id, code, name, term, academic_year, section, course_students(count)");

  // เรียงตามลำดับเวลาจริง (ปีการศึกษาเก่า→ใหม่ แล้วภาคเรียน 1→2→3) ด้วยตัวเลขจริง กันปัญหาเรียงผิดแบบ text
  const courses = [...(data ?? [])].sort((a, b) => {
    const yearDiff = Number(a.academic_year) - Number(b.academic_year);
    if (yearDiff !== 0) return yearDiff;
    const termDiff = Number(a.term) - Number(b.term);
    if (termDiff !== 0) return termDiff;
    return a.code.localeCompare(b.code);
  });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-[var(--primary-dark)]">Leaderboard</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        เลือกวิชาที่ต้องการเปิด Leaderboard แบบเต็มจอ เหมาะสำหรับฉายให้นักเรียนดูในห้องเรียน
      </p>

      {courses.length === 0 ? (
        <EmptyState
          icon={BookCopy}
          title="ยังไม่มีรายวิชา"
          description="สร้างรายวิชาก่อนเพื่อเริ่มใช้ Leaderboard"
          actionHref="/teacher/courses/new"
          actionLabel="เพิ่มรายวิชาใหม่"
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const studentCount = course.course_students?.[0]?.count ?? 0;
            return (
              <Link
                key={course.id}
                href={`/teacher/leaderboard-display/${course.id}`}
                target="_blank"
                className="flex flex-col gap-2 rounded-2xl border border-[var(--border)] bg-white p-5 transition-colors hover:border-[var(--primary)]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <Trophy className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-[var(--foreground)]">{course.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {course.code} · ภาคเรียนที่ {course.term}/{course.academic_year}
                    {course.section ? ` · ห้อง ${course.section}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">นักเรียน {studentCount} คน</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
