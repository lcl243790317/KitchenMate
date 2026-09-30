import fs from "node:fs";
import { createHash } from "node:crypto";
import { verifiedRecipes } from "../lib/verified-recipes";
import {
  canDisplayRecipe,
  canCookRecipe,
  normalizeSourceUrl,
} from "../lib/recipe-trust";
import manifest from "../data/verified-recipes/howtocook/manifest.json";
import {
  assertAtomicHowToCookIngredients,
  extractHowToCookIngredients,
  howToCookCompletenessViolations,
} from "../lib/howtocook-ingredient-parser";
import { recipeSchema } from "../lib/model";
const byId = new Map(manifest.map((m) => [m.id, m]));
const urls = new Set();
for (const recipe of verifiedRecipes) {
  if (!canDisplayRecipe(recipe)) throw new Error(`Unverified ${recipe.id}`);
  const url = normalizeSourceUrl(recipe.sourceUrl!);
  if (urls.has(url)) throw new Error(`Duplicate source ${url}`);
  urls.add(url);
  if (recipe.instructionAvailability === "full") {
    if (!canCookRecipe(recipe))
      throw new Error(`Invalid tutorial ${recipe.id}`);
    const record = byId.get(recipe.id);
    if (record) {
      assertAtomicHowToCookIngredients(recipe.ingredients);
      const source = fs.readFileSync(record.snapshotPath, "utf8");
      if (howToCookCompletenessViolations(source, recipe.ingredients).length)
        throw new Error(`Calculation ingredient omission in ${recipe.id}`);
      const expected = extractHowToCookIngredients(source).ingredients.map(
        (part) => recipeSchema.shape.ingredients.element.parse(part),
      );
      if (JSON.stringify(expected) !== JSON.stringify(recipe.ingredients))
        throw new Error(`Atomic source parsing mismatch in ${recipe.id}`);
      if (createHash("sha256").update(source).digest("hex") !== record.sha256)
        throw new Error("Snapshot checksum mismatch");
      for (const step of recipe.instructions)
        if (!source.includes(step.description))
          throw new Error(`Invented step in ${recipe.id}`);
      for (const item of recipe.ingredients)
        if (
          !source.includes(item.originalText) ||
          (item.sourceGroupText && !source.includes(item.sourceGroupText))
        )
          throw new Error(`Invented ingredient in ${recipe.id}`);
    }
  } else if (recipe.instructions.length)
    throw new Error("Source-only record has instructions");
}
console.log(
  `Validated ${verifiedRecipes.length} records, source identity, attribution and full instruction snapshot integrity.`,
);
