"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { createClient } from "@/lib/supabase/server";
import { generatePin } from "@/lib/pin";
import { upsertAndEnrollStudent } from "@/lib/student-enrollment";
import { importStudentsFromFile } from "@/lib/student-import";

function getRequiredField(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`กรุณากรอก ${key}`);
  }
  return value.trim();
}

export async function addStudent(formData: FormData) {
  const courseId = getRequiredField(formData, "courseId");
  const code = getRequiredField(formData, "code");
  const name = getRequiredField(formData, "name");
  const title = (formData.get("title") as string | null) ?? "ไม่ระบุ";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/teacher/login");

  let result;
  try {
    result = await upsertAndEnrollStudent(supabase, user.id, courseId, code, name, title);
  } catch (err) {
    const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
    redirect(`/teacher/courses/${courseId}/students/new?error=${encodeURIComponent(message)}`);
  }

  revalidatePath(`/teacher/courses/${courseId}/students`);

  if (result.created && result.pin) {
    redirect(
      `/teacher/courses/${courseId}/students?newPin=${result.pin}&newName=${encodeURIComponent(name)}`,
    );
  }
  redirect(
    `/teacher/courses/${courseId}/students?notice=${encodeURIComponent("เพิ่มนักเรียนเข้าวิชานี้แล้ว")}`,
  );
}

export async function resetPin(formData: FormData) {
  const courseId = getRequiredField(formData, "courseId");
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
    redirect(`/teacher/courses/${courseId}/students?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/teacher/courses/${courseId}/students`);
  redirect(
    `/teacher/courses/${courseId}/students?newPin=${pin}&newName=${encodeURIComponent(name)}`,
  );
}

export async function resetAllPins(formData: FormData) {
  const courseId = getRequiredField(formData, "courseId");

  const supabase = await createClient();

  type RosterRow = {
    student_id: string;
    students: { id: string; student_code: string; name: string; title: string } | null;
  };

  const { data: roster } = await supabase
    .from("course_students")
    .select("student_id, students(id, student_code, name, title)")
    .eq("course_id", courseId)
    .returns<RosterRow[]>();

  const rosterStudents = (roster ?? [])
    .map((row) => row.students)
    .filter(
      (s): s is { id: string; student_code: string; name: string; title: string } => Boolean(s),
    );

  if (rosterStudents.length === 0) {
    redirect(
      `/teacher/courses/${courseId}/students?error=${encodeURIComponent("วิชานี้ยังไม่มีนักเรียน")}`,
    );
  }

  let results: { code: string; name: string; title: string; pin: string }[];
  try {
    results = await Promise.all(
      rosterStudents.map(async (student) => {
        const pin = generatePin();
        const pinHash = await bcrypt.hash(pin, 10);
        const { error } = await supabase
          .from("students")
          .update({ pin_hash: pinHash })
          .eq("id", student.id);
        if (error) throw new Error(error.message);
        return { code: student.student_code, name: student.name, title: student.title, pin };
      }),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "รีเซ็ต PIN ทั้งห้องไม่สำเร็จ";
    redirect(`/teacher/courses/${courseId}/students?error=${encodeURIComponent(message)}`);
  }

  results.sort((a, b) => a.code.localeCompare(b.code));

  revalidatePath(`/teacher/courses/${courseId}/students`);
  const resetAllParam = Buffer.from(JSON.stringify(results)).toString("base64");
  redirect(`/teacher/courses/${courseId}/students?resetAll=${encodeURIComponent(resetAllParam)}`);
}

export async function removeStudentFromCourse(formData: FormData) {
  const courseId = getRequiredField(formData, "courseId");
  const studentId = getRequiredField(formData, "studentId");

  const supabase = await createClient();
  const { error } = await supabase
    .from("course_students")
    .delete()
    .eq("course_id", courseId)
    .eq("student_id", studentId);

  if (error) {
    redirect(`/teacher/courses/${courseId}/students?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/teacher/courses/${courseId}/students`);
  redirect(
    `/teacher/courses/${courseId}/students?notice=${encodeURIComponent("นำนักเรียนออกจากวิชานี้แล้ว")}`,
  );
}

export async function importStudents(formData: FormData) {
  const courseId = getRequiredField(formData, "courseId");
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    redirect(
      `/teacher/courses/${courseId}/students/import?error=${encodeURIComponent("กรุณาเลือกไฟล์ Excel หรือ CSV")}`,
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
      `/teacher/courses/${courseId}/students/import?error=${encodeURIComponent("อ่านไฟล์ไม่สำเร็จ ตรวจสอบรูปแบบไฟล์อีกครั้ง")}`,
    );
  }

  revalidatePath(`/teacher/courses/${courseId}/students`);

  const createdParam =
    outcome.created.length > 0
      ? `&created=${encodeURIComponent(Buffer.from(JSON.stringify(outcome.created)).toString("base64"))}`
      : "";

  redirect(`/teacher/courses/${courseId}/students?imported=${outcome.enrolledCount}${createdParam}`);
}
