export const STUDENT_TITLES = ["ไม่ระบุ", "เด็กชาย", "เด็กหญิง", "นาย", "นาง", "นางสาว"] as const;

export type StudentTitle = (typeof STUDENT_TITLES)[number];

export function isStudentTitle(value: string): value is StudentTitle {
  return (STUDENT_TITLES as readonly string[]).includes(value);
}
