import { getScoreSheetData } from "@/lib/score-sheet-data";
import { computeStudentTotal, findGrade } from "@/lib/score-calculation";

export type StudentReportRow = {
  id: string;
  name: string;
  title: string;
  student_code: string;
  total: number;
  gradeLetter: string;
};

export type CourseReportData = {
  course: { id: string; name: string; code: string; term: string; academic_year: string };
  studentCount: number;
  average: number;
  highest: number;
  lowest: number;
  passThreshold: number | null;
  passRate: number | null;
  distribution: { gradeLetter: string; count: number }[];
  itemTrend: { index: number; title: string; avgPercent: number }[];
  ranked: StudentReportRow[];
};

// รวมข้อมูลรายงาน/สถิติของวิชาเดียว — ใช้ข้อมูลชุดเดียวกับหน้าบันทึกคะแนน (getScoreSheetData) มาคำนวณซ้ำ
// ไม่ต้อง query เพิ่ม เพราะ categories/items/students/scores/scales ครบอยู่แล้ว
export async function getCourseReportData(courseId: string): Promise<CourseReportData | null> {
  const data = await getScoreSheetData(courseId);
  if (!data) return null;

  const { course, allCategories, allItems, students, initialScores, scales } = data;

  function scoreOf(studentId: string, itemId: string): number | null {
    return initialScores[`${studentId}:${itemId}`] ?? null;
  }

  const rows: StudentReportRow[] = students.map((s) => {
    const total = computeStudentTotal(allCategories, (itemId) => scoreOf(s.id, itemId));
    const grade = findGrade(scales, total);
    return {
      id: s.id,
      name: s.name,
      title: s.title,
      student_code: s.student_code,
      total,
      gradeLetter: grade?.grade_letter ?? "-",
    };
  });

  const totals = rows.map((r) => r.total);
  const average = totals.length > 0 ? totals.reduce((a, b) => a + b, 0) / totals.length : 0;
  const highest = totals.length > 0 ? Math.max(...totals) : 0;
  const lowest = totals.length > 0 ? Math.min(...totals) : 0;

  // เกณฑ์ผ่าน = min_score ของระดับที่สูงกว่าระดับต่ำสุด (ระดับต่ำสุดถือเป็น "ไม่ผ่าน" ตามธรรมเนียม สพฐ. เช่น เกรด 0)
  const sortedAsc = [...scales].sort((a, b) => a.min_score - b.min_score);
  const passThreshold = sortedAsc.length >= 2 ? sortedAsc[1].min_score : sortedAsc[0]?.min_score ?? null;
  const passRate =
    passThreshold !== null && rows.length > 0
      ? (rows.filter((r) => r.total >= passThreshold).length / rows.length) * 100
      : null;

  const distribution = scales.map((scale) => ({
    gradeLetter: scale.grade_letter,
    count: rows.filter((r) => r.gradeLetter === scale.grade_letter).length,
  }));

  const itemTrend = allItems.map((item, index) => {
    const scored = students
      .map((s) => scoreOf(s.id, item.id))
      .filter((v): v is number => v !== null);
    const avgPercent =
      scored.length > 0 && item.max_score > 0
        ? (scored.reduce((a, b) => a + b, 0) / scored.length / item.max_score) * 100
        : 0;
    return { index: index + 1, title: item.title, avgPercent };
  });

  const ranked = [...rows].sort((a, b) => b.total - a.total);

  return {
    course,
    studentCount: students.length,
    average,
    highest,
    lowest,
    passThreshold,
    passRate,
    distribution,
    itemTrend,
    ranked,
  };
}
