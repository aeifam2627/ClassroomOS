import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, Settings } from "lucide-react";
import { getScoreSheetData } from "@/lib/score-sheet-data";
import { ScoreGrid } from "@/components/score-grid";

export default async function ScoresPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { id: courseId } = await params;
  const { category: activeCategoryId } = await searchParams;

  const data = await getScoreSheetData(courseId);
  if (!data) notFound();

  const { course, allCategories, allItems, students, initialScores, scales, chapters } = data;

  const activeCategory = allCategories.find((c) => c.id === activeCategoryId);
  const visibleItems = activeCategory ? activeCategory.grade_items : allItems;

  function tabHref(categoryId?: string) {
    if (!categoryId) return `/teacher/courses/${courseId}/scores`;
    return `/teacher/courses/${courseId}/scores?category=${categoryId}`;
  }

  return (
    <div>
      <p className="mb-1 text-sm text-[var(--muted)]">
        <Link href="/teacher/dashboard" className="hover:underline">
          หน้าหลัก
        </Link>{" "}
        <span className="mx-1">{">"}</span>
        <Link href="/teacher/courses" className="hover:underline">
          รายวิชา
        </Link>{" "}
        <span className="mx-1">{">"}</span>
        {course.name}
        <span className="mx-1">{">"}</span>
        บันทึกคะแนน
      </p>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--primary-dark)]">
            บันทึกคะแนน - {course.name}
          </h1>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-[var(--muted)]">
              {course.code}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-[var(--muted)]">
              ภาคเรียนที่ {course.term}/{course.academic_year}
            </span>
          </div>
        </div>
        <Link
          href={`/teacher/courses/${courseId}/grade-structure`}
          className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
        >
          <Settings className="h-4 w-4" />
          ตัวเลือก
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link
          href={tabHref()}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            !activeCategory
              ? "bg-[var(--primary)] text-white"
              : "bg-slate-100 text-[var(--muted)] hover:bg-slate-200"
          }`}
        >
          ทั้งหมด
        </Link>
        {allCategories.map((c) => (
          <Link
            key={c.id}
            href={tabHref(c.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeCategory?.id === c.id
                ? "bg-[var(--primary)] text-white"
                : "bg-slate-100 text-[var(--muted)] hover:bg-slate-200"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {(allCategories.length === 0 || allItems.length === 0) && (
        <p className="mb-4 rounded-[var(--radius)] bg-amber-50 px-4 py-2 text-sm text-amber-800">
          วิชานี้ยังไม่มีหมวดหมู่คะแนน/ชิ้นงาน ไปตั้งค่าที่{" "}
          <Link
            href={`/teacher/courses/${courseId}/grade-structure`}
            className="underline"
          >
            โครงสร้างคะแนน
          </Link>{" "}
          ก่อนเริ่มกรอกคะแนน
        </p>
      )}

      <ScoreGrid
        visibleItems={visibleItems}
        allCategories={allCategories}
        students={students}
        initialScores={initialScores}
        scales={scales}
        chapters={chapters}
      />

      <div className="mt-4 flex justify-end">
        <a
          href={`/teacher/courses/${courseId}/scores/export`}
          className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
        >
          <Download className="h-4 w-4" />
          ดาวน์โหลดคะแนน (Excel)
        </a>
      </div>
    </div>
  );
}
