import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Plus, Scale, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { SuccessPopup } from "@/components/success-popup";
import { EmptyState } from "@/components/empty-state";
import { withScoreRanges } from "@/lib/grading-scale";
import { deleteGradingScale, seedStandardGradingScale } from "../actions";

export default async function ManageGradingScalesPage({
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

  const { data: scalesRaw } = await supabase
    .from("grading_scales")
    .select("id, grade_letter, min_score, description, gpa_value")
    .eq("course_id", courseId);

  const scales = withScoreRanges(scalesRaw ?? []);

  return (
    <div>
      <p className="mb-1 text-sm text-[var(--muted)]">
        <Link href={`/teacher/courses/${courseId}/grade-structure`} className="hover:underline">
          ตั้งค่าโครงสร้างคะแนน
        </Link>{" "}
        <span className="mx-1">{">"}</span>
        เกณฑ์การให้คะแนน
      </p>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-bold text-[var(--primary-dark)]">
          เกณฑ์การให้คะแนน (Grading Scale) - {course.name}
        </h1>
        <div className="flex items-center gap-3">
          <ConfirmSubmitButton
            action={seedStandardGradingScale}
            confirmMessage={
              scales.length > 0
                ? "ใช้เกณฑ์มาตรฐาน สพฐ. (8 ระดับ)? เกณฑ์ปัจจุบันทั้งหมดของวิชานี้จะถูกแทนที่"
                : "ใช้เกณฑ์มาตรฐาน สพฐ. (8 ระดับ 0-4) สำหรับวิชานี้?"
            }
            hiddenFields={{ courseId }}
            className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
          >
            <Sparkles className="h-4 w-4" />
            ใช้เกณฑ์มาตรฐาน สพฐ.
          </ConfirmSubmitButton>
          <Link
            href={`/teacher/courses/${courseId}/grade-structure/scales/new`}
            className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary)]/90"
          >
            <Plus className="h-4 w-4" />
            เพิ่มระดับ
          </Link>
        </div>
      </div>

      {notice && <SuccessPopup message={notice} />}
      {error && (
        <p className="mb-4 rounded-[var(--radius)] bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
        {scales.length === 0 ? (
          <EmptyState
            icon={Scale}
            title="ยังไม่มีเกณฑ์การให้คะแนน"
            description="เพิ่มระดับเกรดเองทีละระดับ หรือกดปุ่ม “ใช้เกณฑ์มาตรฐาน สพฐ.” ด้านบนเพื่อใช้ 8 ระดับสำเร็จรูป"
            actionHref={`/teacher/courses/${courseId}/grade-structure/scales/new`}
            actionLabel="เพิ่มระดับ"
          />
        ) : (
          <>
            <div className="divide-y divide-[var(--border)] sm:hidden">
              {scales.map((scale) => (
                <div key={scale.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div>
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
                  <div className="flex shrink-0 items-center gap-3">
                    <Link
                      href={`/teacher/courses/${courseId}/grade-structure/scales/${scale.id}/edit`}
                      className="text-[var(--muted)] hover:text-[var(--primary)]"
                      aria-label="แก้ไข"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <ConfirmDeleteButton
                      action={deleteGradingScale}
                      confirmMessage={`ลบเกณฑ์ระดับ "${scale.grade_letter}"?`}
                      hiddenFields={{ courseId, scaleId: scale.id }}
                    />
                  </div>
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
                    <th className="px-4 py-3 font-medium">การจัดการ</th>
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
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/teacher/courses/${courseId}/grade-structure/scales/${scale.id}/edit`}
                            className="text-[var(--muted)] hover:text-[var(--primary)]"
                            aria-label="แก้ไข"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <ConfirmDeleteButton
                            action={deleteGradingScale}
                            confirmMessage={`ลบเกณฑ์ระดับ "${scale.grade_letter}"?`}
                            hiddenFields={{ courseId, scaleId: scale.id }}
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
