import { Fragment } from "react";
import Link from "next/link";
import {
  BookCopy,
  CalendarCheck,
  ClipboardList,
  Copy,
  Pencil,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { DuplicateCourseButton } from "@/components/duplicate-course-button";
import { SuccessPopup } from "@/components/success-popup";
import { CourseFilters } from "@/components/course-filters";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
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
      href: `/teacher/courses/${courseId}/levels`,
      label: "เลเวลนักเรียน",
      icon: <Sparkles className={ICON_CLASS} />,
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
  { label: "เลเวลนักเรียน", icon: <Sparkles className={LEGEND_ICON_CLASS} /> },
  { label: "แก้ไข", icon: <Pencil className={LEGEND_ICON_CLASS} /> },
  { label: "ทำสำเนา", icon: <Copy className={LEGEND_ICON_CLASS} /> },
  { label: "ลบ", icon: <Trash2 className={LEGEND_ICON_CLASS} /> },
];

type CourseRow = {
  id: string;
  code: string;
  name: string;
  term: string;
  academic_year: string;
  status: string;
  section: string;
  course_students: { count: number }[] | null;
};

type CourseGroup = {
  key: string;
  academicYear: string;
  term: string;
  code: string;
  name: string;
  courses: CourseRow[];
};

// เรียงด้วยค่าตัวเลข (ไม่ใช่ text) กันปัญหาเทอม/ปีการศึกษาเรียงผิดลำดับ (เช่น "2568" เทียบ string แล้วคลาดเคลื่อนได้ถ้ารูปแบบไม่ตรงกันทุกแถว)
// เรียงตามลำดับเวลาจริง: ปีการศึกษาเก่าไปใหม่ (asc) แล้วภายในปีเดียวกันเรียงภาคเรียน 1 → 2 → 3 (asc)
// เช่น เทอม 2/2568 ต้องขึ้นก่อนเทอม 1/2569 เพราะเรียนมาก่อนตามเวลาจริง
function sortCourses(courses: CourseRow[]): CourseRow[] {
  return [...courses].sort((a, b) => {
    const yearDiff = Number(a.academic_year) - Number(b.academic_year);
    if (yearDiff !== 0) return yearDiff;
    const termDiff = Number(a.term) - Number(b.term);
    if (termDiff !== 0) return termDiff;
    const codeDiff = a.code.localeCompare(b.code);
    if (codeDiff !== 0) return codeDiff;
    return a.section.localeCompare(b.section);
  });
}

