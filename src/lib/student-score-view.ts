import { createServiceClient } from "@/lib/supabase/service";
import { withScoreRanges } from "@/lib/grading-scale";
import { computeStudentTotal, findGrade } from "@/lib/score-calculation";
import type { AttendanceStatus } from "@/lib/attendance-status";

export type StudentCategoryView = {
  id: string;
  name: string;
  weight_percent: number;
  grade_items: { id: string; title: string; description: string; max_score: number }[];
};

export type StudentScoreView = {
  course: { id: string; name: string; code: string; term: string; academic_year: string };
  student: { id: string; name: string; title: string; student_code: string };
  categories: StudentCategoryView[];
  scoreOf: Record<string, number | null>;
  statusOf: Record<string, "pending" | "submitted" | "graded">;
  total: number;
  grade: ReturnType<typeof findGrade>;
  lastUpdatedAt: string | null;
};

// ดึงข้อมูลเบาๆ สำหรับหน้า login (ชื่อวิชา + ชื่อครูผู้สอน) ไม่ต้องดึงคะแนน
export async function getStudentLoginContext(
  courseId: string,
): Promise<{ courseName: string; courseCode: string; teacherName: string } | null> {
  const supabase = createServiceClient();

  const { data: course } = await supabase
    .from("courses")
    .select("name, code, owner_id")
    .eq("id", courseId)
    .maybeSingle();

  if (!course) return null;

  const { data: teacher } = await supabase
    .from("users")
    .select("name")
    .eq("id", course.owner_id)
    .maybeSingle();

  return { courseName: course.name, courseCode: course.code, teacherName: teacher?.name ?? "" };
}

// ดึงชื่อ/คำนำหน้าของนักเรียนที่ login อยู่ ใช้แสดงที่ topbar ของ shell — เบากว่า getStudentScoreView เพราะไม่ต้องรู้วิชา
export async function getStudentBasicInfo(
  studentId: string,
): Promise<{ name: string; title: string } | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("students")
    .select("name, title")
    .eq("id", studentId)
    .maybeSingle();

  return data ?? null;
}

// ดึงรายชื่อวิชาที่นักเรียนคนนี้ลงทะเบียนอยู่ทั้งหมด (ทุกครู) ใช้ที่หน้า /s/courses หลัง login แบบ global
export async function getStudentCourses(studentId: string): Promise<
  { id: string; name: string; code: string; term: string; academic_year: string }[]
> {
  const supabase = createServiceClient();

  type RosterRow = {
    course_id: string;
    courses: { id: string; name: string; code: string; term: string; academic_year: string } | null;
  };

  const { data } = await supabase
    .from("course_students")
    .select("course_id, courses(id, name, code, term, academic_year)")
    .eq("student_id", studentId)
    .returns<RosterRow[]>();

  return (data ?? [])
    .map((row) => row.courses)
    .filter((c): c is { id: string; name: string; code: string; term: string; academic_year: string } =>
      Boolean(c),
    );
}

// ดึงคะแนนของนักเรียนคนเดียวในวิชาเดียว ใช้ service client เพราะนักเรียนไม่มี Supabase Auth (ไม่มี auth.uid() ให้ RLS เช็ค)
// ต้อง scope เงื่อนไข query เองให้ครบ (studentId + courseId ที่ผ่านการยืนยัน session แล้วเท่านั้น)
export async function getStudentScoreView(
  courseId: string,
  studentId: string,
): Promise<StudentScoreView | null> {
  const supabase = createServiceClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id, name, code, term, academic_year")
    .eq("id", courseId)
    .single();

  if (!course) return null;

  const { data: enrollment } = await supabase
    .from("course_students")
    .select("student_id")
    .eq("course_id", courseId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (!enrollment) return null;

  const { data: student } = await supabase
    .from("students")
    .select("id, name, title, student_code")
    .eq("id", studentId)
    .single();

  if (!student) return null;

  const { data: categoriesRaw } = await supabase
    .from("score_categories")
    .select("id, name, weight_percent")
    .eq("course_id", courseId)
    .order("created_at", { ascending: true });

  const categoryIds = (categoriesRaw ?? []).map((c) => c.id);

  const { data: itemsRaw } =
    categoryIds.length > 0
      ? await supabase
          .from("grade_items")
          .select("id, title, description, max_score, category_id")
          .in("category_id", categoryIds)
          .order("created_at", { ascending: true })
      : { data: [] as { id: string; title: string; description: string; max_score: number; category_id: string }[] };

  const allItems = itemsRaw ?? [];

  const categories = (categoriesRaw ?? []).map((c) => ({
    ...c,
    grade_items: allItems.filter((i) => i.category_id === c.id),
  }));

  const itemIds = allItems.map((i) => i.id);
  const { data: scoresRaw } =
    itemIds.length > 0
      ? await supabase
          .from("student_scores")
          .select("grade_item_id, score, status, updated_at")
          .eq("student_id", studentId)
          .in("grade_item_id", itemIds)
      : {
          data: [] as {
            grade_item_id: string;
            score: number | null;
            status: "pending" | "submitted" | "graded";
            updated_at: string;
          }[],
        };

  const scoreOf: Record<string, number | null> = {};
  const statusOf: Record<string, "pending" | "submitted" | "graded"> = {};
  let lastUpdatedAt: string | null = null;
  for (const row of scoresRaw ?? []) {
    scoreOf[row.grade_item_id] = row.score;
    statusOf[row.grade_item_id] = row.status;
    if (!lastUpdatedAt || row.updated_at > lastUpdatedAt) lastUpdatedAt = row.updated_at;
  }

  const { data: scalesRaw } = await supabase
    .from("grading_scales")
    .select("id, grade_letter, min_score, description, gpa_value")
    .eq("course_id", courseId);

  const scales = withScoreRanges(scalesRaw ?? []);

  const total = computeStudentTotal(categories, (itemId) => scoreOf[itemId] ?? null);
  const grade = findGrade(scales, total);

  return { course, student, categories, scoreOf, statusOf, total, grade, lastUpdatedAt };
}

export type StudentAttendanceSummary = Record<AttendanceStatus, number>;

// นับจำนวนแต่ละสถานะการเช็คชื่อของนักเรียนคนเดียวในวิชาเดียว ใช้ service client ด้วยเหตุผลเดียวกับ getStudentScoreView (ไม่มี auth.uid())
export async function getStudentAttendanceSummary(
  courseId: string,
  studentId: string,
): Promise<StudentAttendanceSummary> {
  const supabase = createServiceClient();

  const summary: StudentAttendanceSummary = { present: 0, absent: 0, late: 0, excused: 0 };

  const { data: sessions } = await supabase
    .from("attendance_sessions")
    .select("id")
    .eq("course_id", courseId);

  const sessionIds = (sessions ?? []).map((s) => s.id);
  if (sessionIds.length === 0) return summary;

  const { data: records } = await supabase
    .from("attendance_records")
    .select("status")
    .eq("student_id", studentId)
    .in("session_id", sessionIds);

  for (const row of records ?? []) {
    summary[row.status as AttendanceStatus] += 1;
  }

  return summary;
}
