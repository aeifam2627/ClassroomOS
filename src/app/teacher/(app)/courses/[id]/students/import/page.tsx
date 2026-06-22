import Link from "next/link";
import { importStudents } from "@/app/teacher/(app)/courses/[id]/students/actions";

export default async function ImportStudentsPage({
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
      <h1 className="mb-1 text-2xl font-bold text-[var(--primary-dark)]">
        นำเข้านักเรียนจาก Excel
      </h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        ไฟล์ต้องมีหัวคอลัมน์ <span className="font-medium">&quot;รหัสนักเรียน&quot;</span> และ{" "}
        <span className="font-medium">&quot;ชื่อ-นามสกุล&quot;</span> ในแถวแรก รองรับ .xlsx และ .csv
      </p>

      {error && (
        <p className="mb-4 rounded-[var(--radius)] bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form
        action={importStudents}
        encType="multipart/form-data"
        className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-white p-6"
      >
        <input type="hidden" name="courseId" value={courseId} />
        <label className="flex flex-col gap-1 text-sm">
          ไฟล์ Excel หรือ CSV
          <input
            type="file"
            name="file"
            accept=".xlsx,.csv"
            required
            className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none file:mr-3 file:rounded-full file:border-0 file:bg-[var(--primary)]/10 file:px-3 file:py-1.5 file:text-[var(--primary)]"
          />
        </label>

        <div className="mt-2 flex items-center gap-3">
          <button
            type="submit"
            className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary)]/90"
          >
            นำเข้า
          </button>
          <Link href={`/teacher/courses/${courseId}/students`} className="text-sm text-[var(--muted)]">
            ยกเลิก
          </Link>
        </div>
      </form>
    </div>
  );
}
