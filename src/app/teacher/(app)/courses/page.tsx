import Link from "next/link";
import {
  CalendarCheck,
  ClipboardList,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { SuccessPopup } from "@/components/success-popup";
import { SearchBox } from "@/components/search-box";
import { Pagination } from "@/components/pagination";
import {
  courseStatusBadgeClass,
  courseStatusLabel,
  type CourseStatus,
} from "@/lib/course-status";
import { deleteCourse } from "@/app/teacher/(app)/courses/actions";

const PAGE_SIZE = 10;

const ICON_CLASS = "h-4 w-4";

function buildCourseActionLinks(courseId: string) {
  return [
    {
      href: `/teacher/courses/${courseId}/students`,
      label: "จัดการนักเรียน",
      icon: <Users className={ICON_CLASS} />,
    },
    {
      href: `/teacher/courses/${courseId}/grade-structure`,
      label: "ตั้งค่าโครงสร้างคะแนน",
      icon: <SlidersHorizontal className={ICON_CLASS} />,
    },
    {
      href: `/teacher/courses/${courseId}/scores`,
      label: "บันทึกคะแนน",
      icon: <ClipboardList className={ICON_CLASS} />,
    },
    {
      href: `/teacher/courses/${courseId}/attendance`,
      label: "เช็คชื่อ",
      icon: <CalendarCheck className={ICON_CLASS} />,
    },
    {
      href: `/teacher/courses/${courseId}/leaderboard`,
      label: "Leaderboard",
      icon: <Trophy className={ICON_CLASS} />,
    },
    {
      href: `/teacher/courses/${courseId}/edit`,
      label: "แก้ไขรายวิชา",
      icon: <Pencil className={ICON_CLASS} />,
    },
  ];
}

const LEGEND_ICON_CLASS = "h-3.5 w-3.5";

// คำอธิบายไอคอนของคอลัมน์ "การจัดการ" — ไม่ผูกกับวิชาใดวิชาหนึ่ง โชว์ครั้งเดียวด้านบนตาราง
const actionLegend = [
  { label: "นักเรียน", icon: <Users className={LEGEND_ICON_CLASS} /> },
  { label: "โครงสร้างคะแนน", icon: <SlidersHorizontal className={LEGEND_ICON_CLASS} /> },
  { label: "บันทึกคะแนน", icon: <ClipboardList className={LEGEND_ICON_CLASS} /> },
  { label: "เช็คชื่อ", icon: <CalendarCheck className={LEGEND_ICON_CLASS} /> },
  { label: "Leaderboard", icon: <Trophy className={LEGEND_ICON_CLASS} /> },
  { label: "แก้ไข", icon: <Pencil className={LEGEND_ICON_CLASS} /> },
  { label: "ลบ", icon: <Trash2 className={LEGEND_ICON_CLASS} /> },
];

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string; q?: string; page?: string }>;
}) {
  const { error, notice, q, page: rawPage } = await searchParams;
  const page = Math.max(1, Number(rawPage) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  let query = supabase
    .from("courses")
    .select("id, code, name, term, academic_year, status, course_students(count)", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  const safeQ = q?.trim().replace(/[,()%]/g, "");
  if (safeQ) {
    query = query.or(`name.ilike.%${safeQ}%,code.ilike.%${safeQ}%`);
  }

  const { data: courses, count } = await query;

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(targetPage));
    return `/teacher/courses?${params.toString()}`;
  }

  return (
    <div>
      {notice && <SuccessPopup message={notice} />}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--primary-dark)]">จัดการรายวิชา</h1>
          <p className="text-sm text-[var(--muted)]">
            จัดการข้อมูลรายวิชา เพิ่ม แก้ไข หรือลบรายวิชา
          </p>
        </div>
        <Link
          href="/teacher/courses/new"
          className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary)]/90"
        >
          <Plus className="h-4 w-4" />
          เพิ่มรายวิชาใหม่
        </Link>
      </div>

      {error && (
        <p className="mb-4 rounded-[var(--radius)] bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
        <div className="p-4">
          <form method="get">
            <SearchBox defaultValue={q} placeholder="ค้นหารหัสวิชา, ชื่อวิชา..." />
          </form>
        </div>

        {courses?.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-[var(--muted)]">
            {safeQ ? "ไม่พบรายวิชาที่ค้นหา" : "ยังไม่มีรายวิชา กดปุ่ม “เพิ่มรายวิชาใหม่” เพื่อเริ่มต้น"}
          </p>
        ) : (
          <>
            {/* มือถือ: card-list — จอใหญ่ขึ้นไปใช้ตารางแทน */}
            <div className="divide-y divide-[var(--border)] sm:hidden">
              {courses?.map((course) => {
                const status = course.status as CourseStatus;
                const studentCount = course.course_students?.[0]?.count ?? 0;

                return (
                  <div key={course.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-[var(--foreground)]">{course.name}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {course.code} · ภาคเรียนที่ {course.term}/{course.academic_year}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${courseStatusBadgeClass[status]}`}
                      >
                        {courseStatusLabel[status]}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-[var(--muted)]">นักเรียน {studentCount} คน</p>
                      <div className="flex items-center gap-3">
                        {buildCourseActionLinks(course.id).map((action) => (
                          <Link
                            key={action.href}
                            href={action.href}
                            aria-label={action.label}
                            className="text-[var(--muted)] hover:text-[var(--primary)]"
                          >
                            {action.icon}
                          </Link>
                        ))}
                        <ConfirmDeleteButton
                          action={deleteCourse}
                          confirmMessage={`ยืนยันลบวิชา "${course.name}"? ข้อมูลนักเรียนและคะแนนในวิชานี้จะถูกลบไปด้วย`}
                          hiddenFields={{ courseId: course.id }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">รหัสวิชา</th>
                    <th className="px-4 py-3 font-medium">ชื่อวิชา</th>
                    <th className="px-4 py-3 font-medium">ภาคเรียน</th>
                    <th className="px-4 py-3 font-medium">จำนวนนักเรียน</th>
                    <th className="px-4 py-3 font-medium">สถานะ</th>
                    <th className="px-4 py-3 font-medium">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {courses?.map((course) => {
                    const status = course.status as CourseStatus;
                    const studentCount = course.course_students?.[0]?.count ?? 0;

                    return (
                      <tr key={course.id}>
                        <td className="px-4 py-3 font-medium text-[var(--foreground)]">
                          {course.code}
                        </td>
                        <td className="px-4 py-3">{course.name}</td>
                        <td className="px-4 py-3">
                          {course.term}/{course.academic_year}
                        </td>
                        <td className="px-4 py-3">{studentCount}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${courseStatusBadgeClass[status]}`}
                          >
                            {courseStatusLabel[status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {buildCourseActionLinks(course.id).map((action) => (
                              <Link
                                key={action.href}
                                href={action.href}
                                aria-label={action.label}
                                className="text-[var(--muted)] hover:text-[var(--primary)]"
                              >
                                {action.icon}
                              </Link>
                            ))}
                            <ConfirmDeleteButton
                              action={deleteCourse}
                              confirmMessage={`ยืนยันลบวิชา "${course.name}"? ข้อมูลนักเรียนและคะแนนในวิชานี้จะถูกลบไปด้วย`}
                              hiddenFields={{ courseId: course.id }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {count !== null && count !== undefined && count > 0 && (
          <Pagination page={page} pageSize={PAGE_SIZE} total={count} buildHref={buildHref} />
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
        <span className="font-medium text-[var(--foreground)]">คำอธิบายไอคอน:</span>
        {actionLegend.map((item) => (
          <span key={item.label} className="flex items-center gap-1">
            {item.icon}
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
