import Link from "next/link";
import { Pencil, Plus, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { ResetPinButton } from "@/components/reset-pin-button";
import { PillRemoveButton } from "@/components/pill-remove-button";
import { CopyableSecret } from "@/components/copyable-secret";
import { SearchBox } from "@/components/search-box";
import { Pagination } from "@/components/pagination";
import { StudentAvatar } from "@/components/student-avatar";
import { formatStudentFullName } from "@/lib/student-name";
import {
  enrollStudentInCourse,
  resetStudentPin,
  unenrollStudentFromCourse,
  deleteStudent,
} from "@/app/teacher/(app)/students/actions";

const PAGE_SIZE = 10;

type StudentRow = {
  id: string;
  student_code: string;
  name: string;
  title: string;
  course_students: { courses: { id: string; code: string; name: string } | null }[];
};

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    newPin?: string;
    newName?: string;
    imported?: string;
    created?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const { error, newPin, newName, imported, created, q, page: rawPage } = await searchParams;
  const page = Math.max(1, Number(rawPage) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  let query = supabase
    .from("students")
    .select("id, student_code, name, title, course_students(courses(id, code, name))", {
      count: "exact",
    })
    .order("student_code")
    .range(from, to);

  const safeQ = q?.trim().replace(/[,()%]/g, "");
  if (safeQ) {
    query = query.or(`name.ilike.%${safeQ}%,student_code.ilike.%${safeQ}%`);
  }

  const { data: students, count } = await query.returns<StudentRow[]>();

  const { data: allCourses } = await supabase
    .from("courses")
    .select("id, code, name")
    .order("code");

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(targetPage));
    return `/teacher/students?${params.toString()}`;
  }

  let createdList: { code: string; name: string; title: string; pin: string }[] = [];
  if (created) {
    try {
      createdList = JSON.parse(Buffer.from(created, "base64").toString("utf-8"));
    } catch {
      createdList = [];
    }
  }

  const rows = (students ?? []).map((student, index) => {
    const enrolledCourses = student.course_students
      .map((cs) => cs.courses)
      .filter((c): c is { id: string; code: string; name: string } => Boolean(c));
    const enrolledIds = new Set(enrolledCourses.map((c) => c.id));
    const availableCourses = (allCourses ?? []).filter((c) => !enrolledIds.has(c.id));
    return { student, index, enrolledCourses, availableCourses };
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--primary-dark)]">จัดการนักเรียน</h1>
          <p className="text-sm text-[var(--muted)]">
            นักเรียนทั้งหมดของคุณ ดู แก้ไข รีเซ็ต PIN หรือเพิ่มเข้ารายวิชา
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/teacher/students/new"
            className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary)]/90"
          >
            <Plus className="h-4 w-4" />
            เพิ่มนักเรียนใหม่
          </Link>
          <Link
            href="/teacher/students/import"
            className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
          >
            <Upload className="h-4 w-4" />
            นำเข้า Excel
          </Link>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-[var(--radius)] bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {newPin && (
        <div className="mb-4 rounded-[var(--radius)] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          PIN ของ {newName} คือ <CopyableSecret value={newPin} /> — บันทึก/แจ้งนักเรียนตอนนี้เลย
          ระบบจะไม่แสดง PIN นี้ให้ดูอีก (เก็บเป็น hash เท่านั้น)
        </div>
      )}

      {imported && (
        <div className="mb-4 rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-3 text-sm">
          นำเข้านักเรียนสำเร็จ {imported} คน
          {createdList.length > 0 && (
            <div className="mt-3 overflow-x-auto rounded-[var(--radius)] border border-amber-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-amber-50 text-amber-800">
                  <tr>
                    <th className="px-3 py-2">รหัส</th>
                    <th className="px-3 py-2">ชื่อ</th>
                    <th className="px-3 py-2">PIN (ครั้งเดียว)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {createdList.map((s) => (
                    <tr key={s.code}>
                      <td className="px-3 py-2">{s.code}</td>
                      <td className="px-3 py-2">{formatStudentFullName(s.title, s.name)}</td>
                      <td className="px-3 py-2">
                        <CopyableSecret value={s.pin} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
        <div className="p-4">
          <form method="get">
            <SearchBox defaultValue={q} placeholder="ค้นหาชื่อนักเรียน, รหัสนักเรียน..." />
          </form>
        </div>

        {rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-[var(--muted)]">
            {safeQ ? "ไม่พบนักเรียนที่ค้นหา" : "ยังไม่มีนักเรียน กดปุ่ม “เพิ่มนักเรียนใหม่” เพื่อเริ่มต้น"}
          </p>
        ) : (
          <>
            {/* มือถือ: card-list — จอใหญ่ขึ้นไปใช้ตารางแทน */}
            <div className="divide-y divide-[var(--border)] sm:hidden">
              {rows.map(({ student, index, enrolledCourses, availableCourses }) => (
                <div key={student.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <StudentAvatar name={student.name} title={student.title} />
                      <div>
                        <p className="font-medium text-[var(--foreground)]">
                          {formatStudentFullName(student.title, student.name)}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          #{from + index + 1} · {student.student_code}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Link
                        href={`/teacher/students/${student.id}/edit`}
                        className="text-[var(--primary)] hover:opacity-70"
                        aria-label="แก้ไข"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <ResetPinButton
                        action={resetStudentPin}
                        hiddenFields={{ studentId: student.id, name: student.name }}
                      />
                      <ConfirmDeleteButton
                        action={deleteStudent}
                        confirmMessage={`ลบนักเรียน "${student.name}" ออกจากระบบทั้งหมด? จะถูกเอาออกจากทุกวิชาและลบคะแนนทั้งหมดด้วย`}
                        hiddenFields={{ studentId: student.id }}
                      />
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {enrolledCourses.map((course) => (
                      <span
                        key={course.id}
                        className="inline-flex items-center rounded-full bg-[var(--primary)]/10 px-2.5 py-1 text-xs font-medium text-[var(--primary-dark)]"
                      >
                        {course.code}
                        <PillRemoveButton
                          action={unenrollStudentFromCourse}
                          hiddenFields={{ studentId: student.id, courseId: course.id }}
                          confirmMessage={`นำ "${student.name}" ออกจากวิชา ${course.code}?`}
                        />
                      </span>
                    ))}

                    {availableCourses.length > 0 && (
                      <form action={enrollStudentInCourse} className="flex items-center gap-1">
                        <input type="hidden" name="studentId" value={student.id} />
                        <select
                          name="courseId"
                          defaultValue=""
                          required
                          className="rounded-full border border-[var(--border)] bg-white px-2 py-1 text-xs outline-none focus:border-[var(--primary)]"
                        >
                          <option value="" disabled>
                            + เพิ่มวิชา
                          </option>
                          {availableCourses.map((course) => (
                            <option key={course.id} value={course.id}>
                              {course.code}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-[var(--foreground)] hover:bg-slate-200"
                        >
                          เพิ่ม
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">ลำดับ</th>
                    <th className="px-4 py-3 font-medium">รหัสนักเรียน</th>
                    <th className="px-4 py-3 font-medium">ชื่อ-นามสกุล</th>
                    <th className="px-4 py-3 font-medium">วิชาที่ลงทะเบียน</th>
                    <th className="px-4 py-3 font-medium">PIN</th>
                    <th className="px-4 py-3 font-medium">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {rows.map(({ student, index, enrolledCourses, availableCourses }) => (
                    <tr key={student.id}>
                      <td className="px-4 py-3">{from + index + 1}</td>
                      <td className="px-4 py-3 font-medium text-[var(--foreground)]">
                        {student.student_code}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <StudentAvatar name={student.name} title={student.title} />
                          {formatStudentFullName(student.title, student.name)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {enrolledCourses.map((course) => (
                            <span
                              key={course.id}
                              className="inline-flex items-center rounded-full bg-[var(--primary)]/10 px-2.5 py-1 text-xs font-medium text-[var(--primary-dark)]"
                            >
                              {course.code}
                              <PillRemoveButton
                                action={unenrollStudentFromCourse}
                                hiddenFields={{ studentId: student.id, courseId: course.id }}
                                confirmMessage={`นำ "${student.name}" ออกจากวิชา ${course.code}?`}
                              />
                            </span>
                          ))}

                          {availableCourses.length > 0 && (
                            <form action={enrollStudentInCourse} className="flex items-center gap-1">
                              <input type="hidden" name="studentId" value={student.id} />
                              <select
                                name="courseId"
                                defaultValue=""
                                required
                                className="rounded-full border border-[var(--border)] bg-white px-2 py-1 text-xs outline-none focus:border-[var(--primary)]"
                              >
                                <option value="" disabled>
                                  + เพิ่มวิชา
                                </option>
                                {availableCourses.map((course) => (
                                  <option key={course.id} value={course.id}>
                                    {course.code}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="submit"
                                className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-[var(--foreground)] hover:bg-slate-200"
                              >
                                เพิ่ม
                              </button>
                            </form>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 tracking-widest text-[var(--muted)]">••••••</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/teacher/students/${student.id}/edit`}
                            className="text-[var(--primary)] hover:opacity-70"
                            aria-label="แก้ไข"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <ResetPinButton
                            action={resetStudentPin}
                            hiddenFields={{ studentId: student.id, name: student.name }}
                          />
                          <ConfirmDeleteButton
                            action={deleteStudent}
                            confirmMessage={`ลบนักเรียน "${student.name}" ออกจากระบบทั้งหมด? จะถูกเอาออกจากทุกวิชาและลบคะแนนทั้งหมดด้วย`}
                            hiddenFields={{ studentId: student.id }}
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

        {count !== null && count !== undefined && count > 0 && (
          <Pagination page={page} pageSize={PAGE_SIZE} total={count} buildHref={buildHref} />
        )}
      </div>
    </div>
  );
}
