const PALETTE = [
  { dot: "bg-blue-500", text: "text-blue-600", bg: "bg-blue-50", ring: "border-blue-200" },
  { dot: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50", ring: "border-emerald-200" },
  { dot: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50", ring: "border-amber-200" },
  { dot: "bg-purple-500", text: "text-purple-600", bg: "bg-purple-50", ring: "border-purple-200" },
  { dot: "bg-pink-500", text: "text-pink-600", bg: "bg-pink-50", ring: "border-pink-200" },
  { dot: "bg-teal-500", text: "text-teal-600", bg: "bg-teal-50", ring: "border-teal-200" },
];

const DONUT_HEX = ["#3B82F6", "#10B981", "#F59E0B", "#A855F7", "#EC4899", "#14B8A6"];

export function categoryColor(index: number) {
  return PALETTE[index % PALETTE.length];
}

export function categoryHex(index: number) {
  return DONUT_HEX[index % DONUT_HEX.length];
}
