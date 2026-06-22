import { FileText, GraduationCap, Landmark, NotebookPen } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ไอคอนของหมวดหมู่คะแนน วนซ้ำตามลำดับ index เดียวกับ categoryColor() เพื่อให้สีกับไอคอนตรงกันทุกหน้า (ครู/นักเรียน)
export const CATEGORY_ICONS: LucideIcon[] = [FileText, NotebookPen, GraduationCap, Landmark];
