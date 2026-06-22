"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { STANDARD_GRADING_SCALE } from "@/lib/standard-grading-scale";

function getRequiredField(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`กรุณากรอก ${key}`);
  }
  return value;
}

function basePath(courseId: string) {
  return `/teacher/courses/${courseId}/grade-structure`;
}

function itemsPath(courseId: string, categoryId: string) {
  return `${basePath(courseId)}/categories/${categoryId}/items`;
}

function chaptersPath(courseId: string) {
  return `${basePath(courseId)}/chapters`;
}

// ---------------------------------------------------------------------------
// หมวดหมู่คะแนน (score_categories)
// ---------------------------------------------------------------------------

export async function createCategory(formData: FormData) {
  const courseId = getRequiredField(formData, "courseId");
  const name = getRequiredField(formData, "name");
  const weightPercent = Number(getRequiredField(formData, "weightPercent"));

  const supabase = await createClient();
  const { data: category, error } = await supabase
    .from("score_categories")
    .insert({
      course_id: courseId,
      name,
      weight_percent: weightPercent,
    })
    .select("id")
    .single();

  if (error || !category) {
    redirect(
      `${basePath(courseId)}/categories/new?error=${encodeURIComponent(error?.message ?? "สร้างหมวดหมู่ไม่สำเร็จ")}`,
    );
  }

  revalidatePath(basePath(courseId));
  // พาไปเพิ่มชิ้นงานต่อทันที เพราะหมวดหมู่ที่ยังไม่มีชิ้นงานเลยใช้กรอกคะแนนไม่ได้
  // (เคยมีปัญหาผู้ใช้สร้างหมวดหมู่แล้วเข้าใจว่าเสร็จแล้ว ไม่รู้ว่าต้องไปเพิ่มชิ้นงานอีกขั้นหนึ่ง)
  redirect(`${itemsPath(courseId, category.id)}/new?notice=created-category`);
}

