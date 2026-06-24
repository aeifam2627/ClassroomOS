"use client";

import type { MouseEvent } from "react";
import { Paperclip, Trash2 } from "lucide-react";
import { useConfirmSubmit } from "@/lib/use-confirm-submit";
import { notifyInfo } from "@/lib/confirm-dialog";
import { deleteSubmission } from "@/app/teacher/(app)/courses/[id]/scores/actions";

// แสดงไอคอนไฟล์ที่นักเรียนส่งมา (คลิกเปิดดาวน์โหลด) + ปุ่มลบ ใช้ในเซลล์ของ ScoreGrid
export function SubmissionBadge({
  courseId,
  submissionId,
  fileName,
  late,
}: {
  courseId: string;
  submissionId: string;
  fileName: string;
  late: boolean;
}) {
  const onSubmit = useConfirmSubmit(`ลบไฟล์ที่ส่งมา "${fileName}"? นักเรียนจะต้องส่งใหม่`, {
    danger: true,
    title: "ยืนยันการลบ",
  });

  const downloadUrl = `/teacher/courses/${courseId}/scores/submissions/${submissionId}`;

  async function handleViewClick(e: MouseEvent<HTMLAnchorElement>) {
    if (!late) return; // ส่งตรงเวลา ไม่ต้องเตือนอะไร เปิดดาวน์โหลดได้ตามปกติ
    e.preventDefault();
    await notifyInfo("งานนี้เกินกำหนดส่งงานแล้ว", "เกินกำหนดส่ง", "warning");
    window.open(downloadUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <a
        href={downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={fileName}
        onClick={handleViewClick}
        className={`flex items-center rounded-full p-1 ${
          late ? "bg-red-100 text-red-700" : "bg-sky-100 text-sky-700"
        }`}
      >
        <Paperclip className="h-3 w-3" />
      </a>
      <form action={deleteSubmission} onSubmit={onSubmit}>
        <input type="hidden" name="courseId" value={courseId} />
        <input type="hidden" name="submissionId" value={submissionId} />
        <button type="submit" aria-label="ลบไฟล์ที่ส่ง" className="text-[var(--muted)] hover:text-red-500">
          <Trash2 className="h-3 w-3" />
        </button>
      </form>
    </div>
  );
}
