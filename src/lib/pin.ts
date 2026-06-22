import { randomInt } from "crypto";

export function generatePin(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}
