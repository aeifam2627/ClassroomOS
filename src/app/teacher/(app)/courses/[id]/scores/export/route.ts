import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getScoreSheetData } from "@/lib/score-sheet-data";
import { computeStudentTotal, findGrade } from "@/lib/score-calculation";
import { formatStudentFullName } from "@/lib/student-name";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = await params;

  const data = await getScoreSheetData(courseId);
  if (!data) return NextResponse.json({ error: "ไม่พบวิชานี้" }, { status: 404 });

  const { course, allCategories, allItems, students, initialScores, scales } = data;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("คะแนน");

  const headerRow = [
    "รหัสนักเรียน",
    "ชื่อ-นามสกุล",
    ...allItems.map((i) => `${i.title} (${i.max_score})`),
    "คะแนนรวม",
    "เกรด",
  ];
  sheet.addRow(headerRow);
  sheet.getRow(1).font = { bold: true };

  for (const student of students) {
    const total = computeStudentTotal(
      allCategories,
      (itemId) => initialScores[`${student.id}:${itemId}`] ?? null,
    );
    const grade = findGrade(scales, total);

    sheet.addRow([
      student.student_code,
      formatStudentFullName(student.title, student.name),
      ...allItems.map((i) => initialScores[`${student.id}:${i.id}`] ?? ""),
      Number(total.toFixed(2)),
      grade?.grade_letter ?? "-",
    ]);
  }

  sheet.columns.forEach((column) => {
    column.width = 16;
  });
  sheet.getColumn(2).width = 28;

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `คะแนน-${course.name}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="scores.xlsx"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
