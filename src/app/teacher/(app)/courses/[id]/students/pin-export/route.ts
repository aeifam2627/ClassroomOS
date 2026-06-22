import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { formatStudentFullName } from "@/lib/student-name";

// รับข้อมูล PIN ที่ reset ใหม่ทั้งห้องผ่าน query param (ตัวเดียวกับที่ render บนหน้าอยู่แล้ว ไม่ query DB เพิ่ม
// เพราะ PIN ที่ reset แล้วไม่ได้เก็บ plaintext ไว้ใน DB ตามกฎ CLAUDE.md ข้อ 2 — ความเสี่ยงเท่ากับที่ผู้ใช้เห็นอยู่บนหน้าเว็บแล้ว)
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = await params;
  const { searchParams } = new URL(request.url);
  const data = searchParams.get("data");
  const courseCode = searchParams.get("code") ?? courseId;

  if (!data) {
    return NextResponse.json({ error: "ไม่พบข้อมูล PIN" }, { status: 400 });
  }

  let rows: { code: string; name: string; title: string; pin: string }[];
  try {
    rows = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));
  } catch {
    return NextResponse.json({ error: "ข้อมูล PIN ไม่ถูกต้อง" }, { status: 400 });
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("PIN");

  sheet.addRow(["รหัสนักเรียน", "ชื่อ-นามสกุล", "PIN"]);
  sheet.getRow(1).font = { bold: true };

  for (const row of rows) {
    sheet.addRow([row.code, formatStudentFullName(row.title, row.name), row.pin]);
  }

  sheet.getColumn(1).width = 16;
  sheet.getColumn(2).width = 28;
  sheet.getColumn(3).width = 14;

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `pin-${courseCode}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="pin.xlsx"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
