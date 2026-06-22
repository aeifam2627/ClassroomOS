export function formatStudentFullName(title: string | null | undefined, name: string): string {
  if (title && title !== "ไม่ระบุ") return `${title}${name}`;
  return name;
}
