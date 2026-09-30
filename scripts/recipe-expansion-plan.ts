import fs from "node:fs";
import before from "../data/recipe-candidates/phase314-baseline-coverage.json";
import { pantryCommonIds } from "../lib/pantry-selection";
type Coverage = {
  ingredientId: string;
  ingredient: string;
  fullRecipeCount: number;
  beginnerFullCount: number;
  quickFullCount: number;
  sourceLinkedCount: number;
};
const after = JSON.parse(
  fs.readFileSync("docs/PRIMARY_PANTRY_COVERAGE.json", "utf8"),
);
const planner = (after.details as Coverage[])
  .map((item) => ({
    ...item,
    // Developer-only prioritization: source quality gates remain mandatory.
    priorityScore:
      (item.fullRecipeCount === 0
        ? 100
        : Math.max(0, 5 - item.fullRecipeCount) * 12) +
      Math.max(0, 3 - item.beginnerFullCount) * 8 +
      Math.max(0, 2 - item.quickFullCount) * 4 +
      (pantryCommonIds.has(item.ingredientId) ? 10 : 0),
    before: before.details.find((i) => i.ingredientId === item.ingredientId),
  }))
  .sort(
    (a, b) =>
      b.priorityScore - a.priorityScore ||
      a.ingredient.localeCompare(b.ingredient, "zh-CN"),
  );
fs.writeFileSync(
  "docs/RECIPE_EXPANSION_PLAN.json",
  JSON.stringify(
    {
      baselineCommit: before.commit,
      rule: "Exact identities only; score is internal. Never infer a specific child from a generic ingredient.",
      planner,
    },
    null,
    2,
  ) + "\n",
);
fs.writeFileSync(
  "docs/RECIPE_EXPANSION_PLAN.md",
  `# Targeted Primary Coverage — Phase 3.1.4\n\nBaseline ${before.commit}. Internal score = zero-full priority (100), remaining-to-five full (12 each), remaining-to-three beginner full (8 each), remaining-to-two quick full (4 each), common-24 priority (10). Source/license/identity gates take precedence; never shown in product UI.\n\n| Ingredient | Full before → after | Beginner Full before → after | Quick Full | Source-linked | Internal priority |\n|---|---:|---:|---:|---:|---:|\n${planner.map((i) => `|${i.ingredient}|${i.before?.fullRecipeCount ?? 0} → ${i.fullRecipeCount}|${i.before?.beginnerFullCount ?? 0} → ${i.beginnerFullCount}|${i.quickFullCount}|${i.sourceLinkedCount}|${i.priorityScore}|`).join("\n")}\n\nRemaining zero Full: ${
    planner
      .filter((i) => i.fullRecipeCount === 0)
      .map((i) => i.ingredient)
      .join("、") || "none"
  }. This release does not claim that all five initial zero-coverage targets were fulfilled.\n`,
);
console.log(
  `Expansion planner: ${planner.length} Primary identities; ${planner.filter((i) => i.fullRecipeCount === 0).length} remaining zero-Full gaps.`,
);
