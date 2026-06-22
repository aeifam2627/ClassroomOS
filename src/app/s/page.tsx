import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { STUDENT_SESSION_COOKIE, verifySessionToken } from "@/lib/student-session";
import { StudentLoginCard } from "@/components/student-login-card";
import { studentLoginGlobal } from "./actions";

export default async function StudentLandingLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const cookieStore = await cookies();
  const token = cookieStore.get(STUDENT_SESSION_COOKIE)?.value;
  const session = token ? verifySessionToken(token) : null;

  if (session) {
    redirect("/s/courses");
  }

  return (
    <StudentLoginCard
      action={studentLoginGlobal}
      subtitle="ระบบเช็คคะแนนสำหรับนักเรียน"
      error={error}
    />
  );
}
