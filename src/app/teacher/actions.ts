"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getRequiredField(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`กรุณากรอก ${key}`);
  }
  return value;
}

export async function login(formData: FormData) {
  const email = getRequiredField(formData, "email");
  const password = getRequiredField(formData, "password");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/teacher/login?error=${encodeURIComponent("อีเมลหรือรหัสผ่านไม่ถูกต้อง")}`);
  }

  redirect("/teacher/dashboard");
}

export async function signup(formData: FormData) {
  const name = getRequiredField(formData, "name");
  const email = getRequiredField(formData, "email");
  const password = getRequiredField(formData, "password");
  const confirmPassword = getRequiredField(formData, "confirmPassword");
  const termsAccepted = formData.get("termsAccepted") === "on";

  if (password.length < 8) {
    redirect(`/teacher/signup?error=${encodeURIComponent("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")}`);
  }

  if (password !== confirmPassword) {
    redirect(`/teacher/signup?error=${encodeURIComponent("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน")}`);
  }

  if (!termsAccepted) {
    redirect(
      `/teacher/signup?error=${encodeURIComponent("กรุณายอมรับเงื่อนไขการใช้งานก่อนสมัครสมาชิก")}`,
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) {
    redirect(`/teacher/signup?error=${encodeURIComponent(error.message)}`);
  }

  // ถ้า Supabase project เปิด "Confirm email" ไว้ จะยังไม่มี session ทันที
  // ต้องให้ครูไปยืนยันอีเมลก่อน ไม่ใช่พาเข้า dashboard เลย
  if (!data.session) {
    redirect(
      `/teacher/login?notice=${encodeURIComponent(
        "สมัครสำเร็จ กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ",
      )}`,
    );
  }

  redirect("/teacher/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/teacher/login");
}

// ส่งรหัส OTP 6 หลักไปทางอีเมล แทนการส่งลิงก์ — กัน token ถูก "เผา" ก่อนผู้ใช้กดจริง
// จากระบบสแกนลิงก์อัตโนมัติของผู้ให้บริการอีเมล (Gmail/Outlook Safe Links ฯลฯ) ที่เปิดลิงก์ล่วงหน้าให้
// ต้องตั้ง Email Template ฝั่ง Supabase Dashboard ให้ใช้ {{ .Token }} ด้วย ไม่ใช่ {{ .ConfirmationURL }}
export async function requestPasswordReset(formData: FormData) {
  const email = getRequiredField(formData, "email");

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email);

  // ส่งต่อไปหน้ากรอกรหัส OTP เสมอไม่ว่าอีเมลนี้จะมีอยู่ในระบบหรือไม่ กัน enumeration อีเมลของครู
  redirect(`/teacher/reset-password?email=${encodeURIComponent(email)}`);
}

export async function resetPasswordWithOtp(formData: FormData) {
  const email = getRequiredField(formData, "email");
  const otp = getRequiredField(formData, "otp");
  const password = getRequiredField(formData, "password");
  const confirmPassword = getRequiredField(formData, "confirmPassword");

  const failWith = (message: string) => {
    redirect(
      `/teacher/reset-password?email=${encodeURIComponent(email)}&error=${encodeURIComponent(message)}`,
    );
  };

  if (password.length < 8) {
    failWith("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
  }

  if (password !== confirmPassword) {
    failWith("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
  }

  const supabase = await createClient();

  const { error: verifyError } = await supabase.auth.verifyOtp({
    email,
    token: otp,
    type: "recovery",
  });

  if (verifyError) {
    failWith("รหัส OTP ไม่ถูกต้องหรือหมดอายุ กรุณาขอรหัสใหม่");
  }

  const { error: updateError } = await supabase.auth.updateUser({ password });

  if (updateError) {
    failWith(updateError.message);
  }

  redirect("/teacher/dashboard");
}
