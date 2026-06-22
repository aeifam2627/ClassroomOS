// เกณฑ์สีตามที่ผู้ใช้กำหนด: เขียว 3-4, ส้ม 2-2.5, แดง 0-1.5 (ช่วงที่ไม่ระบุ ปัดเข้าขั้นที่ใกล้กว่า)
export function gradeBadgeClass(gpaValue: number | null): string {
  if (gpaValue === null) return "bg-slate-100 text-slate-600";
  if (gpaValue >= 3) return "bg-emerald-100 text-emerald-700";
  if (gpaValue >= 2) return "bg-orange-100 text-orange-700";
  return "bg-red-100 text-red-700";
}

// hex สีเดียวกันแต่ใช้กับ inline style (เช่น conic-gradient ของ ScoreGauge ที่ทำเป็น Tailwind class ไม่ได้)
export function gradeRingHex(gpaValue: number | null): string {
  if (gpaValue === null) return "#94a3b8";
  if (gpaValue >= 3) return "#10b981";
  if (gpaValue >= 2) return "#f97316";
  return "#ef4444";
}
