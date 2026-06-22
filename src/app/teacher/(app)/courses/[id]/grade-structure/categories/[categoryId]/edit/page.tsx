import Link from "next/link";
import { notFound } from "next/navigation";
import { FormField } from "@/components/form-field";
import { createClient } from "@/lib/supabase/server";
import { updateCategory } from "../../../actions";

export default async function EditCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; categoryId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id: courseId, categoryId } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();
  const { data: category } = await supabase
    .from("score_categories")
    .select("id, name, weight_percent")
    .eq("id", categoryId)
    .single();

  if (!category) notFound();

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-[var(--primary-dark)]">แก้ไขหมวดหมู่คะแนน</h1>

      {error && (
        <p className="mb-4 rounded-[var(--radius)] bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form
        action={updateCategory}
        className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-white p-6"
      >
        <input type="hidden" name="courseId" value={courseId} />
        <input type="hidden" name="categoryId" value={category.id} />
        <FormField label="ชื่อหมวดหมู่" name="name" defaultValue={category.name} />
        <FormField
          label="น้ำหนัก (%)"
          name="weightPercent"
          type="number"
          min={0.01}
          max={100}
          step={0.01}
          defaultValue={category.weight_percent}
        />

        <div className="mt-2 flex items-center gap-3">
          <button
            type="submit"
            className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary)]/90"
          >
            บันทึก
          </button>
          <Link href={`/teacher/courses/${courseId}/grade-structure`} className="text-sm text-[var(--muted)]">
            ยกเลิก
          </Link>
        </div>
      </form>
    </div>
  );
}
