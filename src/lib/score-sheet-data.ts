import { createClient } from "@/lib/supabase/server";
import { withScoreRanges } from "@/lib/grading-scale";

export async function getScoreSheetData(courseId: string) {
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id, name, code, term, academic_year")
    .eq("id", courseId)
    .single();

  if (!course) return null;

  const { data: categories, error: categoriesError } = await supabase
    .from("score_categories")
    .select("id, name, weight_percent")
    .eq("course_id", courseId)
    .order("created_at", { ascending: true });

  if (categoriesError) {
    console.error("[getScoreSheetData] score_categories error:", categoriesError);
  }

  const categoryIds = (categories ?? []).map((c) => c.id);

  const { data: itemsRaw, error: itemsError } =
    categoryIds.length > 0
      ? await supabase
          .from("grade_items")
          .select("id, title, description, max_score, category_id, chapter_id")
          .in("category_id", categoryIds)
          .order("created_at", { ascending: true })
      : {
          data: [] as {
            id: string;
            title: string;
            description: string;
            max_score: number;
            category_id: string;
            chapter_id: string | null;
          }[],
          error: null,
        };

  if (itemsError) {
    console.error("[getScoreSheetData] grade_items error:", itemsError);
  }

  const allItems = itemsRaw ?? [];

  const allCategories = (categories ?? []).map((c) => ({
    ...c,
    grade_items: allItems.filter((i) => i.category_id === c.id),
  }));

  type RosterRow = {
    student_id: string;
    students: { id: string; student_code: string; name: string; title: string } | null;
  };

  const { data: roster } = await supabase
    .from("course_students")
    .select("student_id, students(id, student_code, name, title)")
    .eq("course_id", courseId)
    .returns<RosterRow[]>();

  const students = (roster ?? [])
    .map((r) => r.students)
    .filter(
      (s): s is { id: string; student_code: string; name: string; title: string } => Boolean(s),
    )
    .sort((a, b) => a.student_code.localeCompare(b.student_code));

  const itemIds = allItems.map((i) => i.id);
  const { data: scoresRaw } =
    itemIds.length > 0 && students.length > 0
      ? await supabase
          .from("student_scores")
          .select("grade_item_id, student_id, score")
          .in("grade_item_id", itemIds)
      : { data: [] as { grade_item_id: string; student_id: string; score: number | null }[] };

  const initialScores: Record<string, number | null> = {};
  for (const row of scoresRaw ?? []) {
    initialScores[`${row.student_id}:${row.grade_item_id}`] = row.score;
  }

  const { data: scalesRaw } = await supabase
    .from("grading_scales")
    .select("id, grade_letter, min_score, description, gpa_value")
    .eq("course_id", courseId);

  const scales = withScoreRanges(scalesRaw ?? []);

  const { data: chaptersRaw } = await supabase
    .from("chapters")
    .select("id, name")
    .eq("course_id", courseId)
    .order("created_at", { ascending: true });

  const chapters = chaptersRaw ?? [];

  return { course, allCategories, allItems, students, initialScores, scales, chapters };
}
