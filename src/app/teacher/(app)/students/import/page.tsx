import Link from "next/link";
import { BookCopy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { importStudentsGlobal } from "@/app/teacher/(app)/students/actions";

export default async function ImportStudentsGlobalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const { data: courses } = await supabase.from("courses").select("id, code, name").order("code");

  return (
    <div className="max-w-lg">
      <h1 className="mb-1 text-2xl font-bold text-[var(--primary-dark)]">
        นำเข้านักเรียนจาก Excel
      </h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        เลือกวิชาที่จะเพิ่มนักเรียนเข้าไป ไฟล์ต้องมีหัวคอลัมน์{" "}
        <span className="font-medium">&quot;รหัสนักเรียน&quot;</span> และ{" "}
        <span className="font-medium">&quot;ชื่อ-นามสกุล&quot;</span> ในแถวแรก (มี{" "}
        <span className="font-medium">&quot;คำนำหน้า&quot;</span> เพิ่มได้) รองรับ .xlsx และ .csv
      </p>

      {error && (
        <p className="mb-4 rounded-[var(--radius)] bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!courses || courses.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-white">
          <EmptyState
            icon={BookCopy}
            title="ยังไม่มีรายวิชา"
            description="ต้องสร้างรายวิชาก่อน จึงจะเลือกวิชาที่จะนำเข้านักเรียนได้"
            actionHref="/teacher/courses/new"
            actionLabel="สร้างรายวิชา"
          />
        </div>
      ) : (
        <form
          action={importStudentsGlobal}
          encType="multipart/form-data"
          className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-white p-6"
        >
          <label className="flex flex-col gap-1 text-sm">
            วิชาที่จะเพิ่มเข้า
            <select
              name="courseId"
              required
              defaultValue=""
              className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
            >
              <option value="" disabled>
                เลือกวิชา
              </option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} · {course.name}
                </option>
              ))}
            </select>
          </label>

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
            <Link href="/teacher/students" className="text-sm text-[var(--muted)]">
              ยกเลิก
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
