import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MultiGradeItemForm } from "@/components/multi-grade-item-form";
import { createGradeItems } from "../../../../actions";

export default async function NewGradeItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; categoryId: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { id: courseId, categoryId } = await params;
  const { error, notice } = await searchParams;

  const supabase = await createClient();
  const { data: category } = await supabase
    .from("score_categories")
    .select("id, name, course_id")
    .eq("id", categoryId)
    .single();

  if (!category || category.course_id !== courseId) notFound();

  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, name")
    .eq("course_id", courseId)
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold text-[var(--primary-dark)]">เพิ่มชิ้นงาน</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        {category.name} — กดปุ่ม &ldquo;เพิ่มชิ้นงาน&rdquo; เพื่อเพิ่มได้หลายรายการพร้อมกันในครั้งเดียว
      </p>

      {notice === "created-category" && (
        <p className="mb-4 rounded-[var(--radius)] bg-[var(--primary)]/10 px-4 py-2 text-sm text-[var(--primary-dark)]">
          สร้างหมวดหมู่ &ldquo;{category.name}&rdquo; แล้ว — เพิ่มชิ้นงานของหมวดหมู่นี้ต่อได้เลย (หมวดหมู่ที่ยังไม่มีชิ้นงานจะใช้กรอกคะแนนไม่ได้)
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-[var(--radius)] bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <MultiGradeItemForm
        action={createGradeItems}
        courseId={courseId}
        categoryId={categoryId}
        chapters={chapters ?? []}
      />

      <Link
        href={`/teacher/courses/${courseId}/grade-structure/categories/${categoryId}/items`}
        className="mt-4 inline-block text-sm text-[var(--muted)]"
      >
        ยกเลิก
      </Link>
    </div>
  );
}
