import type { GradingScaleWithRange } from "./grading-scale";

export type CategoryWithItems = {
  id: string;
  name: string;
  weight_percent: number;
  grade_items: { id: string; max_score: number }[];
};

// คะแนนรวม 0-100 ของนักเรียนคนหนึ่ง = ผลรวมของ (สัดส่วนคะแนนที่ได้ในแต่ละหมวดหมู่ x น้ำหนักหมวดหมู่นั้น)
// หมวดหมู่ที่ยังไม่มีชิ้นงาน (maxSum = 0) ไม่นำมาคำนวณ ไม่ใช่ถือว่าได้ 0
export function computeStudentTotal(
  categories: CategoryWithItems[],
  scoreOf: (itemId: string) => number | null,
): number {
  return categories.reduce((total, category) => {
    const maxSum = category.grade_items.reduce((s, i) => s + i.max_score, 0);
    if (maxSum <= 0) return total;
    const scoreSum = category.grade_items.reduce((s, i) => s + (scoreOf(i.id) ?? 0), 0);
    return total + (scoreSum / maxSum) * category.weight_percent;
  }, 0);
}

// scales ต้องเรียงจาก min_score มากไปน้อยอยู่แล้ว (ผลลัพธ์ของ withScoreRanges)
export function findGrade(
  scales: GradingScaleWithRange[],
  total: number,
): GradingScaleWithRange | null {
  return scales.find((s) => total >= s.min_score) ?? null;
}
