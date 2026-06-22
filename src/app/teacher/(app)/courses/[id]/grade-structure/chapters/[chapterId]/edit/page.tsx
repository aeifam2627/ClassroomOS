import Link from "next/link";
import { notFound } from "next/navigation";
import { FormField } from "@/components/form-field";
import { createClient } from "@/lib/supabase/server";
import { updateChapter } from "../../../actions";

export default async function EditChapterPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; chapterId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id: courseId, chapterId } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();
  const { data: chapter } = await supabase
    .from("chapters")
    .select("id, name, course_id")
    .eq("id", chapterId)
    .single();

  if (!chapter || chapter.course_id !== courseId) notFound();

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-[var(--primary-dark)]">แก้ไขบท</h1>

      {error && (
        <p className="mb-4 rounded-[var(--radius)] bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form
        action={updateChapter}
        className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-white p-6"
      >
        <input type="hidden" name="courseId" value={courseId} />
        <input type="hidden" name="chapterId" value={chapter.id} />
        <FormField label="ชื่อบท" name="name" defaultValue={chapter.name} />

        <div className="mt-2 flex items-center gap-3">
          <button
            type="submit"
            className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary)]/90"
          >
            บันทึก
          </button>
          <Link
            href={`/teacher/courses/${courseId}/grade-structure/chapters`}
            className="text-sm text-[var(--muted)]"
          >
            ยกเลิก
          </Link>
        </div>
      </form>
    </div>
  );
}
