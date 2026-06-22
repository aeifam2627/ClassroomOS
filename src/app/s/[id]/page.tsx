import { cookies } from "next/headers";
import Link from "next/link";
import { Backpack, CalendarCheck, ClipboardList, GraduationCap, Trophy } from "lucide-react";
import { STUDENT_SESSION_COOKIE, verifySessionToken } from "@/lib/student-session";
import {
  getStudentAttendanceSummary,
  getStudentLoginContext,
  getStudentScoreView,
  type StudentAttendanceSummary,
} from "@/lib/student-score-view";
import { attendanceStatusLabel } from "@/lib/attendance-status";
import { gradeRingHex } from "@/lib/grade-color";
import { categoryColor } from "@/lib/category-color";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { ScoreGauge } from "@/components/score-gauge";
import { StudentAvatar } from "@/components/student-avatar";
import { StudentLoginCard } from "@/components/student-login-card";
import { formatStudentFullName } from "@/lib/student-name";
import { getCourseLeaderboard, studentAlias, type LeaderboardData } from "@/lib/leaderboard";
import { studentLogin } from "./actions";

export default async function StudentPortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id: courseId } = await params;
  const { error } = await searchParams;

  const loginContext = await getStudentLoginContext(courseId);

  if (!loginContext) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <GraduationCap className="h-10 w-10 text-[var(--primary)]" />
        <h1 className="text-xl font-bold text-[var(--primary-dark)]">ลิงก์เข้าดูคะแนนไม่ถูกต้อง</h1>
        <p className="max-w-sm text-sm text-[var(--muted)]">
          ตรวจสอบลิงก์หรือ QR Code อีกครั้ง หรือสอบถามครูผู้สอน
        </p>
      </main>
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(STUDENT_SESSION_COOKIE)?.value;
  const session = token ? verifySessionToken(token) : null;

  if (session) {
    const view = await getStudentScoreView(courseId, session.studentId);
    if (view) {
      const [leaderboard, attendance] = await Promise.all([
        getCourseLeaderboard(courseId),
        getStudentAttendanceSummary(courseId, session.studentId),
      ]);
      return (
        <StudentScoreCard
          view={view}
          leaderboard={leaderboard}
          attendance={attendance}
          studentId={session.studentId}
        />
      );
    }

    // login แล้วจริง แต่ไม่ได้ลงทะเบียนวิชานี้ — ต่างจาก "ยังไม่ login" ต้องบอกให้ไปดูวิชาที่มีจริงแทน ไม่ใช่ขึ้นฟอร์ม login ซ้ำ
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <GraduationCap className="h-10 w-10 text-[var(--primary)]" />
        <h1 className="text-xl font-bold text-[var(--primary-dark)]">คุณไม่ได้ลงทะเบียนวิชานี้</h1>
        <p className="max-w-sm text-sm text-[var(--muted)]">
          {loginContext.courseName} ไม่อยู่ในรายชื่อวิชาของคุณ ลองดูวิชาอื่นที่ลงทะเบียนไว้
        </p>
        <Link
          href="/s/courses"
          className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary)]/90"
        >
          ดูวิชาของฉัน
        </Link>
      </div>
    );
  }

  return (
    <StudentLoginCard
      action={studentLogin}
      subtitle={
        loginContext.teacherName
          ? `${loginContext.courseName} · ${loginContext.teacherName}`
          : loginContext.courseName
      }
      error={error}
      hiddenFields={{ courseId }}
    />
  );
}

