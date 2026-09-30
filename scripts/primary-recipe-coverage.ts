import fs from "node:fs";
import { verifiedRecipes } from "../lib/verified-recipes";
import { pantryPrimary, pantryCommonIds } from "../lib/pantry-selection";
import { beginnerSignals } from "../lib/beginner-recipes";
const details = pantryPrimary.map((ingredient) => {
  // Exact identity counts, never inflate coverage using substitutions or parent matches.
  const recipes = verifiedRecipes.filter((recipe) =>
    recipe.ingredients.some((item) => item.ingredientId === ingredient.id),
  );
  return {
    ingredientId: ingredient.id,
    ingredient: ingredient.displayNameZh,
    fullRecipeCount: recipes.filter((r) => r.instructionAvailability === "full")
      .length,
    sourceLinkedCount: recipes.filter(
      (r) => r.instructionAvailability === "source-only",
    ).length,
    beginnerRecipeCount: recipes.filter(
      (r) => beginnerSignals(r).beginnerFriendly,
    ).length,
    beginnerFullCount: recipes.filter(
      (r) =>
        r.instructionAvailability === "full" &&
        beginnerSignals(r).beginnerFriendly,
    ).length,
    quickFullCount: recipes.filter(
      (r) =>
        r.instructionAvailability === "full" &&
        r.totalTime !== null &&
        r.totalTime <= 30,
    ).length,
    quickRecipeCount: recipes.filter(
      (r) => r.totalTime !== null && r.totalTime <= 30,
    ).length,
  };
});
const metrics = {
  formalRecipes: verifiedRecipes.length,
  fullTutorials: verifiedRecipes.filter(
    (r) => r.instructionAvailability === "full",
  ).length,
  sourceLinked: verifiedRecipes.filter(
    (r) => r.instructionAvailability === "source-only",
  ).length,
  beginnerFriendly: verifiedRecipes.filter(
    (r) => beginnerSignals(r).beginnerFriendly,
  ).length,
  within30Minutes: verifiedRecipes.filter(
    (r) => r.totalTime !== null && r.totalTime <= 30,
  ).length,
  atMost8NonStapleIngredients: verifiedRecipes.filter(
    (r) => beginnerSignals(r).nonStapleIngredientCount <= 8,
  ).length,
  primaryIngredients: details.length,
  coveredBy1Full: details.filter((i) => i.fullRecipeCount >= 1).length,
  coveredBy3Full: details.filter((i) => i.fullRecipeCount >= 3).length,
  coveredBy5Full: details.filter((i) => i.fullRecipeCount >= 5).length,
  coveredBy10Full: details.filter((i) => i.fullRecipeCount >= 10).length,
  sourceDistribution: Object.fromEntries(
    [...new Set(verifiedRecipes.map((r) => r.sourceProvider))].map((p) => [
      p,
      verifiedRecipes.filter((r) => r.sourceProvider === p).length,
    ]),
  ),
  primaryBeginnerBy1Full: details.filter((i) => i.beginnerFullCount >= 1)
    .length,
  primaryBeginnerBy3Full: details.filter((i) => i.beginnerFullCount >= 3)
    .length,
  primaryBeginnerBy5Full: details.filter((i) => i.beginnerFullCount >= 5)
    .length,
  common24BeginnerBy1Full: details.filter(
    (i) => pantryCommonIds.has(i.ingredientId) && i.beginnerFullCount >= 1,
  ).length,
  common24BeginnerBy3Full: details.filter(
    (i) => pantryCommonIds.has(i.ingredientId) && i.beginnerFullCount >= 3,
  ).length,
  common24BeginnerBy5Full: details.filter(
    (i) => pantryCommonIds.has(i.ingredientId) && i.beginnerFullCount >= 5,
  ).length,
};
const weakest = [...details]
  .sort(
    (a, b) =>
      a.fullRecipeCount - b.fullRecipeCount ||
      a.beginnerFullCount - b.beginnerFullCount ||
      a.ingredient.localeCompare(b.ingredient, "zh-CN"),
  )
  .slice(0, 20);
fs.writeFileSync(
  "docs/PRIMARY_PANTRY_COVERAGE.json",
  JSON.stringify({ ...metrics, details, weakest }, null, 2) + "\n",
);
fs.writeFileSync(
  "docs/PRIMARY_PANTRY_COVERAGE.md",
  `# Primary Pantry Recipe Coverage\n\nExact identities only. Unknowns, substitutions and parent inflation are excluded. Missing time is not counted as quick. <=8 non-staple ingredients alone does not confer a beginner label.\n\n\`\`\`json\n${JSON.stringify(metrics, null, 2)}\n\`\`\`\n\n| Ingredient | Full | Original source link | Beginner Full | Quick Full <=30min |\n|---|---:|---:|---:|---:|\n${details.map((i) => `|${i.ingredient}|${i.fullRecipeCount}|${i.sourceLinkedCount}|${i.beginnerFullCount}|${i.quickFullCount}|`).join("\n")}\n\nNext expansion priority: ${weakest.map((i) => `${i.ingredient} (${i.fullRecipeCount} full)`).join("、")}.\n`,
);
console.log(JSON.stringify({ ...metrics, weakest }, null, 2));
