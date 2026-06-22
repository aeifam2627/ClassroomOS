"use client";

import { useRef, type FormEvent } from "react";
import { confirmAction } from "@/lib/confirm-dialog";

// ดัก submit ของ <form action={serverAction}> ให้เด้ง popup ยืนยันก่อนเสมอ
// ใช้ ref (ไม่ใช่ state) เป็น flag เพราะต้อง bypass การดักจับใน submit รอบถัดไปแบบ sync ทันที
// ไม่รอ re-render — ถ้าใช้ state จังหวะ requestSubmit() จะมาเร็วกว่า re-render แล้วเข้า preventDefault วนซ้ำไม่จบ
export function useConfirmSubmit(
  message: string,
  options?: { title?: string; danger?: boolean; onConfirmed?: () => void },
) {
  const bypassRef = useRef(false);

  return (e: FormEvent<HTMLFormElement>) => {
    if (bypassRef.current) {
      bypassRef.current = false;
      return;
    }

    e.preventDefault();
    const form = e.currentTarget;

    confirmAction(message, options).then((confirmed) => {
      if (confirmed) {
        options?.onConfirmed?.();
        bypassRef.current = true;
        form.requestSubmit();
      }
    });
  };
}
