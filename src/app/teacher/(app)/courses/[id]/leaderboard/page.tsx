import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, Medal, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StudentAvatar } from "@/components/student-avatar";
import { SuccessPopup } from "@/components/success-popup";
import { formatStudentFullName } from "@/lib/student-name";
import { getCourseLeaderboard } from "@/lib/leaderboard";
import { awardPoints } from "./actions";

const RANK_ICON_CLASS: Record<number, string> = {
  1: "text-amber-500",
  2: "text-slate-400",
  3: "text-orange-700",
};

export default async function TeacherLeaderboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id: courseId } = await params;
  const { error, saved } = await searchParams;

  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id, name")
    .eq("id", courseId)
    .single();

  if (!course) notFound();

  type RosterRow = {
    student_id: string;
    students: { id: string; name: string; title: string; student_code: string } | null;
  };

  const [leaderboard, { data: roster }] = await Promise.all([
    getCourseLeaderboard(courseId),
    supabase
      .from("course_students")
      .select("student_id, students(id, name, title, student_code)")
      .eq("course_id", courseId)
      .returns<RosterRow[]>(),
  ]);

  const students = (roster ?? [])
    .map((row) => row.students)
    .filter((s): s is { id: string; name: string; title: string; student_code: string } => Boolean(s))
    .sort((a, b) => a.student_code.localeCompare(b.student_code));

  return (
    <div>
      <p className="mb-1 text-sm text-[var(--muted)]">
        <Link href="/teacher/courses" className="hover:underline">
          รายวิชา
        </Link>{" "}
        <span className="mx-1">{">"}</span>
        {course.name}
      </p>

      <h1 className="mb-1 text-2xl font-bold text-[var(--primary-dark)]">
        Leaderboard - {course.name}
      </h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        ครูเห็นชื่อจริงและอันดับเสมอ ส่วนนักเรียนจะเห็นตามที่ตั้งค่าไว้ใน{" "}
        <Link href={`/teacher/courses/${courseId}/edit`} className="text-[var(--primary)] hover:underline">
          การตั้งค่าวิชา
        </Link>
      </p>

      {error && (
        <p className="mb-4 rounded-[var(--radius)] bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {saved && <SuccessPopup message="ให้แต้มเรียบร้อยแล้ว" />}

      {!leaderboard?.enabled && (
        <p className="mb-4 rounded-[var(--radius)] bg-amber-50 px-4 py-2 text-sm text-amber-800">
          วิชานี้ยังไม่เปิด Gamification — นักเรียนจะไม่เห็น Leaderboard จนกว่าจะเปิดในหน้าตั้งค่าวิชา
          (ครูยังดูอันดับในหน้านี้ได้ตามปกติ)
        </p>
      )}

      <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
        <div className="border-b border-[var(--border)] px-5 py-3">
          <p className="text-sm font-semibold text-[var(--primary-dark)]">
            อันดับ ({leaderboard?.basis === "points" ? "แต้มกิจกรรม" : "คะแนน/เกรดจริง"})
          </p>
        </div>

        {(leaderboard?.entries.length ?? 0) === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-[var(--muted)]">
            วิชานี้ยังไม่มีนักเรียน
          </p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {leaderboard?.entries.map((entry) => (
              <div key={entry.studentId} className="flex items-center gap-3 px-5 py-3">
                <span className={`w-6 text-center font-bold ${RANK_ICON_CLASS[entry.rank] ?? "text-[var(--muted)]"}`}>
                  {entry.rank <= 3 ? (
                    entry.rank === 1 ? <Trophy className="h-5 w-5" /> : <Medal className="h-5 w-5" />
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
                </div>
                <p className="text-sm font-semibold text-[var(--primary)]">
                  {entry.score.toLocaleString("th-TH", { maximumFractionDigits: 2 })}
                  {leaderboard.basis === "points" ? " แต้ม" : "%"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--primary-dark)]">
          <Award className="h-4 w-4" />
          ให้แต้มกิจกรรม
        </p>
        <p className="mb-4 text-xs text-[var(--muted)]">
          แต้มกิจกรรมแยกจากคะแนนสอบ/งานจริงเสมอ — มีผลต่อ Leaderboard เฉพาะวิชาที่ตั้งฐานคะแนนเป็น
          “แต้มกิจกรรม”
        </p>

        {students.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">วิชานี้ยังไม่มีนักเรียน</p>
        ) : (
          <form action={awardPoints} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <input type="hidden" name="courseId" value={courseId} />

            <label className="flex flex-1 flex-col gap-1 text-sm">
              นักเรียน
              <select
                name="studentId"
                required
                className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {formatStudentFullName(s.title, s.name)} ({s.student_code})
                  </option>
                ))}
              </select>
            </label>

            <label className="flex w-28 flex-col gap-1 text-sm">
              แต้ม
              <input
                type="number"
                name="points"
                step="0.5"
                required
                placeholder="เช่น 5"
                className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
              />
            </label>

            <label className="flex flex-1 flex-col gap-1 text-sm">
              เหตุผล (ไม่บังคับ)
              <input
                type="text"
                name="reason"
                placeholder="เช่น ช่วยเพื่อนทำงานกลุ่ม"
                className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
              />
            </label>

            <button
              type="submit"
              className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary)]/90"
            >
              ให้แต้ม
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
