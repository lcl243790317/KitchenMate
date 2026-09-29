export function normalizeUnit(s: string) {
  const units: Record<string, string> = {
    克: "g",
    千克: "kg",
    公斤: "kg",
    毫升: "ml",
    升: "l",
    个: "个",
    颗: "个",
    grams: "g",
    gram: "g",
    tsp: "tsp",
    茶匙: "tsp",
    tbsp: "tbsp",
    汤匙: "tbsp",
    cups: "cup",
  };
  return units[s.trim().toLowerCase()] ?? s.trim().toLowerCase();
}
export function scaleQuantity(q: number | null, base: number, target: number) {
  if (q === null) return null;
  if (base <= 0 || target <= 0) throw new Error("Invalid servings");
  return Math.round(((q * target) / base) * 100) / 100;
}
export function parseAmount(text: string) {
  const normalized = text
    .replace(/½/g, " 1/2")
    .replace(/¼/g, " 1/4")
    .replace(/¾/g, " 3/4")
    .trim();
  const match = normalized.match(
    /^(?:(\d+)\s+)?(\d+(?:\.\d+)?)(?:\s*\/\s*(\d+))?\s*([^\d\s]*)/,
  );
  const candidate = match ? normalizeUnit(match[4]) : "";
  const unit = [
    "g",
    "kg",
    "ml",
    "l",
    "tsp",
    "tbsp",
    "cup",
    "oz",
    "lb",
    "个",
    "根",
    "瓣",
  ].includes(candidate)
    ? candidate
    : "";
  return {
    quantity: match
      ? Number(match[1] ?? 0) + Number(match[2]) / (Number(match[3]) || 1)
      : null,
    unit,
  };
}
