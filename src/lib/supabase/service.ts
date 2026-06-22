import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client: bypass RLS ทั้งหมด ใช้เฉพาะฝั่ง server สำหรับ flow ที่ไม่มี Supabase Auth
// (นักเรียน login ด้วยรหัสนักเรียน + PIN เอง ไม่ใช่ auth.uid()) — ต้อง scope เงื่อนไข query เองให้ถูกต้องเสมอ
// ห้าม import ไฟล์นี้จาก client component หรือเปิดเผย service role key ออกไปฝั่ง browser เด็ดขาด
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
