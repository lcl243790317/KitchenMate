import { parseWikiIngredient } from "./wikibooks-parser";
import { recipeIngredientSchema } from "./model";

/** Dedicated Markdown source parser. No inferred measures, substitutions or generated instructions. */
export function parseBasedCooking(
  markdown: string,
  operations: unknown[] = [],
) {
  const front = markdown.match(/^---\n([^]*?)\n---\n/)?.[1];
  const material = markdown.match(
    /^## Ingredients\s*\n([^]*?)(?=^## |$(?![^]))/m,
  )?.[1];
  const procedure = markdown.match(
    /^## Directions\s*\n([^]*?)(?=^## |$(?![^]))/m,
  )?.[1];
  if (!front || !material || !procedure)
    throw Error("Explicit metadata, Ingredients and Directions required");
  const field = (name: string) =>
    front
      .match(new RegExp(`^${name}:\\s*(.+)$`, "m"))?.[1]
      .replace(/^["']|["']$/g, "");
  const title = field("title");
  if (!title) throw Error("Source title required");
  const lines = material.split("\n").filter((l) => l.trim());
  if (lines.some((l) => !/^- /.test(l)))
    throw Error("Nested ingredients require review");
  const equipment: string[] = [];
  const ingredients = lines.flatMap((line) => {
    const text = line.slice(2).trim();
    if (/^Alumin(?:um|ium) Foil$/i.test(text)) {
      equipment.push("铝箔");
      return [];
    }
    if (/^salt and pepper(?: to taste|, to taste)?$/i.test(text))
      return ["salt", "black pepper"].map((head) => ({
        ...parseWikiIngredient(head, false),
        originalText: text,
        sourceGroupText: text,
      }));
    return [parseWikiIngredient(text, /optional/i.test(text))];
  });
  const numbered = [
    ...procedure.matchAll(/^\d+\.\s+([^]*?)(?=^\d+\.\s|$(?![^]))/gm),
  ];
  if (!numbered.length || !/^\s*1\./.test(procedure))
    throw Error("Complete numbered directions required");
  const descriptions = numbered.map((m) => m[1].trim());
  for (const usage of operations) {
    const item = recipeIngredientSchema.parse(usage);
    if (
      item.verificationMethod !== "source-operation-explicit" ||
      !procedure.includes(item.originalText)
    )
      throw Error("Operation ingredient must bind to exact source phrase");
    if (!ingredients.some((i) => i.ingredientId === item.ingredientId))
      ingredients.push(item);
  }
  for (const [pattern, label] of [
    [/\boven\b|\bBake at\b/i, "烤箱"],
    [/air fryer/i, "空气炸锅"],
    [/food processor/i, "料理机"],
    [/\bblender\b/i, "搅拌机"],
  ] as const)
    if (pattern.test(procedure)) equipment.push(label);
  const time = (label: string) => {
    const value = markdown.match(
      new RegExp(`${label} time:\\s*(\\d+)\\s*(min(?:ute)?s?)\\s*$`, "mi"),
    );
    return value ? Number(value[1]) : null;
  };
  const prepTime = time("Prep"),
    cookTime = time("Cook");
  return {
    title,
    author: field("author") ?? "Based Cooking contributors",
    ingredients,
    descriptions,
    equipment: [...new Set(equipment)],
    prepTime,
    cookTime,
    // Exact arithmetic of two explicit durations, labeled as a derived sum in source notes.
    totalTime:
      prepTime !== null && cookTime !== null ? prepTime + cookTime : null,
    sourceDifficulty: /tags:.*['"]easy['"]/.test(front)
      ? "Easy"
      : /\bSimple method\b/.test(markdown.split("##")[0])
        ? "simple"
        : undefined,
    servings:
      Number(markdown.match(/Servings:\s*(\d+)\s*(?:people)?\s*$/m)?.[1]) || 1,
    servingsEstimated: !/Servings:\s*\d+\s*(?:people)?\s*$/m.test(markdown),
    sourceNotes:
      markdown
        .split("## Ingredients")[0]
        .replace(/^---\n[^]*?\n---\n/, "")
        .trim() +
      "\n\n" +
      (prepTime !== null && cookTime !== null
        ? "KitchenMate 总时间：来源明确列出的准备时间 + 烹饪时间；未补算其他时间。"
        : "来源未明确给出可计算的总时间。"),
  };
}
