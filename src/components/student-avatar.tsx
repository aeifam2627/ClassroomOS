import Image from "next/image";
import { User } from "lucide-react";
import { genderFromTitle } from "@/lib/gender";

export function StudentAvatar({
  name,
  title,
  size = 28,
}: {
  name: string;
  title?: string | null;
  size?: number;
}) {
  const gender = genderFromTitle(title);

  if (gender === "male" || gender === "female") {
    return (
      <Image
        src={gender === "male" ? "/avatars/boy.png" : "/avatars/girl.png"}
        alt={name}
        title={name}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <span
      title={name}
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500"
    >
      <User className="h-1/2 w-1/2" strokeWidth={2.25} />
    </span>
  );
}
