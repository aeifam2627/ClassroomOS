import ExcelJS from "exceljs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { upsertAndEnrollStudent } from "@/lib/student-enrollment";
import { isStudentTitle } from "@/lib/student-title";

const CODE_KEYS = ["รหัสนักเรียน", "รหัส", "code", "student_code"];
const NAME_KEYS = ["ชื่อ-นามสกุล", "ชื่อ", "name"];
const TITLE_KEYS = ["คำนำหน้า", "title"];

function pick(record: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (value && value.trim() !== "") return value.trim();
  }
  return "";
}

function normalizeTitle(value: string): string {
  return isStudentTitle(value) ? value : "ไม่ระบุ";
}

export async function parseSpreadsheet(file: File): Promise<Record<string, string>[]> {
  const buffer = Buffer.from(await file.arrayBuffer());

  if (file.name.toLowerCase().endsWith(".csv")) {
    const text = buffer.toString("utf-8");
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
    if (lines.length === 0) return [];
    const headers = lines[0].split(",").map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const cells = line.split(",");
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        record[header] = (cells[index] ?? "").trim();
      });
      return record;
    });
  }

  const workbook = new ExcelJS.Workbook();
  // ExcelJS bundles its own (เก่ากว่า) Buffer type ที่ generic ไม่ตรงกับ @types/node เวอร์ชันปัจจุบัน
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await workbook.xlsx.load(buffer as any);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const headerMap: Record<number, string> = {};
  const rows: Record<string, string>[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.eachCell((cell, colNumber) => {
        headerMap[colNumber] = String(cell.value ?? "").trim();
      });
      return;
    }

    const record: Record<string, string> = {};
    row.eachCell((cell, colNumber) => {
      const key = headerMap[colNumber];
      if (key) record[key] = String(cell.value ?? "").trim();
    });
    rows.push(record);
  });

  return rows;
}

export async function importStudentsFromFile(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  ownerId: string,
  courseId: string,
  file: File,
): Promise<{
  enrolledCount: number;
  created: { code: string; name: string; title: string; pin: string }[];
}> {
  const rows = await parseSpreadsheet(file);
  const created: { code: string; name: string; title: string; pin: string }[] = [];
  let enrolledCount = 0;

  for (const row of rows) {
    const code = pick(row, CODE_KEYS);
    const name = pick(row, NAME_KEYS);
    const title = normalizeTitle(pick(row, TITLE_KEYS));
    if (!code || !name) continue;

    const result = await upsertAndEnrollStudent(supabase, ownerId, courseId, code, name, title);
    enrolledCount += 1;
    if (result.created && result.pin) {
      created.push({ code, name, title, pin: result.pin });
    }
  }

  return { enrolledCount, created };
}
