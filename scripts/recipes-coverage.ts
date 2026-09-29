import fs from "node:fs";
import { verifiedRecipes } from "../lib/verified-recipes";
import { ingredients, ingredientById } from "../lib/ingredients";
const covered = new Set(
  verifiedRecipes
    .flatMap((r) => r.ingredients.map((i) => i.ingredientId))
    .filter((id) => ingredientById.has(id)),
);
const uncovered = ingredients.filter((i) => !covered.has(i.id));
const categories = [...new Set(ingredients.map((i) => i.category))].map(
  (category) => ({
    category,
    total: ingredients.filter((i) => i.category === category).length,
    covered: ingredients.filter(
      (i) => i.category === category && covered.has(i.id),
    ).length,
  }),
);
const distribution = Object.fromEntries(
  [...new Set(verifiedRecipes.map((r) => r.sourceName))].map((name) => [
    name,
    verifiedRecipes.filter((r) => r.sourceName === name).length,
  ]),
);
const report = {
  generatedAt: new Date().toISOString(),
  totalIngredients: ingredients.length,
  covered: covered.size,
  uncovered: uncovered.length,
  englishNames: ingredients.filter((i) => i.displayNameEn).length,
  withAliases: ingredients.filter((i) => i.aliases.length).length,
  parentRelations: ingredients.filter((i) => i.parentIngredientId).length,
  sourceDistribution: distribution,
  categories,
  top30UncoveredCommon: uncovered.slice(0, 30).map((i) => i.displayNameZh),
  allUncovered: uncovered.map((i) => i.displayNameZh),
};
fs.writeFileSync("docs/RECIPE_COVERAGE.json", JSON.stringify(report, null, 2));
fs.writeFileSync(
  "docs/RECIPE_COVERAGE.md",
  `# Verified ingredient coverage\n\n${report.totalIngredients} ingredients; ${report.covered} covered; ${report.uncovered} uncovered. Exact ingredient identities only, no parent inflation.\n\n${report.englishNames} English names; ${report.withAliases} with aliases; ${report.parentRelations} parent relations.\n\nTop 30 uncovered (curated catalog order, not usage analytics): ${report.top30UncoveredCommon.join("、")}\n\n|Category|Covered|Total|\n|---|---:|---:|\n${categories.map((c) => `|${c.category}|${c.covered}|${c.total}|`).join("\n")}\n\nSources: ${JSON.stringify(distribution)}\n\nAll uncovered: ${report.allUncovered.join("、")}\n`,
);
console.log(
  JSON.stringify(
    { ...report, allUncovered: undefined, categories: undefined },
    null,
    2,
  ),
);
