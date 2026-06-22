"use client";

import { Printer } from "lucide-react";

// ใช้ browser print dialog (มี "บันทึกเป็น PDF" ในตัวอยู่แล้วทุก browser/OS) แทนการสร้างไฟล์ PDF เองฝั่ง server
// เพราะการสร้าง PDF เองต้อง embed font ไทยเอง (เสี่ยงเพี้ยน/ตัวอักษรหาย) ส่วน browser render
// ด้วยฟอนต์ที่มีอยู่แล้วในเครื่อง ได้ผลลัพธ์ภาษาไทยถูกต้อง 100% โดยไม่ต้องเพิ่ม dependency
export function PrintButton({ label = "ดาวน์โหลด PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50"
    >
      <Printer className="h-4 w-4" />
      {label}
    </button>
  );
}
