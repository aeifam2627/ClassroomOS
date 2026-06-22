import { createServiceClient } from "@/lib/supabase/service";
import { computeStudentTotal } from "@/lib/score-calculation";

export type LeaderboardScoreBasis = "grade" | "points";
export type LeaderboardVisibility = "anonymous" | "alias" | "full_name";

export type LeaderboardEntry = {
  studentId: string;
  name: string;
  title: string;
  studentCode: string;
  score: number;
  rank: number;
};

export type LeaderboardData = {
  enabled: boolean;
  basis: LeaderboardScoreBasis;
  visibility: LeaderboardVisibility;
  entries: LeaderboardEntry[];
};

// คนแสดงตัวเป็นชื่อสมมติแบบคงที่ — derive จาก student_id เอง ไม่ต้องเพิ่มคอลัมน์/ตารางใหม่
export function studentAlias(studentId: string): string {
  return `นักเรียน ${studentId.replace(/-/g, "").slice(0, 4).toUpperCase()}`;
}

// ใช้ service client (bypass RLS) เสมอ เพราะ leaderboard ต้องอ่านได้ทั้งจากฝั่งครู (มี auth.uid())
// และฝั่งนักเรียน (login ด้วยรหัส+PIN เอง ไม่มี Supabase Auth เลย ไม่มี auth.uid() ให้ RLS เช็ค)
// ของเดิมเคยใช้ client ปกติ (ผ่าน getCourseReportData) ทำให้ฝั่งนักเรียนอ่านไม่ได้อะไรเลยเพราะ RLS ปฏิเสธหมด
export async function getCourseLeaderboard(courseId: string): Promise<LeaderboardData | null> {
  const supabase = createServiceClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id, gamification_enabled, leaderboard_score_basis, leaderboard_visibility")
    .eq("id", courseId)
    .maybeSingle();

  if (!course) return null;

  const basis = course.leaderboard_score_basis as LeaderboardScoreBasis;
  const visibility = course.leaderboard_visibility as LeaderboardVisibility;

  type RosterRow = {
    student_id: string;
    students: { id: string; name: string; title: string; student_code: string } | null;
  };

  const { data: roster } = await supabase
    .from("course_students")
    .select("student_id, students(id, name, title, student_code)")
    .eq("course_id", courseId)
    .returns<RosterRow[]>();

  const rosterStudents = (roster ?? [])
    .map((row) => row.students)
    .filter((s): s is { id: string; name: string; title: string; student_code: string } => Boolean(s));

  let entries: LeaderboardEntry[];

  if (basis === "points") {
    const { data: events } = await supabase
      .from("point_events")
      .select("student_id, points")
      .eq("course_id", courseId);

    const pointsByStudent = new Map<string, number>();
    for (const e of events ?? []) {
      pointsByStudent.set(e.student_id, (pointsByStudent.get(e.student_id) ?? 0) + Number(e.points));
    }

    entries = rosterStudents
      .map((s) => ({
        studentId: s.id,
        name: s.name,
        title: s.title,
        studentCode: s.student_code,
        score: pointsByStudent.get(s.id) ?? 0,
        rank: 0,
      }))
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  } else {
    const { data: categoriesRaw } = await supabase
      .from("score_categories")
      .select("id, name, weight_percent")
      .eq("course_id", courseId);

    const categoryIds = (categoriesRaw ?? []).map((c) => c.id);

    const { data: itemsRaw } =
      categoryIds.length > 0
        ? await supabase
            .from("grade_items")
            .select("id, max_score, category_id")
            .in("category_id", categoryIds)
        : { data: [] as { id: string; max_score: number; category_id: string }[] };

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
            .select("grade_item_id, student_id, score")
            .in("grade_item_id", itemIds)
        : { data: [] as { grade_item_id: string; student_id: string; score: number | null }[] };

    const scoresByStudent = new Map<string, Record<string, number | null>>();
    for (const row of scoresRaw ?? []) {
      const scoreMap = scoresByStudent.get(row.student_id) ?? {};
      scoreMap[row.grade_item_id] = row.score;
      scoresByStudent.set(row.student_id, scoreMap);
    }

    entries = rosterStudents
      .map((s) => {
        const scoreMap = scoresByStudent.get(s.id) ?? {};
        const total = computeStudentTotal(categories, (itemId) => scoreMap[itemId] ?? null);
        return {
          studentId: s.id,
          name: s.name,
          title: s.title,
          studentCode: s.student_code,
          score: total,
          rank: 0,
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }

  return {
    enabled: course.gamification_enabled,
    basis,
    visibility,
    entries,
  };
}