// group แถว course ที่ code+name+ภาคเรียน/ปีการศึกษาตรงกัน ให้ห้อง (section) ของวิชาเดียวกันอยู่ติดกัน
// รักษาลำดับตามที่ส่งเข้ามา (ต้อง sortCourses มาก่อนแล้ว) ไม่ sort ซ้ำในนี้
function groupCourses(courses: CourseRow[]): CourseGroup[] {
  const groups: CourseGroup[] = [];
  const indexByKey = new Map<string, number>();

  for (const course of courses) {
    const key = `${course.academic_year}|${course.term}|${course.code}|${course.name}`;
    const existingIndex = indexByKey.get(key);
    if (existingIndex !== undefined) {
      groups[existingIndex].courses.push(course);
      continue;
    }
    indexByKey.set(key, groups.length);
    groups.push({
      key,
      academicYear: course.academic_year,
      term: course.term,
      code: course.code,
      name: course.name,
      courses: [course],
    });
  }

  return groups;
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string; q?: string; year?: string; page?: string }>;
}) {
  const { error, notice, q, year, page: rawPage } = await searchParams;
  const page = Math.max(1, Number(rawPage) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE;

  const supabase = await createClient();

  // ดึงวิชาทั้งหมดของครูคนนี้มาเรียง/กรอง/group ในแอป (จำนวนวิชาต่อครูน้อย ไม่กระทบ performance)
  const { data } = await supabase
    .from("courses")
    .select("id, code, name, term, academic_year, status, section, course_students(count)");

  const allCourses = sortCourses(data ?? []);

  const yearOptions = Array.from(new Set(allCourses.map((c) => c.academic_year))).sort(
    (a, b) => Number(b) - Number(a),
  );

  const safeQ = q?.trim().toLowerCase();
  const filteredCourses = allCourses.filter((c) => {
    const matchesQuery =
      !safeQ || c.name.toLowerCase().includes(safeQ) || c.code.toLowerCase().includes(safeQ);
    const matchesYear = !year || c.academic_year === year;
    return matchesQuery && matchesYear;
  });

  const groups = groupCourses(filteredCourses);
  const pagedGroups = groups.slice(from, to);

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (year) params.set("year", year);
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
          <CourseFilters defaultQuery={q} defaultYear={year} yearOptions={yearOptions} />
        </div>

        {groups.length === 0 ? (
          safeQ || year ? (
            <p className="px-4 py-10 text-center text-sm text-[var(--muted)]">
              ไม่พบรายวิชาที่ค้นหา
            </p>
          ) : (
            <EmptyState
              icon={BookCopy}
              title="ยังไม่มีรายวิชา"
              description="เริ่มต้นด้วยการสร้างรายวิชาแรกของคุณ แล้วค่อยตั้งโครงสร้างคะแนนและเพิ่มนักเรียนทีหลังได้"
              actionHref="/teacher/courses/new"
              actionLabel="เพิ่มรายวิชาใหม่"
            />
          )
        ) : (
          <>
            {/* มือถือ: card-list — จอใหญ่ขึ้นไปใช้ตารางแทน */}
            <div className="divide-y divide-[var(--border)] sm:hidden">
              {pagedGroups.map((group, groupIndex) => {
                const prevGroup = pagedGroups[groupIndex - 1];
                const showTermDivider =
                  !prevGroup ||
                  prevGroup.academicYear !== group.academicYear ||
                  prevGroup.term !== group.term;

                return (
                  <div key={group.key}>
                    {showTermDivider && (
                      <p className="bg-slate-50 px-4 py-2 text-xs font-medium text-[var(--muted)]">
                        ภาคเรียนที่ {group.term}/{group.academicYear}
                      </p>
                    )}
                    <div className="px-4 py-3">
                      <p className="font-medium text-[var(--foreground)]">
                        {group.code} · {group.name}
                      </p>
                      <div className="mt-2 space-y-2 border-l border-[var(--border)] pl-3">
                        {group.courses.map((course) => {
                          const status = course.status as CourseStatus;
                          const studentCount = course.course_students?.[0]?.count ?? 0;

                          return (
                            <div key={course.id}>
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-xs text-[var(--muted)]">
                                  {course.section ? `ห้อง ${course.section}` : "ไม่ระบุห้อง"}
                                </p>
                                <span
                                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${courseStatusBadgeClass[status]}`}
                                >
                                  {courseStatusLabel[status]}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center justify-between">
                                <p className="text-xs text-[var(--muted)]">
                                  นักเรียน {studentCount} คน
                                </p>
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
                                  <DuplicateCourseButton courseId={course.id} />
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
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">ห้อง</th>
                    <th className="px-4 py-3 font-medium">จำนวนนักเรียน</th>
                    <th className="px-4 py-3 font-medium">สถานะ</th>
                    <th className="px-4 py-3 font-medium">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {pagedGroups.map((group, groupIndex) => {
                    const prevGroup = pagedGroups[groupIndex - 1];
                    const showTermDivider =
                      !prevGroup ||
                      prevGroup.academicYear !== group.academicYear ||
                      prevGroup.term !== group.term;

                    return (
                      <Fragment key={group.key}>
                        {showTermDivider && (
                          <tr key={`${group.key}-term`} className="bg-slate-50">
                            <td colSpan={4} className="px-4 py-2 text-xs font-medium text-[var(--muted)]">
                              ภาคเรียนที่ {group.term}/{group.academicYear}
                            </td>
                          </tr>
                        )}
                        <tr key={`${group.key}-header`} className="bg-slate-50/60">
                          <td colSpan={4} className="px-4 py-2 font-medium text-[var(--foreground)]">
                            {group.code} · {group.name}
                          </td>
                        </tr>
                        {group.courses.map((course) => {
                          const status = course.status as CourseStatus;
                          const studentCount = course.course_students?.[0]?.count ?? 0;

                          return (
                            <tr key={course.id}>
                              <td className="px-4 py-3">
                                {course.section ? `ห้อง ${course.section}` : "ไม่ระบุห้อง"}
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
                                  <DuplicateCourseButton courseId={course.id} />
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
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {groups.length > 0 && (
          <Pagination page={page} pageSize={PAGE_SIZE} total={groups.length} buildHref={buildHref} />
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
