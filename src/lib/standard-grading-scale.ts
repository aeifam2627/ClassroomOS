// เกณฑ์มาตรฐาน สพฐ. — ระบบตัวเลข 8 ระดับ (0-4) ตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน
// อ้างอิงช่วงคะแนนที่ผู้ใช้ยืนยัน: 4=80-100, 3.5=75-79, 3=70-74, 2.5=65-69,
// 2=60-64, 1.5=55-59, 1=50-54, 0=0-49
export const STANDARD_GRADING_SCALE = [
  { gradeLetter: "4", minScore: 80, description: "ดีเยี่ยม", gpaValue: 4 },
  { gradeLetter: "3.5", minScore: 75, description: "ดีมาก", gpaValue: 3.5 },
  { gradeLetter: "3", minScore: 70, description: "ดี", gpaValue: 3 },
  { gradeLetter: "2.5", minScore: 65, description: "ค่อนข้างดี", gpaValue: 2.5 },
  { gradeLetter: "2", minScore: 60, description: "ปานกลาง", gpaValue: 2 },
  { gradeLetter: "1.5", minScore: 55, description: "พอใช้", gpaValue: 1.5 },
  { gradeLetter: "1", minScore: 50, description: "ผ่านเกณฑ์ขั้นต่ำ", gpaValue: 1 },
  { gradeLetter: "0", minScore: 0, description: "ต่ำกว่าเกณฑ์", gpaValue: 0 },
] as const;
