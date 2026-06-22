import Link from "next/link";
import { notFound } from "next/navigation";
import { FormField } from "@/components/form-field";
import { TitleSelect } from "@/components/title-select";
import { createClient } from "@/lib/supabase/server";
import { updateStudent } from "@/app/teacher/(app)/students/actions";

export default async function EditStudentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("id, student_code, name, title")
    .eq("id", id)
    .single();

  if (!student) notFound();

  return (
    <div className="max-w-lg">
      <h1 className="mb-1 text-2xl font-bold text-[var(--primary-dark)]">แก้ไขนักเรียน</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        {student.student_code} · {student.name}
      </p>

      {error && (
        <p className="mb-4 rounded-[var(--radius)] bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form
        action={updateStudent}
        className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-white p-6"
      >
        <input type="hidden" name="studentId" value={student.id} />
        <FormField label="รหัสนักเรียน" name="code" defaultValue={student.student_code} />
        <TitleSelect defaultValue={student.title} />
        <FormField label="ชื่อ-นามสกุล" name="name" defaultValue={student.name} />

        <div className="mt-2 flex items-center gap-3">
          <button
            type="submit"
            className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary)]/90"
          >
            บันทึก
          </button>
          <Link href="/teacher/students" className="text-sm text-[var(--muted)]">
            ยกเลิก
          </Link>
        </div>
      </form>
    </div>
  );
}
