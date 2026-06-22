import { Award, ShieldCheck, Zap } from "lucide-react";
import { Logo } from "@/components/logo";
import type { ReactNode } from "react";

const features = [
  {
    icon: ShieldCheck,
    title: "ปลอดภัย เชื่อถือได้",
    description: "ข้อมูลนักเรียนถูกเก็บอย่างปลอดภัย เข้าถึงได้เฉพาะครูเจ้าของวิชา",
  },
  {
    icon: Zap,
    title: "ใช้งานง่าย",
    description: "กรอกคะแนนได้รวดเร็วแบบสเปรดชีต ระบบคำนวณเกรดให้อัตโนมัติ",
  },
  {
    icon: Award,
    title: "ติดตามพัฒนาการ",
    description: "นักเรียนเช็คคะแนนของตัวเองได้ทุกที่ ไม่ต้องสมัครสมาชิก",
  },
];

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1">
      <aside className="relative hidden w-1/2 flex-col justify-center overflow-hidden bg-[var(--primary-dark)] px-12 py-16 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--primary)]/20 blur-3xl" />
        <div className="absolute -bottom-32 left-0 h-72 w-72 rounded-full bg-[var(--primary)]/10 blur-3xl" />

        <div className="relative z-10 mb-10">
          <Logo variant="light" />
        </div>

        <h2 className="relative z-10 mb-4 max-w-md text-3xl font-bold leading-tight">
          เพิ่มศักยภาพการสอน พัฒนานักเรียนได้ด้วยกัน
        </h2>
        <p className="relative z-10 mb-10 max-w-md text-white/70">
          เครื่องมือจัดการคะแนนและห้องเรียนที่ออกแบบมาให้ครูไทยใช้งานง่ายที่สุด
        </p>

        <ul className="relative z-10 flex max-w-md flex-col gap-6">
          {features.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                <Icon className="h-5 w-5 text-[var(--primary)]" strokeWidth={2.25} />
              </span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-white/70">{description}</p>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      <section className="flex w-full flex-col items-center justify-center bg-slate-50 px-6 py-16 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
