"use client";

import { useEffect, useRef } from "react";
import { notifySuccess } from "@/lib/confirm-dialog";

// Server Component หน้านั้นๆ ตัดสินใจว่าจะ render ตัวนี้หรือไม่จาก searchParams ของตัวเอง
// (เช่น มี ?notice=... ไหม) ตัว popup เองมีหน้าที่แค่เด้ง sweetalert2 ครั้งเดียวตอน mount
export function SuccessPopup({ message, title }: { message: string; title?: string }) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    notifySuccess(message, title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
