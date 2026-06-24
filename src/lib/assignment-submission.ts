export const ASSIGNMENT_SUBMISSIONS_BUCKET = "assignment-submissions";
export const MAX_SUBMISSION_FILE_SIZE = 15 * 1024 * 1024; // 15MB

export const ALLOWED_SUBMISSION_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".jpg",
  ".jpeg",
  ".png",
  ".zip",
];

export function getFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex === -1 ? "" : fileName.slice(dotIndex).toLowerCase();
}

export function isAllowedSubmissionFile(file: File): { ok: true } | { ok: false; error: string } {
  if (file.size === 0) return { ok: false, error: "กรุณาเลือกไฟล์ที่จะส่ง" };
  if (file.size > MAX_SUBMISSION_FILE_SIZE) {
    return { ok: false, error: `ไฟล์ใหญ่เกินไป (จำกัดไม่เกิน ${MAX_SUBMISSION_FILE_SIZE / 1024 / 1024}MB)` };
  }
  const ext = getFileExtension(file.name);
  if (!ALLOWED_SUBMISSION_EXTENSIONS.includes(ext)) {
    return {
      ok: false,
      error: `ไม่รองรับไฟล์ประเภทนี้ (รองรับ: ${ALLOWED_SUBMISSION_EXTENSIONS.join(" ")})`,
    };
  }
  return { ok: true };
}

// กัน path ผิดรูปแบบ/อักขระแปลกๆ จากชื่อไฟล์จริงของผู้ใช้ — เก็บแค่ตัวอักษร/ตัวเลข/จุด/ขีดกลาง-ขีดล่าง ที่เหลือแทนด้วย "_"
function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

export function buildSubmissionPath({
  ownerId,
  courseId,
  itemId,
  studentId,
  fileName,
}: {
  ownerId: string;
  courseId: string;
  itemId: string;
  studentId: string;
  fileName: string;
}): string {
  return `${ownerId}/${courseId}/${itemId}/${studentId}/${Date.now()}-${sanitizeFileName(fileName)}`;
}

export function isLateSubmission(submittedAt: string, dueAt: string | null): boolean {
  if (!dueAt) return false;
  return new Date(submittedAt) > new Date(dueAt);
}
