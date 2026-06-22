import Link from "next/link";
import { FormField } from "@/components/form-field";
import { TitleSelect } from "@/components/title-select";
import { addStudent } from "@/app/teacher/(app)/courses/[id]/students/actions";

export default async function NewStudentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id: courseId } = await params;
  const { error } = await searchParams;

  return (
    <div className="max-w-lg">
      <h1 className="mb-1 text-2xl font-bold text-[var(--primary-dark)]">เพิ่มนักเรียน</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        ถ้ารหัสนักเรียนนี้มีอยู่แล้วในระบบของคุณ ระบบจะเพิ่มเข้าวิชานี้โดยไม่สร้างซ้ำ
      </p>

      {error && (
        <p className="mb-4 rounded-[var(--radius)] bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form
        action={addStudent}
        className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-white p-6"
      >
        <input type="hidden" name="courseId" value={courseId} />
        <FormField label="รหัสนักเรียน" name="code" placeholder="เช่น 66001" />
        <TitleSelect />
        <FormField label="ชื่อ-นามสกุล" name="name" placeholder="เช่น ตัวอย่าง ใจดี" />

        <div className="mt-2 flex items-center gap-3">
          <button
            type="submit"
            className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary)]/90"
          >
            บันทึก
          </button>
          <Link href={`/teacher/courses/${courseId}/students`} className="text-sm text-[var(--muted)]">
            ยกเลิก
          </Link>
        </div>
      </form>
    </div>
  );
}
