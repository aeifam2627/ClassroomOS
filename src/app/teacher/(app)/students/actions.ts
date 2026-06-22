"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { createClient } from "@/lib/supabase/server";
import { generatePin } from "@/lib/pin";
import { importStudentsFromFile } from "@/lib/student-import";

function getRequiredField(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`กรุณากรอก ${key}`);
  }
  return value.trim();
}

export async function createStudent(formData: FormData) {
  const code = getRequiredField(formData, "code");
  const name = getRequiredField(formData, "name");
  const title = (formData.get("title") as string | null) ?? "ไม่ระบุ";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/teacher/login");

  const pin = generatePin();
  const pinHash = await bcrypt.hash(pin, 10);

  const { error } = await supabase
    .from("students")
    .insert({ owner_id: user.id, student_code: code, name, title, pin_hash: pinHash });

  if (error) {
    redirect(`/teacher/students/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/teacher/students");
  redirect(`/teacher/students?newPin=${pin}&newName=${encodeURIComponent(name)}`);
}

export async function updateStudent(formData: FormData) {
  const studentId = getRequiredField(formData, "studentId");
  const code = getRequiredField(formData, "code");
  const name = getRequiredField(formData, "name");
  const title = (formData.get("title") as string | null) ?? "ไม่ระบุ";

  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update({ student_code: code, name, title })
    .eq("id", studentId);

  if (error) {
    redirect(`/teacher/students/${studentId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/teacher/students");
  redirect("/teacher/students");
}

export async function resetStudentPin(formData: FormData) {
  const studentId = getRequiredField(formData, "studentId");
  const name = getRequiredField(formData, "name");

  const supabase = await createClient();
  const pin = generatePin();
  const pinHash = await bcrypt.hash(pin, 10);

  const { error } = await supabase
    .from("students")
    .update({ pin_hash: pinHash })
    .eq("id", studentId);

  if (error) {
    redirect(`/teacher/students?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/teacher/students");
  redirect(`/teacher/students?newPin=${pin}&newName=${encodeURIComponent(name)}`);
}

export async function enrollStudentInCourse(formData: FormData) {
  const studentId = getRequiredField(formData, "studentId");
  const courseId = getRequiredField(formData, "courseId");

  const supabase = await createClient();
  const { error } = await supabase
    .from("course_students")
    .upsert(
      { course_id: courseId, student_id: studentId },
      { onConflict: "course_id,student_id", ignoreDuplicates: true },
    );

  if (error) {
    redirect(`/teacher/students?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/teacher/students");
  redirect("/teacher/students");
}

export async function unenrollStudentFromCourse(formData: FormData) {
  const studentId = getRequiredField(formData, "studentId");
  const courseId = getRequiredField(formData, "courseId");

  const supabase = await createClient();
  const { error } = await supabase
    .from("course_students")
    .delete()
    .eq("student_id", studentId)
    .eq("course_id", courseId);

  if (error) {
    redirect(`/teacher/students?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/teacher/students");
  redirect("/teacher/students");
}

export async function importStudentsGlobal(formData: FormData) {
  const courseId = getRequiredField(formData, "courseId");
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    redirect(
      `/teacher/students/import?error=${encodeURIComponent("กรุณาเลือกไฟล์ Excel หรือ CSV")}`,
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/teacher/login");

  let outcome;
  try {
    outcome = await importStudentsFromFile(supabase, user.id, courseId, file as File);
  } catch {
    redirect(
      `/teacher/students/import?error=${encodeURIComponent("อ่านไฟล์ไม่สำเร็จ ตรวจสอบรูปแบบไฟล์อีกครั้ง")}`,
    );
  }

  revalidatePath("/teacher/students");

  const createdParam =
    outcome.created.length > 0
      ? `&created=${encodeURIComponent(Buffer.from(JSON.stringify(outcome.created)).toString("base64"))}`
      : "";

  redirect(`/teacher/students?imported=${outcome.enrolledCount}${createdParam}`);
}

export async function deleteStudent(formData: FormData) {
  const studentId = getRequiredField(formData, "studentId");

  const supabase = await createClient();
  const { error } = await supabase.from("students").delete().eq("id", studentId);

  if (error) {
    redirect(`/teacher/students?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/teacher/students");
  redirect("/teacher/students");
}
