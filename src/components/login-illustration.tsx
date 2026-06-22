import Image from "next/image";
import { GraduationCap } from "lucide-react";

/**
 * placeholder วงกลมแทนภาพประกอบครูจริง (ตาม ui_design/01_teacher_login.png)
 * รอผู้ใช้หารูปจริงมาใส่ — ตอนนั้นแค่ส่ง prop `src` เข้ามา ไม่ต้องแก้ markup ส่วนอื่น
 */
export function LoginIllustration({ src }: { src?: string }) {
  return (
    <div className="relative mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] shadow-md">
      {src ? (
        <Image src={src} alt="ครูผู้สอน" fill className="object-cover" />
      ) : (
        <GraduationCap className="h-12 w-12 text-white" strokeWidth={1.75} />
      )}
    </div>
  );
}
