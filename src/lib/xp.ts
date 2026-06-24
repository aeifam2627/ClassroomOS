import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/service";

// กฎ XP ที่ตกลงไว้: พฤติกรรมส่งงานเป็นหลัก (ตรงเวลา/สาย/streak) + คะแนนจริงเป็นตัวเสริม
const BEHAVIOR_ON_TIME_XP = 10;
const BEHAVIOR_LATE_XP = 4;
const SCORE_BONUS_MAX_XP = 5;
const STREAK_LENGTH = 3;
const STREAK_BONUS_XP = 10;

// เลเวล: XP สะสมที่ต้องใช้ขึ้นเลเวล L คือ 50 × L × (L+1) / 2 (เลเวล 1→50, 2→150, 3→300, 4→500 ...)
function cumulativeXpForLevel(level: number): number {
  return 50 * level * (level + 1) / 2;
}

export type LevelInfo = {
  level: number;
  totalXp: number;
  currentLevelThreshold: number;
  nextLevelThreshold: number;
  xpIntoLevel: number;
  xpNeededForLevel: number;
  progressPercent: number;
};

export function computeLevel(totalXp: number): LevelInfo {
  let level = 1;
  while (cumulativeXpForLevel(level) <= totalXp && level < 1000) level++;

  const currentLevelThreshold = level === 1 ? 0 : cumulativeXpForLevel(level - 1);
  const nextLevelThreshold = cumulativeXpForLevel(level);
  const xpIntoLevel = totalXp - currentLevelThreshold;
  const xpNeededForLevel = nextLevelThreshold - currentLevelThreshold;

  return {
    level,
    totalXp,
    currentLevelThreshold,
    nextLevelThreshold,
    xpIntoLevel,
    xpNeededForLevel,
    progressPercent: Math.min(100, (xpIntoLevel / xpNeededForLevel) * 100),
  };
}

type ItemContextRow = {
  id: string;
  due_at: string | null;
  max_score: number;
  score_categories: { course_id: string } | null;
};

// คำนวณ XP ของชิ้นงานนี้ใหม่ทั้งหมด (พฤติกรรมส่ง + คะแนน) แล้ว upsert ทับของเดิม — เรียกซ้ำได้เสมอ (idempotent)
// เพราะคะแนน/การส่งงานแก้ทับกันได้ (resubmit, ครูแก้คะแนนทีหลัง, ลบการส่งงานทิ้ง) คืน course_id ถ้าสำเร็จ ไม่งั้น null
// knownScore: ถ้าผู้เรียกเพิ่ง upsert student_scores ไปเอง (เช่น saveScore) ส่งค่ามาตรงๆได้เลย ไม่ต้อง query ซ้ำ
export async function recomputeItemXp(
  supabase: SupabaseClient,
  {
    gradeItemId,
    studentId,
    knownScore,
  }: { gradeItemId: string; studentId: string; knownScore?: number | null },
): Promise<string | null> {
  const { data: item } = await supabase
    .from("grade_items")
    .select("id, due_at, max_score, score_categories(course_id)")
    .eq("id", gradeItemId)
    .maybeSingle<ItemContextRow>();

  const courseId = item?.score_categories?.course_id;
  if (!item || !courseId) return null;

  const [{ data: submission }, scoreResult] = await Promise.all([
    supabase
      .from("assignment_submissions")
      .select("submitted_at")
      .eq("grade_item_id", gradeItemId)
      .eq("student_id", studentId)
      .maybeSingle(),
    knownScore === undefined
      ? supabase
          .from("student_scores")
          .select("score")
          .eq("grade_item_id", gradeItemId)
          .eq("student_id", studentId)
          .maybeSingle()
      : Promise.resolve({ data: { score: knownScore } }),
  ]);

  let behaviorXp = 0;
  if (submission) {
    const onTime = !item.due_at || new Date(submission.submitted_at) <= new Date(item.due_at);
    behaviorXp = onTime ? BEHAVIOR_ON_TIME_XP : BEHAVIOR_LATE_XP;
  }

  const score = scoreResult.data?.score;
  let scoreXp = 0;
  if (score != null && item.max_score > 0) {
    scoreXp = Math.min(SCORE_BONUS_MAX_XP, (score / item.max_score) * SCORE_BONUS_MAX_XP);
  }

  await supabase.from("xp_events").upsert(
    {
      course_id: courseId,
      student_id: studentId,
      grade_item_id: gradeItemId,
      points: behaviorXp + scoreXp,
      computed_at: new Date().toISOString(),
    },
    { onConflict: "student_id,grade_item_id" },
  );

  return courseId;
}

