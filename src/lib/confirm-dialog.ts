"use client";

import Swal from "sweetalert2";

// popup ยืนยันกลางของระบบ ใช้ sweetalert2 แทน window.confirm() เดิมที่ดูหยาบ/ปรับแต่งไม่ได้
export async function confirmAction(
  message: string,
  options?: { title?: string; danger?: boolean; confirmText?: string },
): Promise<boolean> {
  const result = await Swal.fire({
    title: options?.title ?? "ยืนยันการดำเนินการ",
    text: message,
    icon: options?.danger ? "warning" : "question",
    showCancelButton: true,
    confirmButtonText: options?.confirmText ?? "ยืนยัน",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: options?.danger ? "#dc2626" : "#2563eb",
    cancelButtonColor: "#64748b",
    reverseButtons: true,
    buttonsStyling: true,
  });
  return result.isConfirmed;
}

// popup แจ้งผลสำเร็จ ใช้สไตล์เดียวกับ confirmAction (สีปุ่ม/ฟอนต์ของ sweetalert2 ชุดเดียวกัน)
// ตามที่ผู้ใช้ขอให้ "บันทึก/เพิ่ม/แก้ไข/ลบ" ทุกหน้าใช้ popup แบบเดียวกันกับตอนยืนยันลบ ไม่ใช่แค่แบนเนอร์ข้อความเฉยๆ
export async function notifySuccess(message: string, title = "สำเร็จ"): Promise<void> {
  await Swal.fire({
    title,
    text: message,
    icon: "success",
    confirmButtonText: "ตกลง",
    confirmButtonColor: "#2563eb",
    buttonsStyling: true,
  });
}

// popup แจ้งเตือนเฉยๆ (ไม่ต้องยืนยัน/ยกเลิก) ใช้กับเรื่องกำหนดส่งงาน — เกินกำหนดแล้ว (warning) หรือเวลาที่เหลือ (info)
export async function notifyInfo(
  message: string,
  title: string,
  icon: "info" | "warning" = "info",
): Promise<void> {
  await Swal.fire({
    title,
    text: message,
    icon,
    confirmButtonText: "ตกลง",
    confirmButtonColor: "#2563eb",
    buttonsStyling: true,
  });
}