function StudentScoreCard({
  view,
  leaderboard,
  attendance,
  studentId,
}: {
  view: NonNullable<Awaited<ReturnType<typeof getStudentScoreView>>>;
  leaderboard: LeaderboardData | null;
  attendance: StudentAttendanceSummary;
  studentId: string;
}) {
  const { course, student, categories, scoreOf, statusOf, total, grade, lastUpdatedAt } = view;
  const ringColor = gradeRingHex(grade?.gpa_value ?? null);

  const orderedItems = categories.flatMap((category, categoryIndex) =>
    category.grade_items.map((item) => ({ ...item, categoryIndex })),
  );

  const pendingCount = orderedItems.filter((item) => statusOf[item.id] !== "graded").length;

  return (
    <div>
      <p className="mb-1 text-sm text-[var(--muted)]">
        <Link href="/s/courses" className="hover:underline">
          วิชาของฉัน
        </Link>{" "}
        <span className="mx-1">{">"}</span>
        {course.name}
      </p>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
            <Backpack className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-[var(--primary-dark)]">{course.name}</h1>
            <p className="text-sm text-[var(--muted)]">
              ภาคเรียนที่ {course.term}/{course.academic_year}
            </p>
          </div>
        </div>

        {leaderboard?.enabled && leaderboard.entries.length > 0 && (
          <a
            href="#leaderboard"
            className="flex items-center gap-2 rounded-[var(--radius)] border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100"
          >
            <Trophy className="h-4 w-4" />
            ดู Leaderboard
          </a>
        )}
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius)] bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <StudentAvatar name={student.name} title={student.title} size={48} />
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {formatStudentFullName(student.title, student.name)}
              </p>
              <p className="text-xs text-[var(--muted)]">เลขที่ {student.student_code}</p>
            </div>
          </div>

          <ScoreGauge total={total} size={96} ringColor={ringColor} />

          <div className="text-center">
            <p className="text-3xl font-bold text-[var(--primary)]">{grade?.grade_letter ?? "-"}</p>
            <p className="text-xs text-[var(--muted)]">{grade?.description || "ยังไม่มีเกณฑ์"}</p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap justify-center gap-3">
          {categories.map((category, index) => {
            const Icon = CATEGORY_ICONS[index % CATEGORY_ICONS.length];
            const color = categoryColor(index);
            const maxSum = category.grade_items.reduce((s, i) => s + i.max_score, 0);
            const scoreSum = category.grade_items.reduce((s, i) => s + (scoreOf[i.id] ?? 0), 0);
            const percent = maxSum > 0 ? Math.min(100, (scoreSum / maxSum) * 100) : 0;

            return (
              <div
                key={category.id}
                className={`w-[45%] rounded-[var(--radius)] border sm:w-40 ${color.ring} ${color.bg} p-3`}
              >
                <div className="mb-2 flex items-center gap-1.5">
                  <Icon className={`h-3.5 w-3.5 ${color.text}`} />
                  <p className="truncate text-xs font-medium text-[var(--muted)]">
                    {category.name}
                  </p>
                </div>
                <p className={`text-lg font-bold ${color.text}`}>
                  {maxSum > 0 ? scoreSum.toFixed(0) : "-"}
                  <span className="text-xs font-normal text-[var(--muted)]">/{maxSum}</span>
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white">
                  <div
                    className={`h-full rounded-full ${color.dot}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}

          <div className="w-[45%] rounded-[var(--radius)] border border-orange-200 bg-orange-50 p-3 sm:w-40">
            <div className="mb-2 flex items-center gap-1.5">
              <ClipboardList className="h-3.5 w-3.5 text-orange-600" />
              <p className="truncate text-xs font-medium text-[var(--muted)]">งานค้าง/ยังไม่ได้ส่ง</p>
            </div>
            <p className="text-lg font-bold text-orange-600">{pendingCount}</p>
            <p className="text-xs text-[var(--muted)]">ชิ้นงานที่ครูยังไม่ตรวจ</p>
          </div>

          <div className="w-[45%] rounded-[var(--radius)] border border-sky-200 bg-sky-50 p-3 sm:w-40">
            <div className="mb-2 flex items-center gap-1.5">
              <CalendarCheck className="h-3.5 w-3.5 text-sky-600" />
              <p className="truncate text-xs font-medium text-[var(--muted)]">การเข้าเรียน</p>
            </div>
            <p className="text-lg font-bold text-sky-600">
              {attendance.present}
              <span className="text-xs font-normal text-[var(--muted)]">
                /{attendance.present + attendance.absent + attendance.late + attendance.excused}
              </span>
            </p>
            <p className="text-xs text-[var(--muted)]">
              {attendanceStatusLabel.absent} {attendance.absent} · {attendanceStatusLabel.late}{" "}
              {attendance.late} · {attendanceStatusLabel.excused} {attendance.excused}
            </p>
          </div>

          {categories.length === 0 && (
            <p className="flex w-full items-center justify-center py-6 text-center text-sm text-[var(--muted)]">
              วิชานี้ยังไม่มีโครงสร้างคะแนน
            </p>
          )}
        </div>

        {orderedItems.length > 0 && (
          <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)]">
            <p className="border-b border-[var(--border)] bg-slate-50 px-4 py-2.5 text-sm font-semibold text-[var(--foreground)]">
              รายละเอียดคะแนน
            </p>
            {/* มือถือ: card-list — จอใหญ่ขึ้นไปใช้ตารางแทน */}
            <div className="divide-y divide-[var(--border)] sm:hidden">
              {orderedItems.map((item) => {
                const color = categoryColor(item.categoryIndex);
                const value = scoreOf[item.id] ?? null;
                const graded = statusOf[item.id] === "graded";

                return (
                  <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <p className="flex items-center gap-2">
                      <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${color.dot}`} />
                      {item.title}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`text-sm font-medium ${color.text}`}>
                        {value === null ? "-" : value}/{item.max_score}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          graded ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {graded ? "ตรวจแล้ว" : "รอตรวจ"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-2 font-medium">รายการ</th>
                    <th className="px-4 py-2 text-center font-medium">คะแนนที่ได้</th>
                    <th className="px-4 py-2 text-center font-medium">คะแนนเต็ม</th>
                    <th className="px-4 py-2 text-center font-medium">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {orderedItems.map((item) => {
                    const color = categoryColor(item.categoryIndex);
                    const value = scoreOf[item.id] ?? null;
                    const graded = statusOf[item.id] === "graded";

                    return (
                      <tr key={item.id}>
                        <td className="px-4 py-2.5">
                          <span className={`mr-2 inline-block h-2 w-2 rounded-full ${color.dot}`} />
                          {item.title}
                        </td>
                        <td className={`px-4 py-2.5 text-center font-medium ${color.text}`}>
                          {value === null ? "-" : value}
                        </td>
                        <td className="px-4 py-2.5 text-center text-[var(--muted)]">
                          {item.max_score}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              graded
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {graded ? "ตรวจแล้ว" : "รอตรวจ"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {lastUpdatedAt && (
          <p className="mt-4 text-center text-xs text-[var(--muted)]">
            ข้อมูลคะแนนอัปเดตล่าสุดเมื่อ{" "}
            {new Date(lastUpdatedAt).toLocaleString("th-TH", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        )}
      </div>

      {leaderboard?.enabled && leaderboard.entries.length > 0 && (
        <div id="leaderboard">
          <LeaderboardCard leaderboard={leaderboard} studentId={studentId} />
        </div>
      )}
    </div>
  );
}

function LeaderboardCard({
  leaderboard,
  studentId,
}: {
  leaderboard: LeaderboardData;
  studentId: string;
}) {
  const ownEntry = leaderboard.entries.find((e) => e.studentId === studentId);
  const unitSuffix = leaderboard.basis === "points" ? " แต้ม" : "%";

  if (leaderboard.visibility === "anonymous") {
    return (
      <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-5">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--primary-dark)]">
          <Trophy className="h-4 w-4 text-amber-500" />
          Leaderboard
        </p>
        {ownEntry ? (
          <p className="text-sm text-[var(--foreground)]">
            คุณอยู่อันดับ <span className="font-bold text-[var(--primary)]">{ownEntry.rank}</span> จาก{" "}
            {leaderboard.entries.length} คน ({ownEntry.score.toLocaleString("th-TH", { maximumFractionDigits: 2 })}
            {unitSuffix})
          </p>
        ) : (
          <p className="text-sm text-[var(--muted)]">ยังไม่มีข้อมูลจัดอันดับ</p>
        )}
      </div>
    );
  }

  const top = leaderboard.entries.slice(0, 5);
  const ownInTop = top.some((e) => e.studentId === studentId);
  const displayRows = ownInTop || !ownEntry ? top : [...top, ownEntry];

  return (
    <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-5">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--primary-dark)]">
        <Trophy className="h-4 w-4 text-amber-500" />
        Leaderboard
      </p>
      <div className="flex flex-col gap-2">
        {displayRows.map((entry) => {
          const isMe = entry.studentId === studentId;
          const label =
            leaderboard.visibility === "full_name"
              ? formatStudentFullName(entry.title, entry.name)
              : isMe
                ? "คุณ"
                : studentAlias(entry.studentId);

          return (
            <div
              key={entry.studentId}
              className={`flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 ${
                isMe ? "bg-[var(--primary)]/10" : "bg-slate-50"
              }`}
            >
              <span className="w-5 text-center text-sm font-bold text-[var(--muted)]">
                {entry.rank}
              </span>
              <span className="flex-1 text-sm font-medium text-[var(--foreground)]">{label}</span>
              <span className="text-sm font-semibold text-[var(--primary)]">
                {entry.score.toLocaleString("th-TH", { maximumFractionDigits: 2 })}
                {unitSuffix}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
