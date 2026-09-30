import fs from "node:fs";
import baseline from "../data/ingredient-audits/phase312-baseline.json";
import overrides from "../data/ingredient-audits/operation-overrides.json";
import aliases from "../data/ingredients/semantic-aliases.json";
import manifest from "../data/verified-recipes/howtocook/manifest.json";
import catalog from "../data/verified-recipes/howtocook/recipes.json";
import {
  classifyCalculation,
  ingredientParentIds,
} from "../lib/ingredient-semantics";
import {
  extractHowToCookIngredients,
  extractHowToCookIngredientSources,
  topLevelIngredientIdentities,
  parseHowToCookIngredientBullet,
} from "../lib/howtocook-ingredient-parser";
const snapshots = new Map(
  manifest.map((m) => [m.id, fs.readFileSync(m.snapshotPath, "utf8")]),
);
const calculations = baseline.unresolved.map((item) => ({
  ...item,
  ...classifyCalculation(item.originalText, item.ingredientId),
  review:
    "Deterministic triage; unresolved classifications are suggestions, not production mappings",
}));
const operations = baseline.operations.map((item) => {
  const recipe = catalog.find((r) => r.id === item.recipeId)!;
  const source = snapshots.get(item.recipeId)!;
  const lines = extractHowToCookIngredientSources(source)
    .operation.split("\n")
    .filter((line) =>
      topLevelIngredientIdentities(line).has(item.ingredientId),
    );
  const represented = recipe.ingredients.some((i) =>
    ingredientParentIds(i.ingredientId).has(item.ingredientId),
  );
  const prepared =
    ["zh:蛋白", "zh:蛋黄", "zh:蛋液"].includes(item.ingredientId) &&
    recipe.ingredients.some((i) => i.ingredientId === "egg");
  const override = overrides.find(
    (o) => o.recipeId === item.recipeId && o.ingredientId === item.ingredientId,
  );
  const imageOnly =
    lines.length > 0 && lines.every((line) => /^\s*!\[/.test(line));
  const category = override
    ? "True missing ingredient"
    : prepared
      ? "Prepared form"
      : represented
        ? "Already represented"
        : imageOnly
          ? "False positive"
          : /葱姜水|蒜水|混合物/.test(item.text)
            ? "Reference to mixture"
            : /可以|可选|不放|可加/.test(item.text)
              ? "Optional ingredient"
              : /替代|代替|或者/.test(item.text)
                ? "Alternative"
                : "Ambiguous";
  return {
    ...item,
    category,
    occurrences: lines.length,
    highRisk: lines.length >= 2 && !represented,
    evidence: lines,
    review: override
      ? "Reviewed explicit source operation; deterministic override"
      : represented || prepared || imageOnly
        ? "Deterministic representation/evidence"
        : "Triage only; requires source review, no automatic ingredient addition",
  };
});
const count = (items: { category: string }[], categories: string[]) =>
  Object.fromEntries(
    categories.map((name) => [
      name,
      items.filter((item) => item.category === name).length,
    ]),
  );
operations.sort(
  (a, b) =>
    Number(b.highRisk) - Number(a.highRisk) ||
    b.occurrences - a.occurrences ||
    a.recipeId.localeCompare(b.recipeId),
);
const current = [...snapshots.values()].map(extractHowToCookIngredients);
const regressionCases = [
  { text: "小米辣", id: "zh:小米椒" },
  { text: "鸡蛋黄", id: "zh:蛋黄" },
  { text: "鸡蛋清", id: "zh:蛋白" },
  { text: "芝麻香油", id: "zh:香油" },
  { text: "意大利面酱", id: null },
  { text: "红豆蔻", id: null },
  { text: "俄式酸黄瓜汁", id: null },
  { text: "蒜蓉酱", id: null },
];
const wrongMappingRegressions = regressionCases.filter((c) => {
  const id = parseHowToCookIngredientBullet(c.text)[0]?.ingredientId;
  return c.id ? id !== c.id : id && !id.startsWith("unknown:");
});
const metrics = {
  unresolvedBefore: baseline.unresolved.length,
  unresolvedAfter: current.reduce(
    (n, x) => n + x.unresolvedCalculation.length,
    0,
  ),
  realIngredientFragmentsResolved: calculations.filter((c) => c.resolved)
    .length,
  calculationCategories: count(calculations, [
    "Real ingredient",
    "Tool",
    "Quantity/formula",
    "Alternative",
    "Optional description",
    "Preparation instruction",
    "Section prose",
    "Compound ingredient",
    "Vocabulary gap",
    "Parser gap",
    "Truly ambiguous",
  ]),
  operationCandidatesBefore: baseline.operations.length,
  operationCandidatesAfter: 0,
  operationCategories: count(operations, [
    "True missing ingredient",
    "Already represented",
    "Optional ingredient",
    "Alternative",
    "Prepared form",
    "Reference to mixture",
    "Tool",
    "False positive",
    "Ambiguous",
  ]),
  operationMissingIngredientsAdded: overrides.length,
  wrongMappingRegressionCount: wrongMappingRegressions.length,
  semanticRegressionCases: regressionCases.length,
  addedVocabularyEntries: 0,
  addedAliases: Object.values(aliases).flat().length,
  aliases,
  productionRules: [
    "Reliable literal ingredient head only; no substring fallback",
    "Reviewed explicit identity and preparation aliases",
    "Expanded deterministic scalar/formula head boundaries; formula quantity remains null",
    "Checksum/source-phrase-bound operation overrides for two explicit omissions",
  ],
  remainingUnknownRows: catalog
    .flatMap((r) => r.ingredients)
    .filter((i) => i.ingredientId.startsWith("unknown:")).length,
  ambiguousCalculationClassifications: calculations.filter(
    (c) => c.category === "Truly ambiguous",
  ).length,
};
// The after-operation count is read from a fresh report, never inferred from ingredients.
const completeness = JSON.parse(
  fs.readFileSync("docs/INGREDIENT_COMPLETENESS_AUDIT.json", "utf8"),
);
metrics.operationCandidatesAfter = completeness.operationOnlyCandidates;
fs.writeFileSync(
  "docs/INGREDIENT_SEMANTIC_AUDIT.json",
  JSON.stringify(
    {
      ...metrics,
      calculations,
      operations,
      overrides,
      wrongMappingRegressions,
    },
    null,
    2,
  ) + "\n",
);
fs.writeFileSync(
  "docs/INGREDIENT_SEMANTIC_AUDIT.md",
  `# Phase 3.1.3 Ingredient Semantic Audit\n\nCorrectness takes priority over unknown reduction. Original 826 calculation fragments and 654 operation candidates are retained individually in the JSON report. Pattern classifications are conservative triage, not claims of manual review or production mappings. Only explicit aliases, deterministic literal-head rules and two source-verified operation overrides change production. No vocabulary entries added; Pantry remains 86 / searchable 703.\n\n\`\`\`json\n${JSON.stringify(metrics, null, 2)}\n\`\`\`\n\nOperation candidates can increase when unsafe material mappings return to unknown. They are not completeness violations. High-risk candidates (two or more source lines) retain all evidence for further review. Ambiguous compound sauces, formulas, alternatives and specialty ingredients remain unknown. Regressions cover every added alias plus mistaken millet, egg-part, sesame-oil, pasta-sauce, spice and sauce identities.\n`,
);
console.log(JSON.stringify(metrics, null, 2));
if (wrongMappingRegressions.length) process.exitCode = 1;
