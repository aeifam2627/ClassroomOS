import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { SuccessPopup } from "@/components/success-popup";
import { deleteGradeItem } from "../../../actions";

export default async function GradeItemsPage({
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
    .select("id, name, weight_percent, course_id")
    .eq("id", categoryId)
    .single();

  if (!category || category.course_id !== courseId) notFound();

  const { data: items } = await supabase
    .from("grade_items")
    .select("id, title, description, max_score, chapters(name)")
    .eq("category_id", categoryId)
    .order("created_at", { ascending: true })
    .returns<
      { id: string; title: string; description: string; max_score: number; chapters: { name: string } | null }[]
    >();

  return (
    <div>
      <p className="mb-1 text-sm text-[var(--muted)]">
        <Link href={`/teacher/courses/${courseId}/grade-structure`} className="hover:underline">
          ตั้งค่าโครงสร้างคะแนน
        </Link>{" "}
        <span className="mx-1">{">"}</span>
        ชิ้นงาน - {category.name}
      </p>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-bold text-[var(--primary-dark)]">
          ชิ้นงาน/การสอบ - {category.name} ({category.weight_percent}%)
        </h1>
        <Link
          href={`/teacher/courses/${courseId}/grade-structure/categories/${categoryId}/items/new`}
          className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary)]/90"
        >
          <Plus className="h-4 w-4" />
          เพิ่มชิ้นงาน
        </Link>
      </div>

      {notice && <SuccessPopup message={notice} />}
      {error && (
        <p className="mb-4 rounded-[var(--radius)] bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
        {(items?.length ?? 0) === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-[var(--muted)]">
            ยังไม่มีชิ้นงานในหมวดหมู่นี้ กดปุ่ม “เพิ่มชิ้นงาน” เพื่อเริ่มต้น
          </p>
        ) : (
          <>
            <div className="divide-y divide-[var(--border)] sm:hidden">
              {items?.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="font-medium text-[var(--foreground)]">{item.title}</p>
                    {item.description && (
                      <p className="mt-0.5 text-xs text-[var(--muted)]">{item.description}</p>
                    )}
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      บท: {item.chapters?.name ?? "-"} · คะแนนเต็ม {item.max_score}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Link
                      href={`/teacher/courses/${courseId}/grade-structure/categories/${categoryId}/items/${item.id}/edit`}
                      className="text-[var(--muted)] hover:text-[var(--primary)]"
                      aria-label="แก้ไข"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <ConfirmDeleteButton
                      action={deleteGradeItem}
                      confirmMessage={`ลบชิ้นงาน "${item.title}"? คะแนนของนักเรียนในชิ้นงานนี้จะถูกลบไปด้วย`}
                      hiddenFields={{ courseId, categoryId, itemId: item.id }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">ชื่อชิ้นงาน</th>
                    <th className="px-4 py-3 font-medium">บท</th>
                    <th className="px-4 py-3 font-medium">คะแนนเต็ม</th>
                    <th className="px-4 py-3 font-medium">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[var(--foreground)]">{item.title}</p>
                        {item.description && (
                          <p className="mt-0.5 text-xs text-[var(--muted)]">{item.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--muted)]">{item.chapters?.name ?? "-"}</td>
                      <td className="px-4 py-3">{item.max_score}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/teacher/courses/${courseId}/grade-structure/categories/${categoryId}/items/${item.id}/edit`}
                            className="text-[var(--muted)] hover:text-[var(--primary)]"
                            aria-label="แก้ไข"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <ConfirmDeleteButton
                            action={deleteGradeItem}
                            confirmMessage={`ลบชิ้นงาน "${item.title}"? คะแนนของนักเรียนในชิ้นงานนี้จะถูกลบไปด้วย`}
                            hiddenFields={{ courseId, categoryId, itemId: item.id }}
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
