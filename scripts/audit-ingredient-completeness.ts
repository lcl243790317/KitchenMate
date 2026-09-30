import fs from "node:fs";
import { recipeSchema } from "../lib/model";
import {
  extractHowToCookIngredients,
  howToCookCompletenessViolations,
  operationOnlyIngredientCandidates,
} from "../lib/howtocook-ingredient-parser";
import catalog from "../data/verified-recipes/howtocook/recipes.json";
import manifest from "../data/verified-recipes/howtocook/manifest.json";
const recipes = recipeSchema.array().parse(catalog);
const details = recipes.map((recipe) => {
  const snapshot = manifest.find((entry) => entry.id === recipe.id)!;
  const source = fs.readFileSync(snapshot.snapshotPath, "utf8");
  const extracted = extractHowToCookIngredients(source);
  return {
    id: recipe.id,
    title: recipe.title,
    hasCalculation: extracted.hasCalculation,
    materialIngredientIdentities: [
      ...new Set(extracted.material.map((part) => part.ingredientId)),
    ],
    calculationIngredientIdentities: [
      ...new Set(extracted.calculation.map((part) => part.ingredientId)),
    ],
    calculationOnlyIngredientsAdded: extracted.calculationOnly,
    duplicateIdentitiesMerged: extracted.duplicatesMerged,
    unresolvedCalculationFragments: extracted.unresolvedCalculation,
    operationOnlyCandidates: operationOnlyIngredientCandidates(
      source,
      recipe.ingredients,
    ),
    completenessViolations: howToCookCompletenessViolations(
      source,
      recipe.ingredients,
    ),
    beforeIngredientCount: extracted.material.length,
    afterIngredientCount: recipe.ingredients.length,
  };
});
const sum = (get: (entry: (typeof details)[number]) => number) =>
  details.reduce((total, entry) => total + get(entry), 0);
const metrics = {
  pinnedCommit: manifest[0].commit,
  recipesScanned: recipes.length,
  recipesWithCalculationSections: details.filter(
    (entry) => entry.hasCalculation,
  ).length,
  materialIngredientIdentities: sum(
    (entry) => entry.materialIngredientIdentities.length,
  ),
  calculationIngredientIdentities: sum(
    (entry) => entry.calculationIngredientIdentities.length,
  ),
  recipesWithCalculationOnlyIngredients: details.filter(
    (entry) => entry.calculationOnlyIngredientsAdded.length,
  ).length,
  calculationOnlyIngredientsAdded: sum(
    (entry) => entry.calculationOnlyIngredientsAdded.length,
  ),
  duplicateIdentitiesMerged: sum((entry) => entry.duplicateIdentitiesMerged),
  ingredientRowsBefore: sum((entry) => entry.beforeIngredientCount),
  ingredientRowsAfter: sum((entry) => entry.afterIngredientCount),
  unresolvedCalculationFragments: sum(
    (entry) => entry.unresolvedCalculationFragments.length,
  ),
  operationOnlyCandidates: sum((entry) => entry.operationOnlyCandidates.length),
  completenessViolations: sum((entry) => entry.completenessViolations.length),
};
fs.writeFileSync(
  "docs/INGREDIENT_COMPLETENESS_AUDIT.json",
  JSON.stringify({ ...metrics, details }, null, 2) + "\n",
);
fs.writeFileSync(
  "docs/INGREDIENT_COMPLETENESS_AUDIT.md",
  `# Phase 3.1.2 Ingredient Completeness Audit\n\nSource: checksum-verified local HowToCook snapshots at pinned commit ${metrics.pinnedCommit}. No live source fetch.\n\n| Metric | Count |\n| --- | ---: |\n${Object.entries(
    metrics,
  )
    .filter(([key]) => key !== "pinnedCommit")
    .map(([key, value]) => `| ${key} | ${value} |`)
    .join(
      "\n",
    )}\n\nMaterial and calculation bullets are parsed atomically, then merged by canonical identity. Calculation wording and explicit scalar amounts enrich materials; separate calculation usages are retained without summing. Optional material status remains optional. Unresolved calculation fragments stay in source notes and the JSON report; ambiguous prose, alternatives and unknown identities are not silently promoted to requirements. A formula with an explicit ingredient head retains that identity with quantity=null. Operation candidates are report-only, including possible examples, substitutes and optional mentions. They are not completeness violations.\n\nValidation fails if a high-confidence calculation identity is absent from the final catalog. The separate Phase 3.1.1 atomic audit remains available.\n\n## 香菇滑鸡\n\n${JSON.stringify(
    details.find((entry) => entry.id === "howtocook:4f1a2679eb840431"),
    null,
    2,
  )}\n\nRun: pnpm recipes:audit-ingredient-completeness. Full per-recipe evidence, unresolved fragments and operation candidates: INGREDIENT_COMPLETENESS_AUDIT.json.\n`,
);
console.log(JSON.stringify(metrics, null, 2));
if (metrics.completenessViolations) process.exitCode = 1;
