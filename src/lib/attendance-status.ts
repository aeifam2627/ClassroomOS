export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export const attendanceStatusLabel: Record<AttendanceStatus, string> = {
  present: "มา",
  absent: "ขาด",
  late: "สาย",
  excused: "ลา",
};

export const attendanceStatusBadgeClass: Record<AttendanceStatus, string> = {
  present: "bg-emerald-50 text-emerald-700",
  absent: "bg-red-50 text-red-700",
  late: "bg-amber-50 text-amber-700",
  excused: "bg-slate-100 text-slate-700",
};

// ใช้คู่กับ <input class="peer sr-only"> ที่อยู่ "ก่อน" span ที่ใส่คลาสนี้ (sibling เดียวกัน)
// ให้คลิกเปลี่ยนสถานะแล้วเห็นผลทันทีด้วย CSS ล้วนๆ ไม่ต้องพึ่ง client state
// (ของเดิมคำนวณสีจาก currentStatus ที่ render ฝั่ง server ครั้งเดียว คลิกแล้วไม่อัปเดตเพราะไม่มี JS ฟัง onChange)
export const attendanceStatusPeerCheckedClass: Record<AttendanceStatus, string> = {
  present: "peer-checked:bg-emerald-100 peer-checked:text-emerald-700",
  absent: "peer-checked:bg-red-100 peer-checked:text-red-700",
  late: "peer-checked:bg-amber-100 peer-checked:text-amber-700",
  excused: "peer-checked:bg-slate-200 peer-checked:text-slate-700",
};

export const attendanceStatusOptions: AttendanceStatus[] = ["present", "absent", "late", "excused"];
