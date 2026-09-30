import artifacts from "@/data/recipe-translations/zh.json";
import type { Recipe } from "./model";
export type RecipeLanguage = "zh" | "en";
export type RecipeTranslation = {
  recipeId: string;
  sourceRevision: string;
  sourceInstructionSha256: string;
  translationMethod: "reviewed-development-translation";
  licenseName: string;
  steps: {
    stepNumber: number;
    description: string;
    sourceDescription: string;
  }[];
};
export function numericTokens(text: string) {
  return text.match(/\d+(?:[./]\d+)*|[¼½¾⅛⅓⅔⅜⅝⅞]/g) ?? [];
}
export function temperatureTokens(text: string) {
  return (text.match(/\d+(?:\.\d+)?\s*[°˚]?\s*[FC]\b/g) ?? []).map((t) =>
    t.replace(/\s/g, "").replace("˚", "°"),
  );
}
export function timeTokens(text: string) {
  return [
    ...text.matchAll(
      /(\d+(?:[–-]\d+)?)\s*(seconds?|secs?|minutes?|mins?|hours?|days?|秒|分钟|小時|小时|天)/gi,
    ),
  ].map(
    (m) =>
      m[1] +
      ":" +
      (/^(s|秒)/i.test(m[2])
        ? "second"
        : /^(m|分钟)/i.test(m[2])
          ? "minute"
          : /^(h|小|时)/i.test(m[2])
            ? "hour"
            : "day"),
  );
}
export function measureTokens(text: string) {
  const aliases: Record<string, string> = {
    cup: "cup",
    cups: "cup",
    杯: "cup",
    tbsp: "tablespoon",
    tablespoon: "tablespoon",
    tablespoons: "tablespoon",
    汤匙: "tablespoon",
    tsp: "teaspoon",
    teaspoon: "teaspoon",
    teaspoons: "teaspoon",
    茶匙: "teaspoon",
    盎司: "oz",
    磅: "lb",
    厘米: "cm",
    英寸: "in",
    升: "l",
    毫升: "ml",
    克: "g",
  };
  return [
    ...text.matchAll(
      /(?:\d+(?:[./]\d+)*|[¼½¾⅛⅓⅔⅜⅝⅞])\s*(cups?|tbsp|tablespoons?|tsp|teaspoons?|ml|kg|oz|lb|cm|in|g|l|杯|汤匙|茶匙|盎司|磅|厘米|英寸|毫升|克|升)(?![a-z])/gi,
    ),
  ].map((m) => aliases[m[1].toLowerCase()] ?? m[1].toLowerCase());
}
export function translationFidelityErrors(
  recipe: Recipe,
  translation: RecipeTranslation,
) {
  const errors: string[] = [];
  if (
    translation.recipeId !== recipe.id ||
    translation.sourceRevision !== recipe.provenance.sourceRevision
  )
    errors.push("source identity/revision");
  if (translation.steps.length !== recipe.instructions.length)
    errors.push("step count");
  for (const [index, step] of recipe.instructions.entries()) {
    const local = translation.steps[index];
    if (
      !local ||
      local.stepNumber !== step.stepNumber ||
      !local.description.trim()
    ) {
      errors.push("step number/content");
      continue;
    }
    if (local.sourceDescription !== step.description)
      errors.push(`original text step ${step.stepNumber}`);
    for (const [label, tokenize] of [
      ["numeric", numericTokens],
      ["temperature", temperatureTokens],
      ["time", timeTokens],
      ["unit", measureTokens],
    ] as const)
      if (
        JSON.stringify(tokenize(step.description)) !==
        JSON.stringify(tokenize(local.description))
      )
        errors.push(`${label} step ${step.stepNumber}`);
    for (const [english, chinese] of [
      ["butter", "黄油"],
      ["chicken", "鸡"],
      ["pork", "猪"],
      ["salmon", "三文鱼"],
      ["egg", "蛋"],
    ])
      if (
        new RegExp(`\\b${english}s?\\b`, "i").test(step.description) &&
        !local.description.includes(chinese)
      )
        errors.push(
          `ingredient translation ${english} step ${step.stepNumber}`,
        );
  }
  return errors;
}
const translations = new Map(
  (artifacts as RecipeTranslation[]).map((t) => [t.recipeId, t]),
);
export function recipeTranslation(recipe: Recipe) {
  const translation = translations.get(recipe.id);
  return translation && !translationFidelityErrors(recipe, translation).length
    ? translation
    : undefined;
}
export function localizedInstructions(
  recipe: Recipe,
  language: RecipeLanguage,
) {
  const translation = language === "zh" ? recipeTranslation(recipe) : undefined;
  return translation
    ? recipe.instructions.map((step, index) => ({
        ...step,
        title: `步骤 ${step.stepNumber}`,
        description: translation.steps[index].description,
      }))
    : recipe.instructions;
}
