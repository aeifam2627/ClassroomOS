import Link from "next/link";
import { notFound } from "next/navigation";
import { FormField } from "@/components/form-field";
import { FormTextarea } from "@/components/form-textarea";
import { FormSelect } from "@/components/form-select";
import { createClient } from "@/lib/supabase/server";
import { toDueAtInputValue } from "@/lib/due-date";
import { updateGradeItem } from "../../../../../actions";

export default async function EditGradeItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; categoryId: string; itemId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id: courseId, categoryId, itemId } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();
  const { data: item } = await supabase
    .from("grade_items")
    .select("id, title, description, max_score, category_id, chapter_id, due_at")
    .eq("id", itemId)
    .single();

  if (!item || item.category_id !== categoryId) notFound();

  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, name")
    .eq("course_id", courseId)
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-[var(--primary-dark)]">แก้ไขชิ้นงาน</h1>

      {error && (
        <p className="mb-4 rounded-[var(--radius)] bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form
        action={updateGradeItem}
        className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-white p-6"
      >
        <input type="hidden" name="courseId" value={courseId} />
        <input type="hidden" name="categoryId" value={categoryId} />
        <input type="hidden" name="itemId" value={item.id} />
        <FormField label="ชื่อชิ้นงาน" name="title" defaultValue={item.title} />
        <FormTextarea
          label="รายละเอียดชิ้นงาน"
          name="description"
          required={false}
          defaultValue={item.description}
          placeholder="คืออะไร ให้นักเรียนทำอะไร"
        />
        <FormField
          label="คะแนนเต็ม"
          name="maxScore"
          type="number"
          min={0.01}
          step={0.01}
          defaultValue={item.max_score}
        />
        {chapters && chapters.length > 0 && (
          <FormSelect
            label="บท"
            name="chapterId"
            placeholder="ไม่ระบุบท"
            options={chapters.map((c) => ({ value: c.id, label: c.name }))}
            defaultValue={item.chapter_id ?? ""}
          />
        )}
        <label className="flex flex-col gap-1 text-sm">
          วันกำหนดส่ง (ไม่บังคับ)
          <input
            type="datetime-local"
            name="dueAt"
            defaultValue={toDueAtInputValue(item.due_at)}
            className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
          />
        </label>

        <div className="mt-2 flex items-center gap-3">
          <button
            type="submit"
            className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary)]/90"
          >
            บันทึก
          </button>
          <Link
            href={`/teacher/courses/${courseId}/grade-structure/categories/${categoryId}/items`}
            className="text-sm text-[var(--muted)]"
          >
            ยกเลิก
          </Link>
        </div>
      </form>
    </div>
  );
}
