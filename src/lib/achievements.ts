import { createServiceClient } from "@/lib/supabase/service";

// เหรียญตรา (achievement) 12 ใบ — แต่ละใบมีเงื่อนไขปลดล็อกของตัวเอง อิงพฤติกรรมจริง ไม่ใช่แค่เลเวล/XP รวม
// ภาพอยู่ใน public/badges/ (คัดมาจาก ui_design/grid-piece-*.png ที่ผู้ใช้เตรียมไว้แล้ว)
export type AchievementStats = {
  totalSubmissions: number;
  onTimeSubmissions: number;
  perfectScores: number;
  streakBonuses: number;
  totalXp: number;
};

export type Achievement = {
  key: string;
  nameTh: string;
  image: string;
  descriptionTh: string;
  isUnlocked: (stats: AchievementStats) => boolean;
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    key: "beginner",
    nameTh: "ผู้เริ่มต้น",
    image: "/badges/01-beginner.png",
    descriptionTh: "ส่งงานครั้งแรก",
    isUnlocked: (s) => s.totalSubmissions >= 1,
  },
  {
    key: "novice",
    nameTh: "มือใหม่",
    image: "/badges/02-novice.png",
    descriptionTh: "ส่งงานตรงเวลาครั้งแรก",
    isUnlocked: (s) => s.onTimeSubmissions >= 1,
  },
  {
    key: "apprentice",
    nameTh: "ฝึกหัด",
    image: "/badges/03-apprentice.png",
    descriptionTh: "ส่งงานสะสมครบ 5 ชิ้น",
    isUnlocked: (s) => s.totalSubmissions >= 5,
  },
  {
    key: "learner",
    nameTh: "ผู้เรียนรู้",
    image: "/badges/04-learner.png",
    descriptionTh: "ได้คะแนนเต็มครั้งแรก",
    isUnlocked: (s) => s.perfectScores >= 1,
  },
  {
    key: "skilled",
    nameTh: "ผู้มีฝีมือ",
    image: "/badges/05-skilled.png",
    descriptionTh: "ส่งตรงเวลาติดต่อกันครบ 3 ชิ้น",
    isUnlocked: (s) => s.streakBonuses >= 1,
  },
  {
    key: "advanced",
    nameTh: "ผู้ก้าวหน้า",
    image: "/badges/06-advanced.png",
    descriptionTh: "ส่งตรงเวลาสะสมครบ 10 ชิ้น",
    isUnlocked: (s) => s.onTimeSubmissions >= 10,
  },
  {
    key: "expert",
    nameTh: "ผู้เชี่ยวชาญ",
    image: "/badges/07-expert.png",
    descriptionTh: "ส่งงานสะสมครบ 15 ชิ้น",
    isUnlocked: (s) => s.totalSubmissions >= 15,
  },
  {
    key: "scholar",
    nameTh: "นักวิชาการ",
    image: "/badges/08-scholar.png",
    descriptionTh: "ได้คะแนนเต็มสะสม 3 ชิ้น",
    isUnlocked: (s) => s.perfectScores >= 3,
  },
  {
    key: "master",
    nameTh: "ปราชญ์",
    image: "/badges/09-master.png",
    descriptionTh: "ส่งตรงเวลาติดต่อกันครบ 2 รอบ (6 ชิ้น)",
    isUnlocked: (s) => s.streakBonuses >= 2,
  },
  {
    key: "elite",
    nameTh: "ขั้นเทพ",
    image: "/badges/10-elite.png",
    descriptionTh: "ส่งตรงเวลาสะสมครบ 20 ชิ้น",
    isUnlocked: (s) => s.onTimeSubmissions >= 20,
  },
  {
    key: "mythic",
    nameTh: "ระดับเทพนิยาย",
    image: "/badges/11-mythic.png",
    descriptionTh: "ได้คะแนนเต็มสะสม 5 ชิ้น",
    isUnlocked: (s) => s.perfectScores >= 5,
  },
  {
    key: "legendary",
    nameTh: "ตำนาน",
    image: "/badges/12-legendary.png",
    descriptionTh: "สะสม XP ครบ 500",
    isUnlocked: (s) => s.totalXp >= 500,
  },
];

export type StudentAchievement = Achievement & { unlocked: boolean };

// คำนวณ stats จากข้อมูลจริง (ไม่พึ่ง xp_events เพราะ behavior กับ score ผสมกันอยู่ในนั้น ต้องแยกราย item เอง)
// ใช้ service client เพราะนักเรียนไม่มี auth.uid() — เช็ค enrollment ก่อนเสมอ (pattern เดียวกับ getStudentScoreView)
export async function getStudentAchievements(
  courseId: string,
  studentId: string,
): Promise<StudentAchievement[] | null> {
  const supabase = createServiceClient();

  const { data: enrollment } = await supabase
    .from("course_students")
    .select("student_id")
    .eq("course_id", courseId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (!enrollment) return null;

  const { data: categories } = await supabase
    .from("score_categories")
    .select("id")
    .eq("course_id", courseId);

  const categoryIds = (categories ?? []).map((c) => c.id);

  const { data: items } =
    categoryIds.length > 0
      ? await supabase
          .from("grade_items")
          .select("id, due_at, max_score")
          .in("category_id", categoryIds)
      : { data: [] as { id: string; due_at: string | null; max_score: number }[] };

  const itemIds = (items ?? []).map((i) => i.id);
  const itemById = new Map((items ?? []).map((i) => [i.id, i]));

  const [{ data: submissions }, { data: scores }, { data: streaks }] = await Promise.all([
    itemIds.length > 0
      ? supabase
          .from("assignment_submissions")
          .select("grade_item_id, submitted_at")
          .eq("student_id", studentId)
          .in("grade_item_id", itemIds)
      : Promise.resolve({ data: [] as { grade_item_id: string; submitted_at: string }[] }),
    itemIds.length > 0
      ? supabase
          .from("student_scores")
          .select("grade_item_id, score")
          .eq("student_id", studentId)
          .in("grade_item_id", itemIds)
      : Promise.resolve({ data: [] as { grade_item_id: string; score: number | null }[] }),
    supabase
      .from("xp_streak_bonuses")
      .select("points")
      .eq("course_id", courseId)
      .eq("student_id", studentId),
  ]);

  const totalSubmissions = (submissions ?? []).length;

  const onTimeSubmissions = (submissions ?? []).filter((s) => {
    const item = itemById.get(s.grade_item_id);
    return !item?.due_at || new Date(s.submitted_at) <= new Date(item.due_at);
  }).length;

  const perfectScores = (scores ?? []).filter((s) => {
    const item = itemById.get(s.grade_item_id);
    return s.score != null && !!item && item.max_score > 0 && Number(s.score) >= Number(item.max_score);
  }).length;

  const streakBonuses = (streaks ?? []).length;

  const { data: xpEvents } = await supabase
    .from("xp_events")
    .select("points")
    .eq("course_id", courseId)
    .eq("student_id", studentId);

  const totalXp = [...(xpEvents ?? []), ...(streaks ?? [])].reduce(
    (sum, row) => sum + Number(row.points),
    0,
  );

  const stats: AchievementStats = {
    totalSubmissions,
    onTimeSubmissions,
    perfectScores,
    streakBonuses,
    totalXp,
  };

  return ACHIEVEMENTS.map((achievement) => ({ ...achievement, unlocked: achievement.isUnlocked(stats) }));
}
