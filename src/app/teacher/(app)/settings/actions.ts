"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateProfileName(formData: FormData) {
  const name = formData.get("name");

  if (typeof name !== "string" || name.trim() === "") {
    redirect(`/teacher/settings?error=${encodeURIComponent("กรุณากรอกชื่อที่แสดง")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ data: { name: name.trim() } });

  if (error) {
    redirect(`/teacher/settings?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/teacher/settings?notice=${encodeURIComponent("บันทึกชื่อที่แสดงแล้ว")}`);
}
