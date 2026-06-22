import Link from "next/link";
import {
  BookCopy,
  Calculator,
  ChevronRight,
  ClipboardList,
  FlaskConical,
  Globe2,
  Languages,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  courseStatusBadgeClass,
  courseStatusLabel,
  type CourseStatus,
} from "@/lib/course-status";
import { EmptyState } from "@/components/empty-state";

const SUBJECT_THEMES = [
  { match: /คณิต/, icon: Calculator, color: "blue" as const },
  { match: /วิทย์/, icon: FlaskConical, color: "emerald" as const },
  { match: /สังคม|ประวัติ/, icon: Globe2, color: "orange" as const },
  { match: /อังกฤษ|english|ภาษาต่างประเทศ/i, icon: Languages, color: "violet" as const },
];

const COLOR_CLASSES = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", bar: "bg-blue-500", btn: "bg-blue-600 hover:bg-blue-700" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", bar: "bg-emerald-500", btn: "bg-emerald-600 hover:bg-emerald-700" },
  orange: { bg: "bg-orange-50", text: "text-orange-600", bar: "bg-orange-500", btn: "bg-orange-600 hover:bg-orange-700" },
  violet: { bg: "bg-violet-50", text: "text-violet-600", bar: "bg-violet-500", btn: "bg-violet-600 hover:bg-violet-700" },
};

const FALLBACK_COLORS = ["blue", "emerald", "orange", "violet"] as const;

function getSubjectTheme(name: string, index: number) {
  const matched = SUBJECT_THEMES.find((t) => t.match.test(name));
  const color = matched?.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
  return { icon: matched?.icon ?? BookCopy, classes: COLOR_CLASSES[color] };
}

const DASHBOARD_COURSE_LIMIT = 6;