// ไล่ดูชิ้นงาน (ที่มีกำหนดส่งและนักเรียนส่งจริง) เรียงตามวันกำหนดส่ง นับ streak ส่งตรงเวลาต่อกัน
// ทุกครั้งที่ครบ 3 ชิ้น บันทึก grade_item ตัวที่ทำให้ครบเป็น milestone
// ลบของเดิมทั้งหมดแล้วสร้างใหม่ทุกครั้ง (ไม่ใช่ upsert เติม) เพื่อให้ self-correct เมื่อพฤติกรรมเปลี่ยนย้อนหลัง
// (เช่น ครูลบการส่งงานที่เคยทำให้ครบ streak ทิ้ง — milestone ที่ไม่ valid แล้วต้องหายไปด้วย ไม่ใช่ค้างอยู่)
export async function recomputeStreakBonuses(
  supabase: SupabaseClient,
  { courseId, studentId }: { courseId: string; studentId: string },
): Promise<void> {
  const milestoneItemIds = await findStreakMilestoneItemIds(supabase, { courseId, studentId });

  // ลบของเดิมทั้งหมดของคู่นี้ก่อนเสมอ แล้วค่อยใส่ milestone ที่ valid จริง ณ ตอนนี้กลับเข้าไป
  // (กัน milestone ที่ไม่ valid แล้วค้างอยู่ ถ้าพฤติกรรมเปลี่ยนย้อนหลัง เช่น ลบการส่งงานทิ้ง)
  await supabase
    .from("xp_streak_bonuses")
    .delete()
    .eq("course_id", courseId)
    .eq("student_id", studentId);

  if (milestoneItemIds.length === 0) return;

  await supabase.from("xp_streak_bonuses").insert(
    milestoneItemIds.map((gradeItemId) => ({
      course_id: courseId,
      student_id: studentId,
      grade_item_id: gradeItemId,
      points: STREAK_BONUS_XP,
    })),
  );
}

async function findStreakMilestoneItemIds(
  supabase: SupabaseClient,
  { courseId, studentId }: { courseId: string; studentId: string },
): Promise<string[]> {
  const { data: categories } = await supabase
    .from("score_categories")
    .select("id")
    .eq("course_id", courseId);

  const categoryIds = (categories ?? []).map((c) => c.id);
  if (categoryIds.length === 0) return [];

  const { data: items } = await supabase
    .from("grade_items")
    .select("id, due_at")
    .in("category_id", categoryIds)
    .not("due_at", "is", null);

  const itemIds = (items ?? []).map((i) => i.id);
  if (itemIds.length === 0) return [];

  const { data: submissions } = await supabase
    .from("assignment_submissions")
    .select("grade_item_id, submitted_at")
    .eq("student_id", studentId)
    .in("grade_item_id", itemIds);

  const submittedAtByItem = new Map((submissions ?? []).map((s) => [s.grade_item_id, s.submitted_at]));

  const ordered = (items ?? [])
    .filter((i) => submittedAtByItem.has(i.id))
    .sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime());

  let streak = 0;
  const milestoneItemIds: string[] = [];
  for (const item of ordered) {
    const submittedAt = submittedAtByItem.get(item.id)!;
    const onTime = new Date(submittedAt) <= new Date(item.due_at!);
    streak = onTime ? streak + 1 : 0;
    if (streak > 0 && streak % STREAK_LENGTH === 0) {
      milestoneItemIds.push(item.id);
    }
  }

  return milestoneItemIds;
}

