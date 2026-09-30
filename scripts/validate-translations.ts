import fs from "node:fs";
import { createHash } from "node:crypto";
import { verifiedRecipes } from "../lib/verified-recipes";
import {
  translationFidelityErrors,
  type RecipeTranslation,
} from "../lib/recipe-localization";
export function validateTranslations() {
  const translations = JSON.parse(
    fs.readFileSync("data/recipe-translations/zh.json", "utf8"),
  ) as RecipeTranslation[];
  const ids = new Set<string>();
  for (const translation of translations) {
    const recipe = verifiedRecipes.find((r) => r.id === translation.recipeId);
    if (!recipe || ids.has(translation.recipeId))
      throw Error("Missing/duplicate translation source");
    ids.add(translation.recipeId);
    const hash = createHash("sha256")
      .update(JSON.stringify(recipe.instructions.map((s) => s.description)))
      .digest("hex");
    if (
      hash !== translation.sourceInstructionSha256 ||
      translation.translationMethod !== "reviewed-development-translation" ||
      translation.licenseName !== recipe.provenance.licenseName
    )
      throw Error("Translation source binding/license mismatch");
    const errors = translationFidelityErrors(recipe, translation);
    if (errors.length) throw Error(`${recipe.title}: ${errors.join(", ")}`);
  }
  for (const recipe of verifiedRecipes.filter(
    (r) =>
      r.sourceProvider === "wikibooks" &&
      new URL(r.sourceUrl!).hostname === "en.wikibooks.org",
  ))
    if (!ids.has(recipe.id))
      throw Error(`Missing Chinese instructions: ${recipe.id}`);
  console.log(
    `Validated ${translations.length} Chinese translations: revision, original SHA, steps, numeric, temperature, time and food identity checks passed.`,
  );
  return translations.length;
}
validateTranslations();