export default async function TeacherDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const name = (user?.user_metadata?.name as string | undefined) ?? user?.email ?? "";

  const [{ data: courses }, { count: studentTotal }, { data: courseStudentRows }, { data: gradeItemRows }, { data: gradedScoreRows }] =
    await Promise.all([
      supabase
        .from("courses")
        .select("id, name, code, term, academic_year, status, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("students").select("id", { count: "exact", head: true }),
      supabase.from("course_students").select("course_id"),
      supabase.from("grade_items").select("id, score_categories!inner(course_id)"),
      supabase
        .from("student_scores")
        .select("id, grade_items!inner(score_categories!inner(course_id))")
        .eq("status", "graded"),
    ]);

  const studentCountByCourse = new Map<string, number>();
  for (const row of courseStudentRows ?? []) {
    studentCountByCourse.set(row.course_id, (studentCountByCourse.get(row.course_id) ?? 0) + 1);
  }

  const itemCountByCourse = new Map<string, number>();
  for (const row of gradeItemRows ?? []) {
    const courseId = (row.score_categories as unknown as { course_id: string }).course_id;
    itemCountByCourse.set(courseId, (itemCountByCourse.get(courseId) ?? 0) + 1);
  }

  const gradedCountByCourse = new Map<string, number>();
  for (const row of gradedScoreRows ?? []) {
    const courseId = (row.grade_items as unknown as { score_categories: { course_id: string } })
      .score_categories.course_id;
    gradedCountByCourse.set(courseId, (gradedCountByCourse.get(courseId) ?? 0) + 1);
  }

  const courseStats = (courses ?? []).map((course) => {
    const studentCount = studentCountByCourse.get(course.id) ?? 0;
    const itemCount = itemCountByCourse.get(course.id) ?? 0;
    const gradedCount = gradedCountByCourse.get(course.id) ?? 0;
    const totalCells = studentCount * itemCount;
    const pendingCount = Math.max(totalCells - gradedCount, 0);
    const progressPercent = totalCells > 0 ? Math.round((gradedCount / totalCells) * 100) : 0;
    return { course, studentCount, itemCount, pendingCount, progressPercent };
  });

  const pendingTotal = courseStats.reduce((sum, c) => sum + c.pendingCount, 0);
  const visibleCourses = courseStats.slice(0, DASHBOARD_COURSE_LIMIT);

  const stats: {
    label: string;
    value: number;
    sub: string;
    icon: typeof BookCopy;
    color: keyof typeof COLOR_CLASSES;
    href?: string;
  }[] = [
    { label: "จำนวนวิชา", value: courses?.length ?? 0, sub: "วิชาที่กำลังดูแล", icon: BookCopy, color: "blue" },
    { label: "นักเรียนทั้งหมด", value: studentTotal ?? 0, sub: "คนในความดูแล", icon: Users, color: "emerald" },
    {
      label: "งานที่ต้องตรวจ",
      value: pendingTotal,
      sub: "ชิ้นงานที่ยังไม่กรอกคะแนน",
      icon: ClipboardList,
      color: "orange",
      href: "/teacher/pending",
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--primary-dark)]">สวัสดี คุณครู{name} 👋</h1>
        <p className="text-sm text-[var(--muted)]">นี่คือภาพรวมการจัดการคะแนนของคุณ</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const classes = COLOR_CLASSES[stat.color];
          const Icon = stat.icon;

          if (stat.href) {
            return (
              <div
                key={stat.label}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-white p-5"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${classes.bg}`}>
                    <Icon className={`h-6 w-6 ${classes.text}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-[var(--muted)]">{stat.label}</p>
                    <p className="text-2xl font-bold text-[var(--primary-dark)]">{stat.value}</p>
                    <p className="truncate text-xs text-[var(--muted)]">{stat.sub}</p>
                  </div>
                </div>
                <Link
                  href={stat.href}
                  className={`flex shrink-0 items-center justify-center gap-1 rounded-[var(--radius)] px-3 py-2 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md ${classes.btn}`}
                >
                  ดู
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            );
          }

          return (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-white p-5"
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${classes.bg}`}>
                <Icon className={`h-6 w-6 ${classes.text}`} />
              </div>
              <div>
                <p className="text-sm text-[var(--muted)]">{stat.label}</p>
                <p className="text-2xl font-bold text-[var(--primary-dark)]">{stat.value}</p>
                <p className="text-xs text-[var(--muted)]">{stat.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--primary-dark)]">รายวิชาของฉัน</h2>
        <Link
          href="/teacher/courses"
          className="flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline"
        >
          ดูทั้งหมด
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {visibleCourses.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-white">
          <EmptyState
            icon={BookCopy}
            title="ยังไม่มีรายวิชา"
            description="สร้างรายวิชาแรกเพื่อเริ่มตั้งโครงสร้างคะแนนและจัดการนักเรียน"
            actionHref="/teacher/courses/new"
            actionLabel="เพิ่มรายวิชาใหม่"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCourses.map(({ course, studentCount, progressPercent }, index) => {
            const { icon: Icon, classes } = getSubjectTheme(course.name, index);
            const status = course.status as CourseStatus;
            return (
              <div key={course.id} className="flex flex-col items-stretch gap-4 rounded-2xl border border-[var(--border)] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${classes.bg}`}>
                        <Icon className={`h-5 w-5 ${classes.text}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[var(--primary-dark)]">{course.name}</p>
                        <p className="text-xs text-[var(--muted)]">นักเรียน {studentCount} คน</p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${courseStatusBadgeClass[status]}`}
                    >
                      {courseStatusLabel[status]}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-[var(--muted)]">ความคืบหน้าการตรวจคะแนน</span>
                      <span className="font-medium text-[var(--primary-dark)]">{progressPercent}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${classes.bar}`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:w-auto">
                  <Link
                    href={`/teacher/courses/${course.id}/scores`}
                    className={`flex items-center justify-center gap-2 rounded-[var(--radius)] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md ${classes.btn}`}
                  >
                    <ClipboardList className="h-4 w-4" />
                    ดูคะแนน
                  </Link>
                  <Link
                    href={`/teacher/courses/${course.id}/edit`}
                    className={`flex items-center justify-center gap-2 rounded-[var(--radius)] border-2 px-4 py-2.5 text-sm font-bold transition-colors hover:bg-white ${classes.bg} ${classes.text}`}
                    style={{ borderColor: "currentColor" }}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    จัดการรายวิชา
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
