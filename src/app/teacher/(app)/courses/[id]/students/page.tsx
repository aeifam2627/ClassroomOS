import Link from "next/link";
import { notFound } from "next/navigation";
import { FileSpreadsheet, KeyRound, Plus, QrCode, Trash2, Upload, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { ResetPinButton } from "@/components/reset-pin-button";
import { CopyableSecret } from "@/components/copyable-secret";
import { DownloadCsvButton } from "@/components/download-csv-button";
import { PrintButton } from "@/components/print-button";
import { SuccessPopup } from "@/components/success-popup";
import { SearchBox } from "@/components/search-box";
import { Pagination } from "@/components/pagination";
import { StudentAvatar } from "@/components/student-avatar";
import { EmptyState } from "@/components/empty-state";
import { formatStudentFullName } from "@/lib/student-name";
import {
  removeStudentFromCourse,
  resetAllPins,
  resetPin,
} from "@/app/teacher/(app)/courses/[id]/students/actions";

const PAGE_SIZE = 10;

export default async function CourseStudentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    notice?: string;
    newPin?: string;
    newName?: string;
    imported?: string;
    created?: string;
    resetAll?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const { id: courseId } = await params;
  const {
    error,
    notice,
    newPin,
    newName,
    imported,
    created,
    resetAll,
    q,
    page: rawPage,
  } = await searchParams;
  const page = Math.max(1, Number(rawPage) || 1);

  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id, code, name")
    .eq("id", courseId)
    .single();

  if (!course) notFound();

  type RosterRow = {
    student_id: string;
    students: { id: string; student_code: string; name: string; title: string } | null;
  };

  const { data: roster } = await supabase
    .from("course_students")
    .select("student_id, students(id, student_code, name, title)")
    .eq("course_id", courseId)
    .returns<RosterRow[]>();

  const allStudents = (roster ?? [])
    .map((row) => row.students)
    .filter(
      (s): s is { id: string; student_code: string; name: string; title: string } => Boolean(s),
    )
    .sort((a, b) => a.student_code.localeCompare(b.student_code));

  const q_ = q?.trim().toLowerCase();
  const filteredStudents = q_
    ? allStudents.filter(
        (s) => s.name.toLowerCase().includes(q_) || s.student_code.toLowerCase().includes(q_),
      )
    : allStudents;

  const total = filteredStudents.length;
  const from = (page - 1) * PAGE_SIZE;
  const students = filteredStudents.slice(from, from + PAGE_SIZE);

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(targetPage));
    return `/teacher/courses/${courseId}/students?${params.toString()}`;
  }

  let createdList: { code: string; name: string; title: string; pin: string }[] = [];
  if (created) {
    try {
      createdList = JSON.parse(Buffer.from(created, "base64").toString("utf-8"));
    } catch {
      createdList = [];
    }
  }

  let resetAllList: { code: string; name: string; title: string; pin: string }[] = [];
  if (resetAll) {
    try {
      resetAllList = JSON.parse(Buffer.from(resetAll, "base64").toString("utf-8"));
    } catch {
      resetAllList = [];
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

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-bold text-[var(--primary-dark)]">
          จัดการนักเรียน - {course.name}
        </h1>
        <div className="flex items-start gap-3">
          <Link
            href={`/teacher/courses/${courseId}/students/new`}
            className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary)]/90"
          >
            <Plus className="h-4 w-4" />
            เพิ่มนักเรียน
          </Link>
          <Link
            href={`/teacher/courses/${courseId}/students/import`}
            className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
          >
            <Upload className="h-4 w-4" />
            นำเข้า Excel
          </Link>
          <div className="flex flex-col items-center gap-1">
            <Link
              href={`/teacher/courses/${courseId}/share`}
              className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
            >
              <QrCode className="h-4 w-4" />
              QR Code
            </Link>
            <span className="text-xs text-[var(--muted)]">สแกนเข้าดูคะแนน</span>
          </div>
          {allStudents.length > 0 && (
            <ConfirmSubmitButton
              action={resetAllPins}
              confirmMessage={`รีเซ็ต PIN ใหม่ทั้งหมด ${allStudents.length} คนในวิชานี้? PIN เดิมของทุกคนจะใช้ไม่ได้อีก ต้องแจ้ง PIN ใหม่ให้นักเรียนทุกคนทันที`}
              hiddenFields={{ courseId }}
              className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
            >
              <KeyRound className="h-4 w-4" />
              รีเซ็ต PIN ทั้งห้อง
            </ConfirmSubmitButton>
          )}
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-[var(--radius)] bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {notice && <SuccessPopup message={notice} />}

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

      {resetAllList.length > 0 && (
        <div className="mb-4 rounded-[var(--radius)] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
            <p>
              รีเซ็ต PIN ใหม่ทั้งหมด {resetAllList.length} คนแล้ว — บันทึก/แจ้งนักเรียนหรือผู้ปกครองตอนนี้เลย
              ระบบจะไม่แสดง PIN เหล่านี้ให้ดูอีก
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <PrintButton label="พิมพ์รายชื่อ + PIN" />
              <DownloadCsvButton
                headers={["รหัสนักเรียน", "ชื่อ-นามสกุล", "PIN"]}
                rows={resetAllList.map((s) => ({
                  รหัสนักเรียน: s.code,
                  "ชื่อ-นามสกุล": formatStudentFullName(s.title, s.name),
                  PIN: s.pin,
                }))}
                filename={`pin-${course.code}.csv`}
              />
              <Link
                href={`/teacher/courses/${courseId}/students/pin-export?data=${encodeURIComponent(resetAll ?? "")}&code=${encodeURIComponent(course.code)}`}
                className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50"
              >
                <FileSpreadsheet className="h-4 w-4" />
                ดาวน์โหลด Excel
              </Link>
            </div>
          </div>

          <div className="mt-3 overflow-x-auto rounded-[var(--radius)] border border-amber-200 bg-white">
            <table className="w-full text-left text-sm text-[var(--foreground)]">
              <thead className="bg-amber-50 text-amber-800">
                <tr>
                  <th className="px-3 py-2">รหัส</th>
                  <th className="px-3 py-2">ชื่อ</th>
                  <th className="px-3 py-2">PIN ใหม่</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {resetAllList.map((s) => (
                  <tr key={s.code}>
                    <td className="px-3 py-2">{s.code}</td>
                    <td className="px-3 py-2">{formatStudentFullName(s.title, s.name)}</td>
                    <td className="px-3 py-2">
                      <span className="print:hidden">
                        <CopyableSecret value={s.pin} />
                      </span>
                      <span className="hidden font-mono font-semibold print:inline">{s.pin}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <form method="get" className="flex-1">
            <SearchBox defaultValue={q} placeholder="ค้นหาชื่อนักเรียน, รหัสนักเรียน..." />
          </form>
          <p className="text-sm text-[var(--muted)]">
            จำนวนนักเรียนทั้งหมด {allStudents.length} คน
          </p>
        </div>

        {students.length === 0 ? (
          q ? (
            <p className="px-4 py-10 text-center text-sm text-[var(--muted)]">
              ไม่พบนักเรียนที่ค้นหา
            </p>
          ) : (
            <EmptyState
              icon={Users}
              title="ยังไม่มีนักเรียนในวิชานี้"
              description="เพิ่มนักเรียนทีละคน หรือนำเข้าจาก Excel ทั้งห้องในครั้งเดียว — เมื่อมีนักเรียนแล้วจะสร้าง QR Code ให้สแกนเข้าดูคะแนนได้ทันที"
              actionHref={`/teacher/courses/${courseId}/students/new`}
              actionLabel="เพิ่มนักเรียน"
            />
          )
        ) : (
          <>
            <div className="divide-y divide-[var(--border)] sm:hidden">
              {students.map((student, index) => (
                <div key={student.id} className="flex items-center justify-between gap-3 px-4 py-3">
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
                    <ResetPinButton
                      action={resetPin}
                      hiddenFields={{ courseId, studentId: student.id, name: student.name }}
                    />
                    <ConfirmDeleteButton
                      action={removeStudentFromCourse}
                      confirmMessage={`นำ "${student.name}" ออกจากวิชานี้? (ไม่ได้ลบบัญชีนักเรียน แค่เอาออกจากวิชานี้)`}
                      hiddenFields={{ courseId, studentId: student.id }}
                    />
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
                    <th className="px-4 py-3 font-medium">PIN</th>
                    <th className="px-4 py-3 font-medium">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {students.map((student, index) => (
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
                      <td className="px-4 py-3 tracking-widest text-[var(--muted)]">••••••</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <ResetPinButton
                            action={resetPin}
                            hiddenFields={{ courseId, studentId: student.id, name: student.name }}
                          />
                          <ConfirmDeleteButton
                            action={removeStudentFromCourse}
                            confirmMessage={`นำ "${student.name}" ออกจากวิชานี้? (ไม่ได้ลบบัญชีนักเรียน แค่เอาออกจากวิชานี้)`}
                            hiddenFields={{ courseId, studentId: student.id }}
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

        {total > 0 && (
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} buildHref={buildHref} />
        )}
      </div>

      {allStudents.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
          <span className="font-medium text-[var(--foreground)]">คำอธิบายไอคอน:</span>
          <span className="flex items-center gap-1">
            <KeyRound className="h-3.5 w-3.5 text-amber-500" />
            รีเซ็ต PIN
          </span>
          <span className="flex items-center gap-1">
            <Trash2 className="h-3.5 w-3.5 text-red-500" />
            นำออกจากวิชา
          </span>
        </div>
      )}
    </div>
  );
}
