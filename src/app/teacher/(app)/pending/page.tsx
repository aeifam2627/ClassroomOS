import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StudentAvatar } from "@/components/student-avatar";
import { formatStudentFullName } from "@/lib/student-name";

export default async function PendingWorkPage() {
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
      .select("course_id, students(id, name, title, student_code)")
      .returns<{ course_id: string; students: { id: string; name: string; title: string; student_code: string } | null }[]>(),
    supabase.from("student_scores").select("grade_item_id, student_id").eq("status", "graded"),
  ]);

  const courseNameById = new Map((courses ?? []).map((c) => [c.id, c.name]));
  const courseIdByCategory = new Map((categories ?? []).map((c) => [c.id, c.course_id]));

  const studentsByCourse = new Map<string, { id: string; name: string; title: string; student_code: string }[]>();
  for (const row of rosterRows ?? []) {
    if (!row.students) continue;
    const list = studentsByCourse.get(row.course_id) ?? [];
    list.push(row.students);
    studentsByCourse.set(row.course_id, list);
  }

  const gradedStudentIdsByItem = new Map<string, Set<string>>();
  for (const row of gradedRows ?? []) {
    const set = gradedStudentIdsByItem.get(row.grade_item_id) ?? new Set<string>();
    set.add(row.student_id);
    gradedStudentIdsByItem.set(row.grade_item_id, set);
  }

  // เรียงเลขใบงานตามลำดับสร้างของแต่ละวิชา ใช้บอก "ใบงานที่เท่าไหร่" เพราะชื่อชิ้นงานเองไม่จำเป็นต้องมีเลขกำกับ
  const itemOrderByCourse = new Map<string, number>();

  type PendingItem = {
    itemId: string;
    title: string;
    description: string;
    courseId: string;
    categoryId: string;
    orderInCourse: number;
    pendingStudents: { id: string; name: string; title: string; student_code: string }[];
  };

  const pendingItems: PendingItem[] = [];
  for (const item of gradeItems ?? []) {
    const courseId = courseIdByCategory.get(item.category_id);
    if (!courseId) continue;

    const orderInCourse = (itemOrderByCourse.get(courseId) ?? 0) + 1;
    itemOrderByCourse.set(courseId, orderInCourse);

    const enrolledStudents = studentsByCourse.get(courseId) ?? [];
    const gradedIds = gradedStudentIdsByItem.get(item.id) ?? new Set<string>();
    const pendingStudents = enrolledStudents.filter((s) => !gradedIds.has(s.id));

    if (pendingStudents.length > 0) {
      pendingItems.push({
        itemId: item.id,
        title: item.title,
        description: item.description,
        courseId,
        categoryId: item.category_id,
        orderInCourse,
        pendingStudents,
      });
    }
  }

  const itemsByCourse = new Map<string, PendingItem[]>();
  for (const item of pendingItems) {
    const list = itemsByCourse.get(item.courseId) ?? [];
    list.push(item);
    itemsByCourse.set(item.courseId, list);
  }

  const courseGroups = Array.from(itemsByCourse.entries())
    .map(([courseId, items]) => ({
      courseId,
      courseName: courseNameById.get(courseId) ?? "ไม่พบชื่อวิชา",
      items: items.sort((a, b) => b.pendingStudents.length - a.pendingStudents.length),
      totalPending: items.reduce((sum, i) => sum + i.pendingStudents.length, 0),
    }))
    .sort((a, b) => b.totalPending - a.totalPending);

  return (
    <div>
      <p className="mb-1 text-sm text-[var(--muted)]">
        <Link href="/teacher/dashboard" className="hover:underline">
          หน้าหลัก
        </Link>{" "}
        <span className="mx-1">{">"}</span>
        งานที่ต้องตรวจ
      </p>

      <h1 className="mb-1 text-2xl font-bold text-[var(--primary-dark)]">งานที่ต้องตรวจ</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        ชิ้นงานที่ยังมีนักเรียนไม่ได้กรอกคะแนนครบทุกคน เรียงตามวิชาที่ค้างมากที่สุดก่อน
      </p>

      {courseGroups.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-10 text-center text-[var(--muted)]">
          ตรวจคะแนนครบทุกชิ้นงานแล้ว 🎉
        </div>
      ) : (
        <div className="space-y-4">
          {courseGroups.map((group) => (
            <div key={group.courseId} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
              <div className="flex items-center justify-between border-b border-[var(--border)] bg-slate-50 px-5 py-3">
                <p className="font-semibold text-[var(--primary-dark)]">{group.courseName}</p>
                <span className="text-xs text-[var(--muted)]">ค้างรวม {group.totalPending} รายการ</span>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {group.items.map((item) => (
                  <div key={item.itemId} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[var(--foreground)]">
                          ใบงานที่ {item.orderInCourse} - {item.description || item.title}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          เหลืออีก {item.pendingStudents.length} คนที่ยังไม่มีคะแนน
                        </p>
                      </div>
                      <Link
                        href={`/teacher/courses/${group.courseId}/scores?category=${item.categoryId}`}
                        className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary)]/90"
                      >
                        <ClipboardList className="h-4 w-4" />
                        ตรวจคะแนน
                      </Link>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.pendingStudents.map((student) => (
                        <span
                          key={student.id}
                          className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800"
                        >
                          <StudentAvatar name={student.name} title={student.title} size={16} />
                          {formatStudentFullName(student.title, student.name)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
