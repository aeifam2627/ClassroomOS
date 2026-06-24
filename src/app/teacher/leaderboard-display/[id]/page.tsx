import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Crown, Medal, Sparkles, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StudentAvatar } from "@/components/student-avatar";
import { formatStudentFullName } from "@/lib/student-name";
import { getCourseLeaderboard } from "@/lib/leaderboard";

const PODIUM_STYLE: Record<
  number,
  { order: string; height: string; avatarSize: number; ring: string; medalColor: string; medalIcon: typeof Crown }
> = {
  1: { order: "order-2", height: "pb-10 pt-6", avatarSize: 112, ring: "ring-amber-400", medalColor: "text-amber-400", medalIcon: Crown },
  2: { order: "order-1", height: "pb-6 pt-10", avatarSize: 88, ring: "ring-slate-300", medalColor: "text-slate-300", medalIcon: Medal },
  3: { order: "order-3", height: "pb-6 pt-10", avatarSize: 88, ring: "ring-orange-400", medalColor: "text-orange-400", medalIcon: Medal },
};

export default async function LeaderboardDisplayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: courseId } = await params;

  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id, name, code")
    .eq("id", courseId)
    .single();

  if (!course) notFound();

  const leaderboard = await getCourseLeaderboard(courseId);
  const entries = leaderboard?.entries ?? [];
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const unit = leaderboard?.basis === "points" ? "แต้ม" : "%";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-8 text-white sm:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/teacher/leaderboard"
            className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับ
          </Link>
          <p className="text-xs text-slate-500">{course.code}</p>
        </div>

        <div className="mb-12 text-center">
          <p className="mb-1 flex items-center justify-center gap-2 text-sm font-medium text-amber-400">
            <Trophy className="h-4 w-4" />
            Leaderboard
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">{course.name}</h1>
        </div>

        {entries.length === 0 ? (
          <p className="py-20 text-center text-slate-400">วิชานี้ยังไม่มีข้อมูลคะแนน/อันดับ</p>
        ) : (
          <>
            {/* โพเดียม 3 อันดับแรก — อันดับ 1 อยู่กลางและสูงสุด */}
            <div className="mb-14 flex items-end justify-center gap-4 sm:gap-8">
              {top3.map((entry, index) => {
                const style = PODIUM_STYLE[entry.rank] ?? PODIUM_STYLE[3];
                const MedalIcon = style.medalIcon;

                return (
                  <div
                    key={entry.studentId}
                    className={`animate-podium-rise flex w-36 flex-col items-center sm:w-44 ${style.order}`}
                    style={{ animationDelay: `${index * 120}ms` }}
                  >
                    <div className="relative mb-3">
                      {entry.rank === 1 && (
                        <Sparkles className="animate-sparkle-pulse absolute -top-3 -right-3 h-5 w-5 text-amber-300" />
                      )}
                      <div className={`rounded-full ring-4 ${style.ring}`}>
                        <StudentAvatar name={entry.name} title={entry.title} size={style.avatarSize} />
                      </div>
                      <span
                        className={`absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-slate-900 p-1 ${style.medalColor}`}
                      >
                        <MedalIcon className="h-5 w-5" />
                      </span>
                    </div>
                    <p className="text-center text-sm font-semibold">
                      {formatStudentFullName(entry.title, entry.name)}
                    </p>
                    <p className="mb-2 text-xs text-slate-400">{entry.studentCode}</p>
                    <div
                      className={`flex w-full flex-col items-center justify-center rounded-t-2xl bg-white/5 ${style.height}`}
                    >
                      <p className="text-2xl font-bold text-amber-300">
                        {entry.score.toLocaleString("th-TH", { maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-slate-400">{unit}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {rest.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <div className="divide-y divide-white/10">
                  {rest.map((entry, index) => (
                    <div
                      key={entry.studentId}
                      className="animate-row-fade-in flex items-center gap-4 px-5 py-3"
                      style={{ animationDelay: `${index * 60}ms` }}
                    >
                      <span className="w-8 text-center font-bold text-slate-400">{entry.rank}</span>
                      <StudentAvatar name={entry.name} title={entry.title} size={32} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {formatStudentFullName(entry.title, entry.name)}
                        </p>
                        <p className="text-xs text-slate-500">{entry.studentCode}</p>
                      </div>
                      <p className="text-sm font-semibold text-amber-300">
                        {entry.score.toLocaleString("th-TH", { maximumFractionDigits: 2 })} {unit}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
