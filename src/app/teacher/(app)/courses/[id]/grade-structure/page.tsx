import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, CheckCircle2, Pencil, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CardActionsMenu } from "@/components/card-actions-menu";
import { SuccessPopup } from "@/components/success-popup";
import { WeightDonutChart } from "@/components/weight-donut-chart";
import { categoryColor } from "@/lib/category-color";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { withScoreRanges } from "@/lib/grading-scale";
import { deleteCategory } from "./actions";

export default async function GradeStructurePage({
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

  const { data: categories } = await supabase
    .from("score_categories")
    .select("id, name, weight_percent, grade_items(count)")
    .eq("course_id", courseId)
    .order("created_at", { ascending: true });

  const { data: scalesRaw } = await supabase
    .from("grading_scales")
    .select("id, grade_letter, min_score, description, gpa_value")
    .eq("course_id", courseId);

  const scales = withScoreRanges(scalesRaw ?? []);

  const totalWeight = (categories ?? []).reduce((sum, c) => sum + c.weight_percent, 0);

  return (
    <div>
      <p className="mb-1 text-sm text-[var(--muted)]">
        <Link href="/teacher/courses" className="hover:underline">
          รายวิชา
        </Link>{" "}
        <span className="mx-1">{">"}</span>
        {course.name}
      </p>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--primary-dark)]">
            ตั้งค่าโครงสร้างคะแนน - {course.name}
          </h1>
          <p className="text-sm text-[var(--muted)]">
            กำหนดหมวดหมู่คะแนนและน้ำหนักของแต่ละหมวดหมู่ในวิชานี้
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/teacher/courses/${courseId}/grade-structure/chapters`}
            className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
          >
            <BookOpen className="h-4 w-4" />
            จัดการบทเรียน
          </Link>
          <Link
            href={`/teacher/courses/${courseId}/grade-structure/categories/new`}
            className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary)]/90"
          >
            <Plus className="h-4 w-4" />
            เพิ่มหมวดหมู่
          </Link>
        </div>
      </div>

      {notice && <SuccessPopup message={notice} />}
      {error && (
        <p className="mb-4 rounded-[var(--radius)] bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">
            หมวดหมู่คะแนนและน้ำหนัก
          </h2>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {categories?.map((category, index) => {
              const color = categoryColor(index);
              const Icon = CATEGORY_ICONS[index % CATEGORY_ICONS.length];
              return (
                <div
                  key={category.id}
                  className={`rounded-[var(--radius)] border ${color.ring} ${color.bg} p-4`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full bg-white ${color.text}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <CardActionsMenu
                      editHref={`/teacher/courses/${courseId}/grade-structure/categories/${category.id}/edit`}
                      deleteAction={deleteCategory}
                      deleteHiddenFields={{ courseId, categoryId: category.id }}
                      deleteConfirmMessage={`ลบหมวดหมู่ "${category.name}"? ชิ้นงาน/คะแนนในหมวดหมู่นี้จะถูกลบไปด้วย`}
                    />
                  </div>
                  <p className={`text-sm font-medium ${color.text}`}>{category.name}</p>
                  <p className="text-xl font-bold text-[var(--foreground)]">
                    {category.weight_percent}%
                  </p>
                  {(() => {
                    const itemCount = category.grade_items?.[0]?.count ?? 0;
                    return (
                      <Link
                        href={`/teacher/courses/${courseId}/grade-structure/categories/${category.id}/items`}
                        className={`mt-2 inline-block text-xs font-medium underline-offset-2 hover:underline ${
                          itemCount === 0 ? "text-amber-600" : color.text
                        }`}
                      >
                        {itemCount === 0 ? "ยังไม่มีชิ้นงาน — เพิ่มเลย" : `${itemCount} ชิ้นงาน`}
                      </Link>
                    );
                  })()}
                </div>
              );
            })}

            {(categories?.length ?? 0) === 0 && (
              <p className="col-span-4 py-6 text-center text-sm text-[var(--muted)]">
                ยังไม่มีหมวดหมู่คะแนน กดปุ่ม “เพิ่มหมวดหมู่” เพื่อเริ่มต้น
              </p>
            )}
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-[var(--muted)]">น้ำหนักรวม</span>
              <span className="font-semibold text-[var(--foreground)]">{totalWeight}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[var(--primary)] transition-all"
                style={{ width: `${Math.min(totalWeight, 100)}%` }}
              />
            </div>
            {totalWeight === 100 ? (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                ครบ 100% แล้ว ({totalWeight}%)
              </p>
            ) : (
              <p className="mt-2 text-sm text-amber-600">
                ยังขาดอีก {(100 - totalWeight).toFixed(2)}% ให้ครบ 100%
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">
            สัดส่วนน้ำหนักคะแนน
          </h2>
          {(categories?.length ?? 0) > 0 ? (
            <WeightDonutChart categories={categories ?? []} />
          ) : (
            <p className="py-6 text-center text-sm text-[var(--muted)]">ยังไม่มีข้อมูล</p>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            เกณฑ์การให้คะแนน (Grading Scale)
          </h2>
          <Link
            href={`/teacher/courses/${courseId}/grade-structure/scales`}
            className="text-[var(--muted)] hover:text-[var(--primary)]"
            aria-label="แก้ไขเกณฑ์การให้คะแนน"
          >
            <Pencil className="h-4 w-4" />
          </Link>
        </div>

        {scales.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-[var(--muted)]">
            ยังไม่มีเกณฑ์การให้คะแนน กดไอคอนแก้ไขเพื่อเริ่มต้น
          </p>
        ) : (
          <>
            <div className="divide-y divide-[var(--border)] sm:hidden">
              {scales.map((scale) => (
                <div key={scale.id} className="px-4 py-3">
                  <p className="font-semibold text-[var(--primary-dark)]">
                    {scale.grade_letter}{" "}
                    <span className="font-normal text-[var(--muted)]">
                      ({scale.min_score} - {scale.max_score})
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">{scale.description || "-"}</p>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    ค่าระดับ: {scale.gpa_value !== null ? scale.gpa_value.toFixed(2) : "-"}
                  </p>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">ระดับคะแนน</th>
                    <th className="px-4 py-3 font-medium">ช่วงคะแนน</th>
                    <th className="px-4 py-3 font-medium">คำอธิบาย</th>
                    <th className="px-4 py-3 font-medium">ค่าระดับ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {scales.map((scale) => (
                    <tr key={scale.id}>
                      <td className="px-4 py-3 font-semibold text-[var(--primary-dark)]">
                        {scale.grade_letter}
                      </td>
                      <td className="px-4 py-3">
                        {scale.min_score} - {scale.max_score}
                      </td>
                      <td className="px-4 py-3">{scale.description || "-"}</td>
                      <td className="px-4 py-3">
                        {scale.gpa_value !== null ? scale.gpa_value.toFixed(2) : "-"}
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
