"use client";

import { Copy } from "lucide-react";
import { useConfirmSubmit } from "@/lib/use-confirm-submit";
import { duplicateCourse } from "@/app/teacher/(app)/courses/actions";

export function DuplicateCourseButton({ courseId }: { courseId: string }) {
  const onSubmit = useConfirmSubmit("ทำสำเนาวิชานี้พร้อมโครงสร้างคะแนนทั้งหมด?", {
    title: "ยืนยันการทำสำเนาวิชา",
  });

  return (
    <form action={duplicateCourse} onSubmit={onSubmit}>
      <input type="hidden" name="courseId" value={courseId} />
      <button
        type="submit"
        aria-label="ทำสำเนาวิชา"
        className="text-[var(--muted)] hover:text-[var(--primary)]"
      >
        <Copy className="h-4 w-4" />
      </button>
    </form>
  );
}
