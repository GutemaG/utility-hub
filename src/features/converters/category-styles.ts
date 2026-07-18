const CATEGORY_STYLES: Record<string, string> = {
  metric: "bg-green-100 text-green-800",
  imperial: "bg-blue-100 text-blue-800",
  nautical: "bg-purple-100 text-purple-800",
  astronomical: "bg-orange-100 text-orange-800",
  scientific: "bg-purple-100 text-purple-800",
  historical: "bg-orange-100 text-orange-800",
  base: "bg-gray-100 text-gray-800",
  calendar: "bg-indigo-100 text-indigo-800",
  precision: "bg-cyan-100 text-cyan-800",
  binary: "bg-violet-100 text-violet-800",
  computer: "bg-slate-100 text-slate-800",
  jewelry: "bg-purple-100 text-purple-800",
  "north-america": "bg-blue-100 text-blue-800",
  europe: "bg-green-100 text-green-800",
  asia: "bg-red-100 text-red-800",
  oceania: "bg-teal-100 text-teal-800",
  "latin-america": "bg-yellow-100 text-yellow-800",
};

export function getCategoryStyle(category: string): string {
  return CATEGORY_STYLES[category] ?? "bg-gray-100 text-gray-800";
}

export const CATEGORY_LABEL_COLORS: Record<string, string> = {
  metric: "text-green-700",
  imperial: "text-blue-700",
  nautical: "text-purple-700",
  astronomical: "text-orange-700",
  scientific: "text-purple-700",
  historical: "text-orange-700",
};
