import Link from "next/link";
import { Download, LineChart, TrendingDown, TrendingUp, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCourseReportData } from "@/lib/report-data";
import { CourseSelect } from "@/components/course-select";
import { ReportBarChart } from "@/components/report-bar-chart";
import { ReportLineChart } from "@/components/report-line-chart";
import { Pagination } from "@/components/pagination";
import { PrintButton } from "@/components/print-button";
import { StudentAvatar } from "@/components/student-avatar";
import { formatStudentFullName } from "@/lib/student-name";

const PAGE_SIZE = 10;

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; page?: string }>;
}) {
  const { course: courseIdParam, page: rawPage } = await searchParams;
  const page = Math.max(1, Number(rawPage) || 1);

  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, name, code")
    .order("created_at", { ascending: false });

  if (!courses || courses.length === 0) {
    return (
      <div>
        <h1 className="mb-1 text-2xl font-bold text-[var(--primary-dark)]">รายงานและสถิติ</h1>
        <p className="mb-6 text-sm text-[var(--muted)]">ภาพรวมผลการเรียนของนักเรียนในแต่ละวิชา</p>
        <p className="rounded-2xl border border-dashed border-[var(--border)] bg-white py-10 text-center text-sm text-[var(--muted)]">
          ยังไม่มีรายวิชา —{" "}
          <Link href="/teacher/courses/new" className="text-[var(--primary)] underline">
            สร้างวิชาใหม่
          </Link>{" "}
          ก่อนดูรายงาน
        </p>
      </div>
    );
  }

  const courseId = courseIdParam && courses.some((c) => c.id === courseIdParam) ? courseIdParam : courses[0].id;
  const report = await getCourseReportData(courseId);

  if (!report) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-[var(--primary-dark)]">รายงานและสถิติ</h1>
        <p className="mt-4 text-sm text-[var(--muted)]">ไม่พบข้อมูลวิชานี้</p>
      </div>
    );
  }

  const from = (page - 1) * PAGE_SIZE;
  const pageRows = report.ranked.slice(from, from + PAGE_SIZE);

  function buildHref(targetPage: number) {
    return `/teacher/reports?course=${courseId}&page=${targetPage}`;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--primary-dark)]">รายงานและสถิติ</h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-[var(--muted)] print:hidden">
            <span>รายวิชา:</span>
            <CourseSelect courses={courses} value={courseId} basePath="/teacher/reports" />
          </div>
          <p className="mt-2 hidden text-sm text-[var(--muted)] print:block">
            รายวิชา: {report.course.code} · {report.course.name} (ภาคเรียนที่ {report.course.term}/
            {report.course.academic_year})
          </p>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <PrintButton />
          <a
            href={`/teacher/courses/${courseId}/scores/export`}
            className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary)]/90"
          >
            <Download className="h-4 w-4" />
            ดาวน์โหลด Excel
          </a>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <LineChart className="h-4 w-4" />
          </span>
          <p className="mt-3 text-2xl font-bold text-[var(--foreground)]">
            {report.studentCount > 0 ? report.average.toFixed(1) : "-"}
          </p>
          <p className="text-xs text-[var(--muted)]">คะแนนเฉลี่ย (Average)</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <TrendingUp className="h-4 w-4" />
          </span>
          <p className="mt-3 text-2xl font-bold text-[var(--foreground)]">
            {report.studentCount > 0 ? report.highest : "-"}
          </p>
          <p className="text-xs text-[var(--muted)]">คะแนนสูงสุด (Highest)</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 text-orange-600">
            <TrendingDown className="h-4 w-4" />
          </span>
          <p className="mt-3 text-2xl font-bold text-[var(--foreground)]">
            {report.studentCount > 0 ? report.lowest : "-"}
          </p>
          <p className="text-xs text-[var(--muted)]">คะแนนต่ำสุด (Lowest)</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 text-purple-600">
            <Users className="h-4 w-4" />
          </span>
          <p className="mt-3 text-2xl font-bold text-[var(--foreground)]">
            {report.passRate !== null ? `${report.passRate.toFixed(0)}%` : "-"}
          </p>
          <p className="text-xs text-[var(--muted)]">
            อัตราการผ่าน (Pass Rate)
            {report.passThreshold !== null && (
              <span className="block">เกณฑ์ผ่าน {report.passThreshold} คะแนน</span>
            )}
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">
            การกระจายคะแนน (จำนวนนักเรียน)
          </h2>
          <ReportBarChart data={report.distribution} />
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">
            แนวโน้มคะแนนเฉลี่ยแต่ละชิ้นงาน
          </h2>
          <ReportLineChart data={report.itemTrend} />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
        <p className="border-b border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--foreground)]">
          อันดับคะแนนนักเรียนในวิชา
        </p>
        {report.ranked.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-[var(--muted)]">วิชานี้ยังไม่มีนักเรียน</p>
        ) : (
          <>
            <div className="divide-y divide-[var(--border)] sm:hidden print:hidden">
              {pageRows.map((row, i) => {
                const rank = from + i + 1;
                const passed = report.passThreshold !== null && row.total >= report.passThreshold;
                const rankBg =
                  rank === 1
                    ? "bg-amber-400 text-white"
                    : rank === 2
                      ? "bg-slate-300 text-white"
                      : rank === 3
                        ? "bg-orange-300 text-white"
                        : "bg-slate-100 text-[var(--muted)]";

                return (
                  <div key={row.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${rankBg}`}
                      >
                        {rank}
                      </span>
                      <div className="flex items-center gap-2">
                        <StudentAvatar name={row.name} title={row.title} />
                        <div>
                          <p className="font-medium text-[var(--foreground)]">
                            {formatStudentFullName(row.title, row.name)}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            {row.total.toFixed(2)} คะแนน · เกรด {row.gradeLetter}
                          </p>
                        </div>
                      </div>
                    </div>
                    {report.passThreshold !== null && (
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {passed ? "ผ่าน" : "ไม่ผ่าน"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto sm:block print:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">อันดับ</th>
                    <th className="px-4 py-3 font-medium">ชื่อ-นามสกุล</th>
                    <th className="px-4 py-3 font-medium">คะแนนรวม (เต็ม 100)</th>
                    <th className="px-4 py-3 font-medium">เกรด</th>
                    <th className="px-4 py-3 font-medium">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {pageRows.map((row, i) => {
                    const rank = from + i + 1;
                    const passed = report.passThreshold !== null && row.total >= report.passThreshold;
                    const rankBg =
                      rank === 1
                        ? "bg-amber-400 text-white"
                        : rank === 2
                          ? "bg-slate-300 text-white"
                          : rank === 3
                            ? "bg-orange-300 text-white"
                            : "bg-slate-100 text-[var(--muted)]";

                    return (
                      <tr key={row.id}>
                        <td className="px-4 py-3">
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${rankBg}`}
                          >
                            {rank}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <StudentAvatar name={row.name} title={row.title} />
                            {formatStudentFullName(row.title, row.name)}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-[var(--foreground)]">
                          {row.total.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">{row.gradeLetter}</td>
                        <td className="px-4 py-3">
                          {report.passThreshold === null ? (
                            <span className="text-[var(--muted)]">-</span>
                          ) : (
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                              }`}
                            >
                              {passed ? "ผ่าน" : "ไม่ผ่าน"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {report.ranked.length > 0 && (
          <div className="print:hidden">
            <Pagination page={page} pageSize={PAGE_SIZE} total={report.ranked.length} buildHref={buildHref} />
          </div>
        )}
      </div>
    </div>
  );
}
