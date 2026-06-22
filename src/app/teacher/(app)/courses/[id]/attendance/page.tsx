import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StudentAvatar } from "@/components/student-avatar";
import { SuccessPopup } from "@/components/success-popup";
import { formatStudentFullName } from "@/lib/student-name";
import {
  attendanceStatusLabel,
  attendanceStatusOptions,
  attendanceStatusPeerCheckedClass,
} from "@/lib/attendance-status";
import type { AttendanceStatus } from "@/lib/attendance-status";
import { saveAttendance } from "./actions";

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function AttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string; error?: string; saved?: string }>;
}) {
  const { id: courseId } = await params;
  const { date: rawDate, error, saved } = await searchParams;
  const sessionDate = rawDate || todayDateString();

  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id, name")
    .eq("id", courseId)
    .single();

  if (!course) notFound();

  type RosterRow = {
    student_id: string;
    students: { id: string; name: string; title: string; student_code: string } | null;
  };

  const [{ data: roster }, { data: pastSessions }, { data: session }] = await Promise.all([
    supabase
      .from("course_students")
      .select("student_id, students(id, name, title, student_code)")
      .eq("course_id", courseId)
      .returns<RosterRow[]>(),
    supabase
      .from("attendance_sessions")
      .select("id, session_date")
      .eq("course_id", courseId)
      .order("session_date", { ascending: false })
      .limit(14),
    supabase
      .from("attendance_sessions")
      .select("id")
      .eq("course_id", courseId)
      .eq("session_date", sessionDate)
      .maybeSingle(),
  ]);

  const students = (roster ?? [])
    .map((row) => row.students)
    .filter((s): s is { id: string; name: string; title: string; student_code: string } => Boolean(s))
    .sort((a, b) => a.student_code.localeCompare(b.student_code));

  const recordsByStudentId = new Map<string, { status: AttendanceStatus; note: string }>();
  if (session) {
    const { data: records } = await supabase
      .from("attendance_records")
      .select("student_id, status, note")
      .eq("session_id", session.id);

    for (const r of records ?? []) {
      recordsByStudentId.set(r.student_id, { status: r.status as AttendanceStatus, note: r.note });
    }
  }

  return (
    <div>
      <p className="mb-1 text-sm text-[var(--muted)]">
        <Link href="/teacher/courses" className="hover:underline">
          รายวิชา
        </Link>{" "}
        <span className="mx-1">{">"}</span>
        {course.name}
      </p>

      <h1 className="mb-1 text-2xl font-bold text-[var(--primary-dark)]">
        เช็คชื่อ - {course.name}
      </h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        บันทึกการเข้าเรียนของนักเรียนรายวัน เลือกวันที่แล้วกดบันทึก
      </p>

      {error && (
        <p className="mb-4 rounded-[var(--radius)] bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {saved && <SuccessPopup message="บันทึกการเช็คชื่อเรียบร้อยแล้ว" />}

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-sm text-[var(--muted)]">วันที่ล่าสุด:</span>
        {(pastSessions ?? []).length === 0 ? (
          <span className="text-sm text-[var(--muted)]">ยังไม่มีการเช็คชื่อ</span>
        ) : (
          (pastSessions ?? []).map((s) => (
            <Link
              key={s.id}
              href={`/teacher/courses/${courseId}/attendance?date=${s.session_date}`}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                s.session_date === sessionDate
                  ? "bg-[var(--primary)] text-white"
                  : "bg-slate-100 text-[var(--foreground)] hover:bg-slate-200"
              }`}
            >
              {s.session_date}
            </Link>
          ))
        )}
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] p-4">
          <CalendarCheck className="h-5 w-5 text-[var(--primary)]" />
          <form method="get" className="flex items-center gap-2">
            <input
              type="date"
              name="date"
              defaultValue={sessionDate}
              max={todayDateString()}
              className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-1.5 text-sm outline-none focus:border-[var(--primary)]"
            />
            <button
              type="submit"
              className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] hover:bg-slate-50"
            >
              ไปวันที่นี้
            </button>
          </form>
        </div>

        {students.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-[var(--muted)]">
            วิชานี้ยังไม่มีนักเรียน ไปเพิ่มนักเรียนก่อนเช็คชื่อ
          </p>
        ) : (
          <form action={saveAttendance} className="divide-y divide-[var(--border)]">
            <input type="hidden" name="courseId" value={courseId} />
            <input type="hidden" name="sessionDate" value={sessionDate} />

            {students.map((student) => {
              const record = recordsByStudentId.get(student.id);
              const currentStatus: AttendanceStatus = record?.status ?? "present";

              return (
                <div
                  key={student.id}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <input type="hidden" name="studentId" value={student.id} />
                  <div className="flex items-center gap-2.5">
                    <StudentAvatar name={student.name} title={student.title} size={28} />
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {formatStudentFullName(student.title, student.name)}
                      </p>
                      <p className="text-xs text-[var(--muted)]">{student.student_code}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {attendanceStatusOptions.map((statusOption) => (
                      <label key={statusOption} className="cursor-pointer">
                        <input
                          type="radio"
                          name={`status-${student.id}`}
                          value={statusOption}
                          defaultChecked={currentStatus === statusOption}
                          className="peer sr-only"
                        />
                        <span
                          className={`rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-[var(--muted)] transition-colors hover:bg-slate-100 ${attendanceStatusPeerCheckedClass[statusOption]}`}
                        >
                          {attendanceStatusLabel[statusOption]}
                        </span>
                      </label>
                    ))}
                    <input
                      type="text"
                      name={`note-${student.id}`}
                      defaultValue={record?.note ?? ""}
                      placeholder="หมายเหตุ"
                      className="w-28 rounded-[var(--radius)] border border-[var(--border)] px-2.5 py-1 text-xs outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                </div>
              );
            })}

            <div className="flex justify-end p-4">
              <button
                type="submit"
                className="rounded-[var(--radius)] bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary)]/90"
              >
                บันทึกการเช็คชื่อ
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
