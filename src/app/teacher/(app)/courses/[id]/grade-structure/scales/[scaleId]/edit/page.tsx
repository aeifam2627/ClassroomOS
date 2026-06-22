import Link from "next/link";
import { notFound } from "next/navigation";
import { FormField } from "@/components/form-field";
import { createClient } from "@/lib/supabase/server";
import { updateGradingScale } from "../../../actions";

export default async function EditGradingScalePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; scaleId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id: courseId, scaleId } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();
  const { data: scale } = await supabase
    .from("grading_scales")
    .select("id, grade_letter, min_score, description, gpa_value")
    .eq("id", scaleId)
    .single();

  if (!scale) notFound();

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-[var(--primary-dark)]">แก้ไขระดับเกรด</h1>

      {error && (
        <p className="mb-4 rounded-[var(--radius)] bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form
        action={updateGradingScale}
        className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-white p-6"
      >
        <input type="hidden" name="courseId" value={courseId} />
        <input type="hidden" name="scaleId" value={scale.id} />
        <FormField label="ระดับคะแนน" name="gradeLetter" defaultValue={scale.grade_letter} />
        <FormField
          label="คะแนนต่ำสุดของระดับนี้"
          name="minScore"
          type="number"
          min={0}
          max={100}
          step={0.01}
          defaultValue={scale.min_score}
        />
        <FormField
          label="คำอธิบาย"
          name="description"
          required={false}
          defaultValue={scale.description}
        />
        <FormField
          label="ค่าระดับ (GPA)"
          name="gpaValue"
          type="number"
          min={0}
          max={4}
          step={0.01}
          required={false}
          defaultValue={scale.gpa_value ?? undefined}
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
