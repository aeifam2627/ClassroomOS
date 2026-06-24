"use client";

import { useRef, type FormEvent } from "react";
import { notifyInfo } from "@/lib/confirm-dialog";
import { formatCountdown } from "@/lib/due-date";

// ดักก่อนส่งงาน (submit) เพื่อโชว์ popup แจ้งเวลาที่เหลือ/เกินกำหนดแล้วหรือยัง ก่อนส่งจริง
// ใช้ ref bypass แบบเดียวกับ useConfirmSubmit เพราะ requestSubmit() มาก่อน re-render เสมอ
export function useDueDateSubmitNotice(dueAt: string | null) {
  const bypassRef = useRef(false);

  return (e: FormEvent<HTMLFormElement>) => {
    if (bypassRef.current) {
      bypassRef.current = false;
      return;
    }

    if (!dueAt) return; // ไม่มีกำหนดส่ง ไม่ต้องเตือนอะไร ส่งได้ตามปกติ

    e.preventDefault();
    const form = e.currentTarget;
    const overdue = new Date() > new Date(dueAt);
    const message = overdue ? "งานนี้เกินกำหนดส่งงานแล้ว ระบบจะบันทึกว่าส่งล่าช้า" : formatCountdown(dueAt);

    notifyInfo(message, overdue ? "เกินกำหนดส่งงาน" : "เวลาที่เหลือ", overdue ? "warning" : "info").then(
      () => {
        bypassRef.current = true;
        form.requestSubmit();
      },
    );
  };
}
