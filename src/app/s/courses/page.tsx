import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, ChevronRight, Inbox } from "lucide-react";
import { STUDENT_SESSION_COOKIE, verifySessionToken } from "@/lib/student-session";
import { getStudentCourses } from "@/lib/student-score-view";
import { EmptyState } from "@/components/empty-state";

export default async function StudentCoursesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(STUDENT_SESSION_COOKIE)?.value;
  const session = token ? verifySessionToken(token) : null;

  if (!session) {
    redirect("/s");
  }

  const courses = await getStudentCourses(session.studentId);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--primary-dark)]">วิชาของฉัน</h1>
        <p className="text-sm text-[var(--muted)]">เลือกวิชาที่ต้องการดูคะแนน</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Link
            key={course.id}
            href={`/s/${course.id}`}
            className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-4 transition-colors hover:border-[var(--primary)]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
              <BookOpen className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--foreground)]">{course.name}</p>
              <p className="text-xs text-[var(--muted)]">
                {course.code} · ภาคเรียนที่ {course.term}/{course.academic_year}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-[var(--muted)]" />
          </Link>
        ))}

        {courses.length === 0 && (
          <div className="col-span-full rounded-2xl border border-[var(--border)] bg-white">
            <EmptyState
              icon={Inbox}
              title="ยังไม่มีวิชาที่ลงทะเบียนไว้"
              description="ติดต่อครูผู้สอนให้เพิ่มชื่อคุณเข้าวิชา"
            />
          </div>
        )}
      </div>
    </div>
  );
}
