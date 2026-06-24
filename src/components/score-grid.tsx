"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Info, Loader2 } from "lucide-react";
import { StudentAvatar } from "@/components/student-avatar";
import { SubmissionBadge } from "@/components/submission-badge";
import { formatStudentFullName } from "@/lib/student-name";
import { gradeBadgeClass } from "@/lib/grade-color";
import { computeStudentTotal, findGrade, type CategoryWithItems } from "@/lib/score-calculation";
import type { GradingScaleWithRange } from "@/lib/grading-scale";
import { isLateSubmission } from "@/lib/assignment-submission";
import { saveScore } from "@/app/teacher/(app)/courses/[id]/scores/actions";

type ItemColumn = {
  id: string;
  title: string;
  description?: string;
  max_score: number;
  chapter_id?: string | null;
  due_at?: string | null;
};
type StudentRow = { id: string; student_code: string; name: string; title: string };
type ChapterGroup = { id: string; name: string; items: ItemColumn[] };
type SubmissionInfo = { id: string; fileName: string; submittedAt: string };

// จัดกลุ่มคอลัมน์ใบงานตามบท (ถ้ามีตั้งไว้) เพื่อทำหัวตาราง 2 ชั้น: บท > ใบงาน
// ใบงานที่ไม่ได้ระบุบทถูกรวมไว้กลุ่ม "ไม่ระบุบท" ต่อท้าย — ถ้ามีแค่ 1 กลุ่มรวม ให้ถือว่าไม่ได้ใช้ฟีเจอร์บท
// แสดงหัวคอลัมน์แบบเดิม (สแปนเดียว "คะแนนแต่ละรายการ") ไม่ต้องโชว์ชื่อกลุ่ม
function groupItemsByChapter(
  items: ItemColumn[],
  chapters: { id: string; name: string }[],
): ChapterGroup[] {
  const byChapter = new Map<string, ItemColumn[]>();
  const unassigned: ItemColumn[] = [];

  for (const item of items) {
    if (item.chapter_id) {
      const list = byChapter.get(item.chapter_id) ?? [];
      list.push(item);
      byChapter.set(item.chapter_id, list);
    } else {
      unassigned.push(item);
    }
  }

  const groups = chapters
    .map((c) => ({ id: c.id, name: c.name, items: byChapter.get(c.id) ?? [] }))
    .filter((g) => g.items.length > 0);

  if (unassigned.length > 0) {
    groups.push({ id: "unassigned", name: "ไม่ระบุบท", items: unassigned });
  }

  return groups;
}

