import { cookies } from "next/headers";
import { STUDENT_SESSION_COOKIE, verifySessionToken } from "@/lib/student-session";
import { getStudentBasicInfo } from "@/lib/student-score-view";
import { StudentSidebar } from "@/components/student-sidebar";
import { StudentTopbar } from "@/components/student-topbar";
import { SidebarProvider } from "@/components/sidebar-context";

// ยังไม่ login (เช่น หน้ากรอกรหัส+PIN) ไม่มี sidebar/topbar ให้ — เหมือนหน้า login ของครูที่ไม่มี chrome
// login แล้วเท่านั้นถึงจะเห็นเทมเพลตเดียวกับฝั่งครู (sidebar + topbar)
export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(STUDENT_SESSION_COOKIE)?.value;
  const session = token ? verifySessionToken(token) : null;

  if (!session) {
    return <>{children}</>;
  }

  const student = await getStudentBasicInfo(session.studentId);

  return (
    <SidebarProvider>
      <div className="flex flex-1">
        <StudentSidebar />
        <div className="flex flex-1 flex-col lg:min-w-0">
          <StudentTopbar name={student?.name ?? ""} title={student?.title ?? ""} />
          <main className="flex-1 overflow-x-hidden bg-slate-50 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
