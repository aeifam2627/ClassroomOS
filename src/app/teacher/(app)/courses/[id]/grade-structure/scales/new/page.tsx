import Link from "next/link";
import { notFound } from "next/navigation";
import { FormField } from "@/components/form-field";
import { createClient } from "@/lib/supabase/server";
import { createGradingScale } from "../../actions";

export default async function NewGradingScalePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id: courseId } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id, name")
    .eq("id", courseId)
    .single();

  if (!course) notFound();

  return (
    <div className="max-w-lg">
      <h1 className="mb-1 text-2xl font-bold text-[var(--primary-dark)]">เพิ่มระดับเกรด</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">{course.name}</p>

      {error && (
        <p className="mb-4 rounded-[var(--radius)] bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form
        action={createGradingScale}
        className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-white p-6"
      >
        <input type="hidden" name="courseId" value={courseId} />
        <FormField label="ระดับคะแนน" name="gradeLetter" placeholder="เช่น A, B+, B" />
        <FormField
          label="คะแนนต่ำสุดของระดับนี้"
          name="minScore"
          type="number"
          min={0}
          max={100}
          step={0.01}
        />
        <FormField
          label="คำอธิบาย"
          name="description"
          required={false}
          placeholder="เช่น ดีเยี่ยม (Excellent)"
        />
        <FormField
          label="ค่าระดับ (GPA)"
          name="gpaValue"
          type="number"
          min={0}
          max={4}
          step={0.01}
          required={false}
        />

        <div className="mt-2 flex items-center gap-3">
          <button
            type="submit"
            className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary)]/90"
          >
            บันทึก
          </button>
          <Link
            href={`/teacher/courses/${courseId}/grade-structure/scales`}
            className="text-sm text-[var(--muted)]"
          >
            ยกเลิก
          </Link>
        </div>
      </form>
    </div>
  );
}