export function ScoreGrid({
  visibleItems,
  allCategories,
  students,
  initialScores,
  scales,
  chapters,
  submissions,
  courseId,
}: {
  visibleItems: ItemColumn[];
  allCategories: CategoryWithItems[];
  students: StudentRow[];
  initialScores: Record<string, number | null>;
  scales: GradingScaleWithRange[];
  chapters: { id: string; name: string }[];
  submissions: Record<string, SubmissionInfo>;
  courseId: string;
}) {
  const [scores, setScores] = useState(initialScores);
  const [saveState, setSaveState] = useState<{
    state: "idle" | "saving" | "saved" | "error";
    time: string | null;
  }>({ state: "idle", time: null });
  const [, startTransition] = useTransition();

  const chapterGroups = groupItemsByChapter(visibleItems, chapters);
  const showChapterHeaders = chapterGroups.length > 1;
  const orderedItems = showChapterHeaders ? chapterGroups.flatMap((g) => g.items) : visibleItems;

  function scoreOf(studentId: string, itemId: string): number | null {
    return scores[`${studentId}:${itemId}`] ?? null;
  }

  function handleCommit(studentId: string, itemId: string, raw: string, maxScore: number) {
    const trimmed = raw.trim();
    const next = trimmed === "" ? null : Number(trimmed);

    if (next !== null && (Number.isNaN(next) || next < 0 || next > maxScore)) {
      setSaveState({ state: "error", time: null });
      return;
    }

    const key = `${studentId}:${itemId}`;
    setScores((prev) => ({ ...prev, [key]: next }));
    setSaveState({ state: "saving", time: null });

    startTransition(async () => {
      try {
        await saveScore({ gradeItemId: itemId, studentId, score: next });
        setSaveState({ state: "saved", time: new Date().toLocaleTimeString("th-TH") });
      } catch {
        setSaveState({ state: "error", time: null });
      }
    });
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-end text-xs">
        {saveState.state === "saving" && (
          <span className="flex items-center gap-1 text-[var(--muted)]">
            <Loader2 className="h-3 w-3 animate-spin" />
            กำลังบันทึก...
          </span>
        )}
        {saveState.state === "saved" && (
          <span className="flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="h-3 w-3" />
            บันทึกอัตโนมัติแล้ว {saveState.time}
          </span>
        )}
        {saveState.state === "error" && (
          <span className="text-red-500">บันทึกไม่สำเร็จ ตรวจคะแนนให้อยู่ในช่วง 0-คะแนนเต็ม</span>
        )}
      </div>

      {/* มือถือ: การ์ดต่อนักเรียน 1 ใบ ใส่คะแนนทีละชิ้นงานในการ์ดเดียว — จอใหญ่ขึ้นไปใช้ตารางสเปรดชีตแทน */}
      <div className="space-y-3 sm:hidden">
        {students.map((student) => {
          const total = computeStudentTotal(allCategories, (itemId) => scoreOf(student.id, itemId));
          const grade = findGrade(scales, total);

          return (
            <div key={student.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <StudentAvatar name={student.name} title={student.title} />
                  <p className="font-medium text-[var(--foreground)]">
                    {formatStudentFullName(student.title, student.name)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--foreground)]">{total.toFixed(2)}</span>
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${gradeBadgeClass(grade?.gpa_value ?? null)}`}
                  >
                    {grade?.grade_letter ?? "-"}
                  </span>
                </div>
              </div>

              <div className="divide-y divide-[var(--border)] rounded-[var(--radius)] border border-[var(--border)]">
                {orderedItems.map((item) => {
                  const value = scoreOf(student.id, item.id);
                  const low = value !== null && value < item.max_score / 2;
                  const submission = submissions[`${student.id}:${item.id}`];
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-3 px-3 py-2">
                      <span className="text-sm text-[var(--muted)]">
                        {item.title} <span className="text-xs">({item.max_score})</span>
                      </span>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {submission && (
                          <SubmissionBadge
                            courseId={courseId}
                            submissionId={submission.id}
                            fileName={submission.fileName}
                            late={isLateSubmission(submission.submittedAt, item.due_at ?? null)}
                          />
                        )}
                        <input
                          type="number"
                          min={0}
                          max={item.max_score}
                          step={0.01}
                          defaultValue={value ?? ""}
                          onBlur={(e) =>
                            handleCommit(student.id, item.id, e.target.value, item.max_score)
                          }
                          className={`w-16 shrink-0 rounded border px-2 py-1 text-center text-sm outline-none focus:border-[var(--primary)] ${
                            low ? "border-red-200 bg-red-50" : "border-[var(--border)]"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}

                {orderedItems.length === 0 && (
                  <p className="px-3 py-4 text-center text-xs text-[var(--muted)]">ยังไม่มีชิ้นงาน</p>
                )}
              </div>
            </div>
          );
        })}

        {students.length === 0 && (
          <p className="rounded-2xl border border-dashed border-[var(--border)] bg-white py-10 text-center text-sm text-[var(--muted)]">
            ยังไม่มีนักเรียนในวิชานี้
          </p>
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-[var(--border)] bg-white sm:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[var(--muted)]">
            <tr>
              <th rowSpan={2} className="px-3 py-2 font-medium">
                #
              </th>
              <th rowSpan={2} className="px-3 py-2 font-medium">
                ชื่อ-นามสกุล
              </th>
              {visibleItems.length > 0 &&
                (showChapterHeaders ? (
                  chapterGroups.map((group) => (
                    <th
                      key={group.id}
                      colSpan={group.items.length}
                      className="border-l border-[var(--border)] px-3 py-2 text-center font-medium"
                    >
                      {group.name}
                    </th>
                  ))
                ) : (
                  <th
                    colSpan={visibleItems.length}
                    className="border-l border-[var(--border)] px-3 py-2 text-center font-medium"
                  >
                    คะแนนแต่ละรายการ
                  </th>
                ))}
              <th
                colSpan={2}
                className="border-l border-[var(--border)] px-3 py-2 text-center font-medium"
              >
                คะแนนรวม
              </th>
            </tr>
            <tr>
              {orderedItems.map((item) => (
                <th
                  key={item.id}
                  className="border-l border-[var(--border)] px-3 py-2 text-center font-medium"
                >
                  <span className="group relative inline-flex items-center justify-center gap-1">
                    {item.title} ({item.max_score})
                    {item.description && (
                      <>
                        <Info className="h-3 w-3 shrink-0 text-[var(--muted)]" />
                        <span className="invisible absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 rounded-[var(--radius)] bg-[var(--primary-dark)] px-3 py-2 text-left text-xs font-normal normal-case text-white opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100">
                          {item.description}
                        </span>
                      </>
                    )}
                  </span>
                </th>
              ))}
              <th className="border-l border-[var(--border)] px-3 py-2 text-center font-medium">
                คะแนนรวม (100)
              </th>
              <th className="px-3 py-2 text-center font-medium">เกรด</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {students.map((student, index) => {
              const total = computeStudentTotal(allCategories, (itemId) =>
                scoreOf(student.id, itemId),
              );
              const grade = findGrade(scales, total);

              return (
                <tr key={student.id}>
                  <td className="px-3 py-2 text-[var(--muted)]">{index + 1}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <StudentAvatar name={student.name} title={student.title} />
                      {formatStudentFullName(student.title, student.name)}
                    </div>
                  </td>
                  {orderedItems.map((item) => {
                    const value = scoreOf(student.id, item.id);
                    const low = value !== null && value < item.max_score / 2;
                    const submission = submissions[`${student.id}:${item.id}`];
                    return (
                      <td
                        key={item.id}
                        className="border-l border-[var(--border)] p-1 text-center"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min={0}
                            max={item.max_score}
                            step={0.01}
                            defaultValue={value ?? ""}
                            onBlur={(e) =>
                              handleCommit(student.id, item.id, e.target.value, item.max_score)
                            }
                            className={`w-16 rounded border px-2 py-1 text-center text-sm outline-none focus:border-[var(--primary)] ${
                              low ? "border-red-200 bg-red-50" : "border-transparent"
                            }`}
                          />
                          {submission && (
                            <SubmissionBadge
                              courseId={courseId}
                              submissionId={submission.id}
                              fileName={submission.fileName}
                              late={isLateSubmission(submission.submittedAt, item.due_at ?? null)}
                            />
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="border-l border-[var(--border)] px-3 py-2 text-center font-semibold text-[var(--foreground)]">
                    {total.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${gradeBadgeClass(grade?.gpa_value ?? null)}`}
                    >
                      {grade?.grade_letter ?? "-"}
                    </span>
                  </td>
                </tr>
              );
            })}

            {students.length === 0 && (
              <tr>
                <td colSpan={visibleItems.length + 4} className="px-4 py-10 text-center text-[var(--muted)]">
                  ยังไม่มีนักเรียนในวิชานี้
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-[var(--muted)]">
        คลิกที่คะแนนเพื่อแก้ไข ระบบจะบันทึกอัตโนมัติเมื่อออกจากช่อง (เว้นว่างเพื่อลบคะแนน)
      </p>
    </div>
  );
}