export type XpItemBreakdown = {
  gradeItemId: string;
  title: string;
  categoryName: string;
  points: number;
  kind: "submission" | "streak";
};

export type StudentXpSummary = {
  level: LevelInfo;
  items: XpItemBreakdown[];
};

// อ่าน XP สรุปของนักเรียนคนหนึ่งในวิชาเดียว ใช้ service client เพราะนักเรียนไม่มี auth.uid()
// เช็ค enrollment ผ่าน course_students ก่อนเสมอ (pattern เดียวกับ getStudentScoreView)
export async function getStudentXp(courseId: string, studentId: string): Promise<StudentXpSummary | null> {
  const supabase = createServiceClient();

  const { data: enrollment } = await supabase
    .from("course_students")
    .select("student_id")
    .eq("course_id", courseId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (!enrollment) return null;

  const [{ data: events }, { data: streaks }] = await Promise.all([
    supabase
      .from("xp_events")
      .select("grade_item_id, points, grade_items(title, score_categories(name))")
      .eq("course_id", courseId)
      .eq("student_id", studentId),
    supabase
      .from("xp_streak_bonuses")
      .select("grade_item_id, points, grade_items(title, score_categories(name))")
      .eq("course_id", courseId)
      .eq("student_id", studentId),
  ]);

  type Row = {
    grade_item_id: string;
    points: number;
    grade_items: { title: string; score_categories: { name: string } | null } | null;
  };

  const items: XpItemBreakdown[] = [
    ...((events as unknown as Row[]) ?? [])
      .filter((row) => Number(row.points) > 0)
      .map((row) => ({
        gradeItemId: row.grade_item_id,
        title: row.grade_items?.title ?? "",
        categoryName: row.grade_items?.score_categories?.name ?? "",
        points: Number(row.points),
        kind: "submission" as const,
      })),
    ...((streaks as unknown as Row[]) ?? []).map((row) => ({
      gradeItemId: row.grade_item_id,
      title: row.grade_items?.title ?? "",
      categoryName: row.grade_items?.score_categories?.name ?? "",
      points: Number(row.points),
      kind: "streak" as const,
    })),
  ];

  const totalXp = items.reduce((sum, item) => sum + item.points, 0);

  return { level: computeLevel(totalXp), items };
}

export type CourseXpEntry = {
  studentId: string;
  name: string;
  title: string;
  studentCode: string;
  level: LevelInfo;
  rank: number;
};

// อันดับ XP ของทุกคนในวิชา ใช้ service client (ครูเรียกผ่าน RLS เห็นแค่วิชาตัวเองอยู่แล้วจาก courseId ที่ตรวจมาก่อน)
export async function getCourseXpBoard(courseId: string): Promise<CourseXpEntry[]> {
  const supabase = createServiceClient();

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

  const [{ data: events }, { data: streaks }] = await Promise.all([
    supabase.from("xp_events").select("student_id, points").eq("course_id", courseId),
    supabase.from("xp_streak_bonuses").select("student_id, points").eq("course_id", courseId),
  ]);

  const xpByStudent = new Map<string, number>();
  for (const row of [...(events ?? []), ...(streaks ?? [])]) {
    xpByStudent.set(row.student_id, (xpByStudent.get(row.student_id) ?? 0) + Number(row.points));
  }

  return rosterStudents
    .map((s) => ({
      studentId: s.id,
      name: s.name,
      title: s.title,
      studentCode: s.student_code,
      level: computeLevel(xpByStudent.get(s.id) ?? 0),
      rank: 0,
    }))
    .sort((a, b) => b.level.totalXp - a.level.totalXp)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}
