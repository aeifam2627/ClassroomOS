import Link from "next/link";
import { notFound } from "next/navigation";
import { FormField } from "@/components/form-field";
import { createClient } from "@/lib/supabase/server";
import { updateCourse } from "@/app/teacher/(app)/courses/actions";

export default async function EditCoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select(
      "id, code, name, term, academic_year, status, gamification_enabled, leaderboard_score_basis, leaderboard_visibility",
    )
    .eq("id", id)
    .single();

  if (!course) notFound();

  return (
    <div className="max-w-lg">
      <h1 className="mb-1 text-2xl font-bold text-[var(--primary-dark)]">แก้ไขรายวิชา</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        {course.code} · {course.name}
      </p>

      {error && (
        <p className="mb-4 rounded-[var(--radius)] bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form
        action={updateCourse}
        className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-white p-6"
      >
        <input type="hidden" name="courseId" value={course.id} />
        <FormField label="รหัสวิชา" name="code" defaultValue={course.code} />
        <FormField label="ชื่อวิชา" name="name" defaultValue={course.name} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="ภาคเรียน" name="term" defaultValue={course.term} />
          <FormField label="ปีการศึกษา" name="academicYear" defaultValue={course.academic_year} />
        </div>

        <label className="flex flex-col gap-1 text-sm">
          สถานะ
          <select
            name="status"
            defaultValue={course.status}
            className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
          >
            <option value="upcoming">เตรียมเปิดสอน</option>
            <option value="open">เปิดสอน</option>
            <option value="closed">ปิดเรียน</option>
          </select>
        </label>

        <div className="mt-2 rounded-[var(--radius)] border border-[var(--border)] p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
            <input
              type="checkbox"
              name="gamificationEnabled"
              defaultChecked={course.gamification_enabled}
              className="h-4 w-4 rounded border-[var(--border)] accent-[var(--primary)]"
            />
            เปิด Leaderboard / Gamification สำหรับวิชานี้
          </label>

          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              ฐานคะแนนจัดอันดับ
              <select
                name="leaderboardScoreBasis"
                defaultValue={course.leaderboard_score_basis}
                className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
              >
                <option value="grade">คะแนน/เกรดจริง</option>
                <option value="points">แต้มกิจกรรม (ไม่ผูกกับคะแนนจริง)</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              การเปิดเผยตัวตน
              <select
                name="leaderboardVisibility"
                defaultValue={course.leaderboard_visibility}
                className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
              >
                <option value="full_name">เห็นชื่อจริงทั้งห้อง</option>
                <option value="alias">เห็นแค่ชื่อสมมติ</option>
                <option value="anonymous">ไม่เห็นชื่อใครเลย (เห็นแค่อันดับตัวเอง)</option>
              </select>
            </label>
          </div>

          <Link
            href={`/teacher/courses/${course.id}/leaderboard`}
            className="mt-3 inline-block text-sm font-medium text-[var(--primary)] hover:underline"
          >
            ไปหน้าจัดการ Leaderboard / ให้แต้มกิจกรรม →
          </Link>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <button
            type="submit"
            className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary)]/90"
          >
            บันทึก
          </button>
          <Link href="/teacher/courses" className="text-sm text-[var(--muted)]">
            ยกเลิก
          </Link>
        </div>
      </form>
    </div>
  );
}
