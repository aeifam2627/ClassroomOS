import Link from "next/link";
import { FormField } from "@/components/form-field";
import { createCourse } from "@/app/teacher/(app)/courses/actions";

export default async function NewCoursePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="max-w-lg">
      <h1 className="mb-1 text-2xl font-bold text-[var(--primary-dark)]">เพิ่มรายวิชาใหม่</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">กรอกข้อมูลรายวิชาที่ต้องการเปิดสอน</p>

      {error && (
        <p className="mb-4 rounded-[var(--radius)] bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form
        action={createCourse}
        className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-white p-6"
      >
        <FormField label="รหัสวิชา" name="code" placeholder="เช่น SC101" />
        <FormField label="ชื่อวิชา" name="name" placeholder="เช่น วิทยาการคำนวณ 1" />
        <FormField label="ห้อง (ถ้ามี)" name="section" placeholder="เช่น 1/1" required={false} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="ภาคเรียน" name="term" placeholder="เช่น 1" />
          <FormField label="ปีการศึกษา" name="academicYear" placeholder="เช่น 2567" />
        </div>

        <label className="flex flex-col gap-1 text-sm">
          สถานะ
          <select
            name="status"
            defaultValue="upcoming"
            className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
          >
            <option value="upcoming">เตรียมเปิดสอน</option>
            <option value="open">เปิดสอน</option>
            <option value="closed">ปิดเรียน</option>
          </select>
        </label>

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
