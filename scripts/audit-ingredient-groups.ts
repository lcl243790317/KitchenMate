import fs from "node:fs";
import { recipeSchema } from "../lib/model";
import {
  assertAtomicHowToCookIngredients,
  howToCookMaterialBullets,
  parseHowToCookIngredientBullet,
} from "../lib/howtocook-ingredient-parser";
import catalog from "../data/verified-recipes/howtocook/recipes.json";
import baseline from "../data/verified-recipes/howtocook/ingredient-parsing-baseline.json";
import manifest from "../data/verified-recipes/howtocook/manifest.json";
const recipes = recipeSchema.array().parse(catalog);
const grouped: {
  id: string;
  title: string;
  bullet: string;
  parts: { text: string; id: string; optional: boolean }[];
}[] = [];
const ambiguous: { recipeId: string; text: string; reason: string }[] = [];
let bullets = 0,
  violations = 0;
for (const recipe of recipes) {
  const record = manifest.find((m) => m.id === recipe.id)!;
  const source = fs.readFileSync(record.snapshotPath, "utf8");
  const lines = howToCookMaterialBullets(source);
  bullets += lines.length;
  try {
    assertAtomicHowToCookIngredients(recipe.ingredients);
    const expected = lines
      .flatMap(parseHowToCookIngredientBullet)
      .map((i) => recipeSchema.shape.ingredients.element.parse(i));
    if (JSON.stringify(expected) !== JSON.stringify(recipe.ingredients))
      throw Error("Catalog does not equal parser output");
  } catch (error) {
    console.error(recipe.id, error);
    violations++;
  }
  for (const bullet of lines) {
    const parts = parseHowToCookIngredientBullet(bullet);
    if (parts.length > 1)
      grouped.push({
        id: recipe.id,
        title: recipe.title,
        bullet,
        parts: parts.map((p) => ({
          text: p.originalText,
          id: p.ingredientId,
          optional: p.optional,
        })),
      });
    for (const p of parts)
      if (p.unresolvedReason && p.unresolvedReason !== "not in vocabulary")
        ambiguous.push({
          recipeId: recipe.id,
          text: p.originalText,
          reason: p.unresolvedReason,
        });
  }
}
const before = baseline.reduce((n, r) => n + r.ingredientCount, 0),
  after = recipes.reduce((n, r) => n + r.ingredients.length, 0);
const oldGrouped = baseline.reduce(
  (n, r) => n + r.groupedIngredientRows.length,
  0,
);
const examples = [
  ...new Set([
    ...[
      "新疆大盘鸡",
      "红烧鲤鱼",
      "红烧鱼头",
      "柱候牛腩",
      "猪皮冻",
      "南派红烧肉",
      "凉皮",
      "蒸卤面",
      "包菜炒鸡蛋粉丝",
      "番茄牛肉蛋花汤",
    ].map((title) => recipes.find((r) => r.title === title)!.id),
    ...grouped.map((g) => g.id),
  ]),
]
  .slice(0, 10)
  .map((id) => ({
    id,
    title: recipes.find((r) => r.id === id)!.title,
    before: baseline.find((r) => r.id === id)!.ingredientCount,
    after: recipes.find((r) => r.id === id)!.ingredients.length,
    bullets: grouped.filter((g) => g.id === id),
  }));
const report = {
  pinnedCommit: manifest[0].commit,
  recipesScanned: recipes.length,
  ingredientBulletsScanned: bullets,
  multiIngredientBullets: grouped.length,
  recipesWithGroupedBullets: new Set(grouped.map((g) => g.id)).size,
  ingredientRowsBefore: before,
  ingredientRowsAfter: after,
  oldGroupedRowsReplaced: oldGrouped,
  netIngredientRowsAdded: after - before,
  ambiguousLinesLeftUnresolved: ambiguous.length,
  unknownRows: recipes
    .flatMap((r) => r.ingredients)
    .filter((i) => i.ingredientId.startsWith("unknown:")).length,
  catalogRecipesExcluded: baseline.length - recipes.length,
  violations,
  examples,
  ambiguous,
};
fs.writeFileSync(
  "docs/INGREDIENT_PARSING_AUDIT.json",
  JSON.stringify(report, null, 2) + "\n",
);
const summary = `# Phase 3.1.1 Ingredient Parsing Audit\n\nPinned HowToCook commit: ${report.pinnedCommit}. Rebuilt from existing checksum-verified source snapshots; source titles, URLs, instructions, notes and verification timestamps are unchanged.\n\n| Metric | Count |\n| --- | ---: |\n| HowToCook recipes scanned | ${report.recipesScanned} |\n| Ingredient bullets scanned (including tool/note bullets) | ${bullets} |\n| Multi-ingredient food bullets detected | ${grouped.length} |\n| Recipes with grouped food bullets | ${report.recipesWithGroupedBullets} |\n| Stored ingredient rows before (not all atomic) | ${before} |\n| Atomic / unresolved ingredient rows after | ${after} |\n| Old grouped rows replaced | ${oldGrouped} |\n| Net ingredient rows added | ${after - before} |\n| Ambiguous parts left unresolved | ${ambiguous.length} |\n| Unknown rows, including names absent from vocabulary | ${report.unknownRows} |\n| Catalog recipes excluded | ${report.catalogRecipesExcluded} |\n| Atomic invariant violations | ${violations} |\n\nEach fragment retains verbatim originalText and sourceGroupText. Parentheses are not split; alternatives remain unresolved; unfamiliar named peppers stay unknown; explicit optional notes propagate to a conjunction or an unannotated comma-list group. Quantity is not inferred. Detailed unresolved parts are listed in the JSON report.\n\nBig scallion 大葱 uses the existing distinct ID zh:大葱; it is not silently changed to the generic scallion ID. Optional peppers remain visible as unowned in detail but are excluded from required-only matching and shopping calculations. Low-weight staples are unowned until selected.\n\n## Ten regression examples\n\n`;
fs.writeFileSync(
  "docs/INGREDIENT_PARSING_AUDIT.md",
  summary +
    examples
      .map(
        (example, i) =>
          `### ${i + 1}. ${example.title}\n\n${example.id}: ${example.before} → ${example.after} ingredient rows.\n\n` +
          example.bullets
            .map(
              (b) =>
                `- Source: ${b.bullet}\n- Atomic: ${b.parts.map((p) => `${p.text} [${p.id}${p.optional ? "; optional" : ""}]`).join(" / ")}\n`,
            )
            .join("\n"),
      )
      .join("\n") +
    "\nRun: pnpm recipes:audit-ingredient-groups. Any stored grouped row or divergence from deterministic source parsing fails validation.\n",
);
console.log(
  JSON.stringify(
    { ...report, examples: undefined, ambiguous: undefined },
    null,
    2,
  ),
);
if (violations) process.exitCode = 1;
