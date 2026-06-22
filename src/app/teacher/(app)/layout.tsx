import { createClient } from "@/lib/supabase/server";
import { TeacherSidebar } from "@/components/teacher-sidebar";
import { TeacherTopbar } from "@/components/teacher-topbar";
import { SidebarProvider } from "@/components/sidebar-context";
import { logout } from "@/app/teacher/actions";
import { getPendingWorkSummary } from "@/lib/pending-work";

export default async function TeacherAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const name = (user?.user_metadata?.name as string | undefined) ?? user?.email ?? "";
  const pendingWork = await getPendingWorkSummary();

  return (
    <SidebarProvider>
      <div className="flex flex-1">
        <TeacherSidebar logoutAction={logout} />
        <div className="flex flex-1 flex-col lg:min-w-0">
          <TeacherTopbar name={name} pendingWork={pendingWork} />
          <main className="flex-1 overflow-x-hidden bg-slate-50 p-4 print:bg-white print:p-0 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
