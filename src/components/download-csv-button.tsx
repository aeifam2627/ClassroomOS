"use client";

import { Download } from "lucide-react";

type CsvRow = Record<string, string>;

// สร้างไฟล์ CSV ทั้งหมดที่ฝั่ง browser ไม่ต้องผ่าน server เพิ่ม เพราะข้อมูล (PIN ที่ reset ใหม่) อยู่ในมือ client อยู่แล้ว
// จากการ render หน้านี้ครั้งเดียว ไม่อยากส่ง PIN กลับไป-มาผ่าน network เพิ่มโดยไม่จำเป็น
function toCsv(headers: string[], rows: CsvRow[]): string {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h] ?? "")).join(","));
  }
  // ใส่ BOM กัน Excel เปิดภาษาไทยเพี้ยน (อ่าน utf-8 ผิดเป็น ANSI ถ้าไม่มี BOM)
  return "﻿" + lines.join("\r\n");
}

export function DownloadCsvButton({
  headers,
  rows,
  filename,
  label = "ดาวน์โหลด CSV",
}: {
  headers: string[];
  rows: CsvRow[];
  filename: string;
  label?: string;
}) {
  function handleDownload() {
    const csv = toCsv(headers, rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50"
    >
      <Download className="h-4 w-4" />
      {label}
    </button>
  );
}
