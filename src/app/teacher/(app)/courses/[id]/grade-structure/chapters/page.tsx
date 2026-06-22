import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Pencil, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { SuccessPopup } from "@/components/success-popup";
import { EmptyState } from "@/components/empty-state";
import { deleteChapter } from "../actions";

export default async function ChaptersPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { id: courseId } = await params;
  const { error, notice } = await searchParams;

  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id, name")
    .eq("id", courseId)
    .single();

  if (!course) notFound();

  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, name")
    .eq("course_id", courseId)
    .order("created_at", { ascending: true });

  return (
    <div>
      <p className="mb-1 text-sm text-[var(--muted)]">
        <Link href={`/teacher/courses/${courseId}/grade-structure`} className="hover:underline">
          ตั้งค่าโครงสร้างคะแนน
        </Link>{" "}
        <span className="mx-1">{">"}</span>
        บทเรียน
      </p>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--primary-dark)]">บทเรียน - {course.name}</h1>
          <p className="text-sm text-[var(--muted)]">
            จัดกลุ่มชิ้นงานตามบท ไม่มีน้ำหนักคะแนน ใช้แค่จัดกลุ่ม/กรองดูในหน้าชิ้นงานและบันทึกคะแนน
          </p>
        </div>
        <Link
          href={`/teacher/courses/${courseId}/grade-structure/chapters/new`}
          className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary)]/90"
        >
          <Plus className="h-4 w-4" />
          เพิ่มบท
        </Link>
      </div>

      {notice && <SuccessPopup message={notice} />}
      {error && (
        <p className="mb-4 rounded-[var(--radius)] bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
        {(chapters?.length ?? 0) === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="ยังไม่มีบทเรียน"
            description="แบ่งชิ้นงานออกเป็นบทเพื่อจัดกลุ่ม/กรองดูในหน้าชิ้นงานและบันทึกคะแนน (ไม่มีน้ำหนักคะแนน ไม่บังคับต้องมี)"
            actionHref={`/teacher/courses/${courseId}/grade-structure/chapters/new`}
            actionLabel="เพิ่มบท"
          />
        ) : (
          <>
            {/* มือถือ: card-list — จอใหญ่ขึ้นไปใช้ตารางแทน (sm:hidden / hidden sm:block) */}
            <div className="divide-y divide-[var(--border)] sm:hidden">
              {chapters?.map((chapter) => (
                <div key={chapter.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <p className="font-medium text-[var(--foreground)]">{chapter.name}</p>
                  <div className="flex shrink-0 items-center gap-3">
                    <Link
                      href={`/teacher/courses/${courseId}/grade-structure/chapters/${chapter.id}/edit`}
                      className="text-[var(--muted)] hover:text-[var(--primary)]"
                      aria-label="แก้ไข"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <ConfirmDeleteButton
                      action={deleteChapter}
                      confirmMessage={`ลบบท "${chapter.name}"? ชิ้นงานในบทนี้จะกลายเป็น "ไม่ระบุบท" (คะแนนไม่หาย)`}
                      hiddenFields={{ courseId, chapterId: chapter.id }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">ชื่อบท</th>
                    <th className="px-4 py-3 font-medium">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {chapters?.map((chapter) => (
                    <tr key={chapter.id}>
                      <td className="px-4 py-3 font-medium text-[var(--foreground)]">{chapter.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/teacher/courses/${courseId}/grade-structure/chapters/${chapter.id}/edit`}
                            className="text-[var(--muted)] hover:text-[var(--primary)]"
                            aria-label="แก้ไข"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <ConfirmDeleteButton
                            action={deleteChapter}
                            confirmMessage={`ลบบท "${chapter.name}"? ชิ้นงานในบทนี้จะกลายเป็น "ไม่ระบุบท" (คะแนนไม่หาย)`}
                            hiddenFields={{ courseId, chapterId: chapter.id }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
