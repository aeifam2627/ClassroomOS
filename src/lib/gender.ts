export type InferredGender = "male" | "female" | "unknown";

const MALE_TITLES = new Set(["เด็กชาย", "นาย"]);
const FEMALE_TITLES = new Set(["เด็กหญิง", "นาง", "นางสาว"]);

export function genderFromTitle(title: string | null | undefined): InferredGender {
  if (!title) return "unknown";
  if (MALE_TITLES.has(title)) return "male";
  if (FEMALE_TITLES.has(title)) return "female";
  return "unknown";
}
