export type GradingScaleRow = {
  id: string;
  grade_letter: string;
  min_score: number;
  description: string;
  gpa_value: number | null;
};

export type GradingScaleWithRange = GradingScaleRow & { max_score: number };

// ช่วงคะแนนของแต่ละระดับคำนวณจาก min_score ของระดับที่สูงกว่าถัดไปเสมอ (ไม่เก็บ max_score ซ้ำในฐานข้อมูล)
export function withScoreRanges(scales: GradingScaleRow[]): GradingScaleWithRange[] {
  const sorted = [...scales].sort((a, b) => b.min_score - a.min_score);
  return sorted.map((scale, index) => ({
    ...scale,
    max_score: index === 0 ? 100 : sorted[index - 1].min_score - 0.01,
  }));
}
