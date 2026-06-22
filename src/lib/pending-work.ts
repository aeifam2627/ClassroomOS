import { createClient } from "@/lib/supabase/server";

export type PendingWorkItem = {
  itemId: string;
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  categoryId: string;
  orderInCourse: number;
  pendingCount: number;
};

export type PendingWorkSummary = {
  items: PendingWorkItem[];
  totalPending: number;
};

// ใช้ร่วมกันระหว่างหน้า /teacher/pending (รายละเอียดเต็ม) และกระดิ่งแจ้งเตือนใน TeacherTopbar (สรุปย่อ)
// "ค้างตรวจ" = ชิ้นงานที่นักเรียนในวิชายังมีคนที่สถานะไม่ใช่ graded อยู่ (ดู logic เดียวกับ dashboard)
export async function getPendingWorkSummary(): Promise<PendingWorkSummary> {
  const supabase = await createClient();

  const [
    { data: courses },
    { data: categories },
    { data: gradeItems },
    { data: rosterRows },
    { data: gradedRows },
  ] = await Promise.all([
    supabase.from("courses").select("id, name"),
    supabase.from("score_categories").select("id, course_id"),
    supabase
      .from("grade_items")
      .select("id, title, description, category_id, created_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("course_students")
      .select("course_id, students(id)")
      .returns<{ course_id: string; students: { id: string } | null }[]>(),
    supabase.from("student_scores").select("grade_item_id, student_id").eq("status", "graded"),
  ]);

  const courseNameById = new Map((courses ?? []).map((c) => [c.id, c.name]));
  const courseIdByCategory = new Map((categories ?? []).map((c) => [c.id, c.course_id]));

  const studentIdsByCourse = new Map<string, Set<string>>();
  for (const row of rosterRows ?? []) {
    if (!row.students) continue;
    const set = studentIdsByCourse.get(row.course_id) ?? new Set<string>();
    set.add(row.students.id);
    studentIdsByCourse.set(row.course_id, set);
  }

  const gradedStudentIdsByItem = new Map<string, Set<string>>();
  for (const row of gradedRows ?? []) {
    const set = gradedStudentIdsByItem.get(row.grade_item_id) ?? new Set<string>();
    set.add(row.student_id);
    gradedStudentIdsByItem.set(row.grade_item_id, set);
  }

  const itemOrderByCourse = new Map<string, number>();
  const items: PendingWorkItem[] = [];

  for (const item of gradeItems ?? []) {
    const courseId = courseIdByCategory.get(item.category_id);
    if (!courseId) continue;

    const orderInCourse = (itemOrderByCourse.get(courseId) ?? 0) + 1;
    itemOrderByCourse.set(courseId, orderInCourse);

    const enrolledStudentIds = studentIdsByCourse.get(courseId) ?? new Set<string>();
    const gradedIds = gradedStudentIdsByItem.get(item.id) ?? new Set<string>();
    const pendingCount = [...enrolledStudentIds].filter((id) => !gradedIds.has(id)).length;

    if (pendingCount > 0) {
      items.push({
        itemId: item.id,
        title: item.title,
        description: item.description,
        courseId,
        courseName: courseNameById.get(courseId) ?? "ไม่พบชื่อวิชา",
        categoryId: item.category_id,
        orderInCourse,
        pendingCount,
      });
    }
  }

  items.sort((a, b) => b.pendingCount - a.pendingCount);

  return {
    items,
    totalPending: items.reduce((sum, i) => sum + i.pendingCount, 0),
  };
}
