"use client";

import { UploadCloud } from "lucide-react";
import { useDueDateSubmitNotice } from "@/lib/use-due-date-submit";
import { ALLOWED_SUBMISSION_EXTENSIONS } from "@/lib/assignment-submission";
import { submitAssignment } from "@/app/s/[id]/items/[itemId]/actions";

// แยกเป็น Client Component เฉพาะส่วนฟอร์ม เพราะต้องดัก submit ด้วย useDueDateSubmitNotice
// (โชว์ popup เวลาที่เหลือ/เกินกำหนดก่อนส่งจริง) — ส่วนที่เหลือของหน้ายังเป็น Server Component ตามเดิม
export function SubmitAssignmentForm({
  courseId,
  itemId,
  dueAt,
  hasExistingSubmission,
}: {
  courseId: string;
  itemId: string;
  dueAt: string | null;
  hasExistingSubmission: boolean;
}) {
  const onSubmit = useDueDateSubmitNotice(dueAt);

  return (
    <form action={submitAssignment} onSubmit={onSubmit} className="flex flex-col gap-3">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="itemId" value={itemId} />
      <label className="flex flex-col gap-1 text-sm">
        {hasExistingSubmission ? "ส่งไฟล์ใหม่ (แทนที่ไฟล์เดิม)" : "เลือกไฟล์ที่จะส่ง"}
        <input
          type="file"
          name="file"
          required
          accept={ALLOWED_SUBMISSION_EXTENSIONS.join(",")}
          className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none file:mr-3 file:rounded-full file:border-0 file:bg-[var(--primary)]/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-[var(--primary)]"
        />
      </label>
      <p className="text-xs text-[var(--muted)]">
        รองรับไฟล์: {ALLOWED_SUBMISSION_EXTENSIONS.join(" ")} (ไม่เกิน 15MB)
      </p>
      <button
        type="submit"
        className="flex items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary)]/90"
      >
        <UploadCloud className="h-4 w-4" />
        {hasExistingSubmission ? "ส่งไฟล์ใหม่" : "ส่งงาน"}
      </button>
    </form>
  );
}
