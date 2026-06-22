export type CourseStatus = "open" | "closed" | "upcoming";

export const courseStatusLabel: Record<CourseStatus, string> = {
  open: "เปิดสอน",
  closed: "ปิดเรียน",
  upcoming: "เตรียมเปิดสอน",
};

export const courseStatusBadgeClass: Record<CourseStatus, string> = {
  open: "bg-emerald-100 text-emerald-700",
  closed: "bg-slate-100 text-slate-600",
  upcoming: "bg-amber-100 text-amber-700",
};
