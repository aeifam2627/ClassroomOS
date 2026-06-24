// ระบบนี้มีผู้ใช้แค่ครู/นักเรียนไทย (ดู CLAUDE.md) จึงคิดเวลาเป็น Asia/Bangkok (+07:00) ตรงๆ
// ไม่ใช้ timezone library เพิ่ม dependency เพราะมีเขตเวลาเดียวให้รองรับ

// แปลงค่าจาก <input type="datetime-local"> (เช่น "2026-07-01T23:59" ไม่มี timezone) เป็น ISO string เก็บ DB
export function parseDueAtInput(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  return new Date(`${trimmed}:00+07:00`).toISOString();
}

// แปลง ISO string จาก DB กลับเป็นค่าที่ใส่ใน <input type="datetime-local"> ได้ (ต้องไม่มี timezone suffix)
export function toDueAtInputValue(iso: string | null): string {
  if (!iso) return "";
  const bangkokTime = new Date(new Date(iso).getTime() + 7 * 60 * 60 * 1000);
  return bangkokTime.toISOString().slice(0, 16);
}

// แสดงผลวันที่-เวลาแบบอ่านง่าย (เวลาไทยเสมอ ไม่ขึ้นกับ timezone ของเซิร์ฟเวอร์ที่รันโค้ด) ใช้ได้ทั้งวันกำหนดส่งและเวลาส่งงาน
export function formatThaiDateTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  });
}

// ข้อความนับถอยหลังเวลาที่เหลือก่อนถึงกำหนดส่ง ใช้ตอนนักเรียนกดส่งงาน (ก่อนเกินกำหนด)
export function formatCountdown(dueAtIso: string): string {
  const diffMinutes = Math.floor((new Date(dueAtIso).getTime() - Date.now()) / 60000);
  if (diffMinutes <= 0) return "เกินกำหนดส่งงานแล้ว";

  const days = Math.floor(diffMinutes / (60 * 24));
  const hours = Math.floor((diffMinutes % (60 * 24)) / 60);
  const minutes = diffMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} วัน`);
  if (days > 0 || hours > 0) parts.push(`${hours} ชั่วโมง`);
  parts.push(`${minutes} นาที`);

  return `เหลือเวลาส่งงานอีก ${parts.join(" ")} (กำหนดส่ง ${formatThaiDateTime(dueAtIso)})`;
}