export async function updateCategory(formData: FormData) {
  const courseId = getRequiredField(formData, "courseId");
  const categoryId = getRequiredField(formData, "categoryId");
  const name = getRequiredField(formData, "name");
  const weightPercent = Number(getRequiredField(formData, "weightPercent"));

  const supabase = await createClient();
  const { error } = await supabase
    .from("score_categories")
    .update({ name, weight_percent: weightPercent })
    .eq("id", categoryId);

  if (error) {
    redirect(
      `${basePath(courseId)}/categories/${categoryId}/edit?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath(basePath(courseId));
  redirect(`${basePath(courseId)}?notice=${encodeURIComponent("บันทึกหมวดหมู่คะแนนเรียบร้อยแล้ว")}`);
}

export async function deleteCategory(formData: FormData) {
  const courseId = getRequiredField(formData, "courseId");
  const categoryId = getRequiredField(formData, "categoryId");

  const supabase = await createClient();
  const { error } = await supabase.from("score_categories").delete().eq("id", categoryId);

  if (error) {
    redirect(`${basePath(courseId)}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(basePath(courseId));
  redirect(`${basePath(courseId)}?notice=${encodeURIComponent("ลบหมวดหมู่คะแนนเรียบร้อยแล้ว")}`);
}

// ---------------------------------------------------------------------------
// บท (chapters) — มิติจัดกลุ่มชิ้นงาน ไม่มีน้ำหนัก ไม่กระทบการคำนวณเกรด
// ---------------------------------------------------------------------------

export async function createChapter(formData: FormData) {
  const courseId = getRequiredField(formData, "courseId");
  const name = getRequiredField(formData, "name");

  const supabase = await createClient();
  const { error } = await supabase.from("chapters").insert({ course_id: courseId, name });

  if (error) {
    redirect(`${chaptersPath(courseId)}/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(chaptersPath(courseId));
  redirect(`${chaptersPath(courseId)}?notice=${encodeURIComponent("เพิ่มบทเรียบร้อยแล้ว")}`);
}

export async function updateChapter(formData: FormData) {
  const courseId = getRequiredField(formData, "courseId");
  const chapterId = getRequiredField(formData, "chapterId");
  const name = getRequiredField(formData, "name");

  const supabase = await createClient();
  const { error } = await supabase.from("chapters").update({ name }).eq("id", chapterId);

  if (error) {
    redirect(
      `${chaptersPath(courseId)}/${chapterId}/edit?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath(chaptersPath(courseId));
  redirect(`${chaptersPath(courseId)}?notice=${encodeURIComponent("บันทึกบทเรียบร้อยแล้ว")}`);
}

export async function deleteChapter(formData: FormData) {
  const courseId = getRequiredField(formData, "courseId");
  const chapterId = getRequiredField(formData, "chapterId");

  const supabase = await createClient();
  const { error } = await supabase.from("chapters").delete().eq("id", chapterId);

  if (error) {
    redirect(`${chaptersPath(courseId)}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(chaptersPath(courseId));
  redirect(`${chaptersPath(courseId)}?notice=${encodeURIComponent("ลบบทเรียบร้อยแล้ว")}`);
}

// ---------------------------------------------------------------------------
// ชิ้นงาน/การสอบ (grade_items)
// ---------------------------------------------------------------------------

// สร้างชิ้นงานได้หลายรายการพร้อมกันในครั้งเดียว (จากฟอร์ม MultiGradeItemForm ที่เพิ่มแถวได้ไม่จำกัด)
// แถวที่กรอกแค่บางช่อง (เผื่อกดเพิ่มแถวเกินแล้วไม่ได้ใช้) จะถูกข้ามไปถ้าไม่มีชื่อชิ้นงาน
export async function createGradeItems(formData: FormData) {
  const courseId = getRequiredField(formData, "courseId");
  const categoryId = getRequiredField(formData, "categoryId");
  const rowKeys = getRequiredField(formData, "rowKeys")
    .split(",")
    .filter(Boolean);

  const rows = rowKeys
    .map((key) => ({
      title: ((formData.get(`title-${key}`) as string | null) ?? "").trim(),
      description: (formData.get(`description-${key}`) as string | null) ?? "",
      maxScoreRaw: formData.get(`maxScore-${key}`) as string | null,
      chapterId: (formData.get(`chapter-${key}`) as string | null) || null,
    }))
    .filter((row) => row.title !== "");

  if (rows.length === 0) {
    redirect(
      `${itemsPath(courseId, categoryId)}/new?error=${encodeURIComponent("กรุณากรอกอย่างน้อย 1 ชิ้นงาน")}`,
    );
  }

  const invalidRow = rows.find((r) => !r.maxScoreRaw || Number(r.maxScoreRaw) <= 0);
  if (invalidRow) {
    redirect(
      `${itemsPath(courseId, categoryId)}/new?error=${encodeURIComponent(
        `กรุณากรอกคะแนนเต็มของ "${invalidRow.title}" ให้ถูกต้อง`,
      )}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from("grade_items").insert(
    rows.map((r) => ({
      category_id: categoryId,
      title: r.title,
      description: r.description,
      max_score: Number(r.maxScoreRaw),
      chapter_id: r.chapterId,
    })),
  );

  if (error) {
    redirect(`${itemsPath(courseId, categoryId)}/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(itemsPath(courseId, categoryId));
  redirect(`${itemsPath(courseId, categoryId)}?notice=${encodeURIComponent("เพิ่มชิ้นงานเรียบร้อยแล้ว")}`);
}

export async function updateGradeItem(formData: FormData) {
  const courseId = getRequiredField(formData, "courseId");
  const categoryId = getRequiredField(formData, "categoryId");
  const itemId = getRequiredField(formData, "itemId");
  const title = getRequiredField(formData, "title");
  const maxScore = Number(getRequiredField(formData, "maxScore"));
  const description = (formData.get("description") as string | null) ?? "";
  const chapterIdRaw = formData.get("chapterId") as string | null;
  const chapterId = chapterIdRaw && chapterIdRaw !== "" ? chapterIdRaw : null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("grade_items")
    .update({ title, max_score: maxScore, description, chapter_id: chapterId })
    .eq("id", itemId);

  if (error) {
    redirect(
      `${itemsPath(courseId, categoryId)}/${itemId}/edit?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath(itemsPath(courseId, categoryId));
  redirect(
    `${itemsPath(courseId, categoryId)}?notice=${encodeURIComponent("บันทึกชิ้นงานเรียบร้อยแล้ว")}`,
  );
}

export async function deleteGradeItem(formData: FormData) {
  const courseId = getRequiredField(formData, "courseId");
  const categoryId = getRequiredField(formData, "categoryId");
  const itemId = getRequiredField(formData, "itemId");

  const supabase = await createClient();
  const { error } = await supabase.from("grade_items").delete().eq("id", itemId);

  if (error) {
    redirect(`${itemsPath(courseId, categoryId)}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(itemsPath(courseId, categoryId));
  redirect(`${itemsPath(courseId, categoryId)}?notice=${encodeURIComponent("ลบชิ้นงานเรียบร้อยแล้ว")}`);
}

// ---------------------------------------------------------------------------
// เกณฑ์การให้คะแนน (grading_scales)
// ---------------------------------------------------------------------------

export async function createGradingScale(formData: FormData) {
  const courseId = getRequiredField(formData, "courseId");
  const gradeLetter = getRequiredField(formData, "gradeLetter");
  const minScore = Number(getRequiredField(formData, "minScore"));
  const description = (formData.get("description") as string | null) ?? "";
  const gpaValueRaw = formData.get("gpaValue");
  const gpaValue = gpaValueRaw && gpaValueRaw !== "" ? Number(gpaValueRaw) : null;

  const supabase = await createClient();
  const { error } = await supabase.from("grading_scales").insert({
    course_id: courseId,
    grade_letter: gradeLetter,
    min_score: minScore,
    description,
    gpa_value: gpaValue,
  });

  if (error) {
    redirect(`${basePath(courseId)}/scales/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(basePath(courseId));
  redirect(`${basePath(courseId)}/scales?notice=${encodeURIComponent("เพิ่มเกณฑ์การให้คะแนนเรียบร้อยแล้ว")}`);
}

export async function updateGradingScale(formData: FormData) {
  const courseId = getRequiredField(formData, "courseId");
  const scaleId = getRequiredField(formData, "scaleId");
  const gradeLetter = getRequiredField(formData, "gradeLetter");
  const minScore = Number(getRequiredField(formData, "minScore"));
  const description = (formData.get("description") as string | null) ?? "";
  const gpaValueRaw = formData.get("gpaValue");
  const gpaValue = gpaValueRaw && gpaValueRaw !== "" ? Number(gpaValueRaw) : null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("grading_scales")
    .update({ grade_letter: gradeLetter, min_score: minScore, description, gpa_value: gpaValue })
    .eq("id", scaleId);

  if (error) {
    redirect(
      `${basePath(courseId)}/scales/${scaleId}/edit?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath(basePath(courseId));
  redirect(`${basePath(courseId)}/scales?notice=${encodeURIComponent("บันทึกเกณฑ์การให้คะแนนเรียบร้อยแล้ว")}`);
}

export async function deleteGradingScale(formData: FormData) {
  const courseId = getRequiredField(formData, "courseId");
  const scaleId = getRequiredField(formData, "scaleId");

  const supabase = await createClient();
  const { error } = await supabase.from("grading_scales").delete().eq("id", scaleId);

  if (error) {
    redirect(`${basePath(courseId)}/scales?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(basePath(courseId));
  redirect(`${basePath(courseId)}/scales?notice=${encodeURIComponent("ลบเกณฑ์การให้คะแนนเรียบร้อยแล้ว")}`);
}

// แทนที่เกณฑ์การให้คะแนนทั้งหมดของวิชานี้ด้วยเกณฑ์มาตรฐาน สพฐ. (8 ระดับ 0-4)
// ใช้ตอนตั้งวิชาใหม่ ไม่ต้องพิมพ์เกณฑ์เดิมซ้ำทุกครั้ง — ถ้ามีเกณฑ์เดิมอยู่แล้วจะถูกลบแทนที่ทั้งหมด (เตือนผู้ใช้ฝั่ง UI ก่อน submit)
export async function seedStandardGradingScale(formData: FormData) {
  const courseId = getRequiredField(formData, "courseId");

  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("grading_scales")
    .delete()
    .eq("course_id", courseId);

  if (deleteError) {
    redirect(`${basePath(courseId)}/scales?error=${encodeURIComponent(deleteError.message)}`);
  }

  const { error: insertError } = await supabase.from("grading_scales").insert(
    STANDARD_GRADING_SCALE.map((s) => ({
      course_id: courseId,
      grade_letter: s.gradeLetter,
      min_score: s.minScore,
      description: s.description,
      gpa_value: s.gpaValue,
    })),
  );

  if (insertError) {
    redirect(`${basePath(courseId)}/scales?error=${encodeURIComponent(insertError.message)}`);
  }

  revalidatePath(basePath(courseId));
  redirect(
    `${basePath(courseId)}/scales?notice=${encodeURIComponent("ใช้เกณฑ์มาตรฐาน สพฐ. เรียบร้อยแล้ว")}`,
  );
}
