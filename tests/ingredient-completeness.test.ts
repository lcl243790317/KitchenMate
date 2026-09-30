import { describe, expect, it } from "vitest";
import fs from "node:fs";
import {
  extractHowToCookIngredients,
  explicitHowToCookQuantity,
  howToCookCompletenessViolations,
  operationOnlyIngredientCandidates,
} from "../lib/howtocook-ingredient-parser";
import { verifiedRecipes } from "../lib/verified-recipes";
import { makePantryItem, normalizeIngredient } from "../lib/ingredients";
import { matchRecipe } from "../lib/matching";
import manifest from "../data/verified-recipes/howtocook/manifest.json";
const mushroom = verifiedRecipes.find(
  (recipe) => recipe.id === "howtocook:4f1a2679eb840431",
)!;
const snapshot = fs.readFileSync(
  manifest.find((entry) => entry.id === mushroom.id)!.snapshotPath,
  "utf8",
);
const source = (calculation: string) =>
  `# 示例\n\n## 必备原料和工具\n\n- 蒜\n- 生抽\n\n## 计算\n\n${calculation}\n\n## 操作\n\n- 加入料酒 15ml\n`;
describe("complete source ingredients", () => {
  it("mushroom chicken has all twelve actual source ingredients and exact quantities", () => {
    expect(mushroom.ingredients.map((part) => part.ingredientId)).toEqual([
      "chicken-thigh",
      "zh:干香菇",
      "ginger",
      "scallion",
      "garlic",
      "water",
      "wine",
      "soy-sauce",
      "salt",
      "dark-soy",
      "sugar",
      "zh:香油",
    ]);
    expect(
      mushroom.ingredients.map((part) => [part.quantity, part.unit]),
    ).toEqual([
      [2, "个"],
      [5, "粒"],
      [2, "片"],
      [2, "颗"],
      [2, "瓣"],
      [150, "ml"],
      [15, "ml"],
      [30, "ml"],
      [1.5, "g"],
      [15, "ml"],
      [15, "ml"],
      [5, "ml"],
    ]);
    expect(normalizeIngredient("温水")?.id).toBe("water");
    expect(normalizeIngredient("香油")?.id).toBe("zh:香油");
  });
  it("five selected actual ingredients own only those five; soy sauce changes only soy sauce", () => {
    const ids = ["chicken-thigh", "zh:干香菇", "ginger", "scallion", "garlic"];
    const before = matchRecipe(mushroom, ids.map(makePantryItem));
    expect(before.available.map((part) => part.ingredientId)).toEqual(ids);
    expect(before.missing.map((part) => part.ingredientId)).toEqual([
      "water",
      "wine",
      "soy-sauce",
      "salt",
      "dark-soy",
      "sugar",
      "zh:香油",
    ]);
    const after = matchRecipe(
      mushroom,
      [...ids, "soy-sauce"].map(makePantryItem),
    );
    expect(after.available.map((part) => part.ingredientId)).toEqual([
      ...ids,
      "soy-sauce",
    ]);
    expect(after.missing.map((part) => part.ingredientId)).toEqual(
      before.missing
        .filter((part) => part.ingredientId !== "soy-sauce")
        .map((part) => part.ingredientId),
    );
  });
  it("enriches materials while preserving separate calculation usages without summing", () => {
    const result = extractHowToCookIngredients(
      source(
        "- 蒜 2 瓣\n- 生抽 15ml（腌制）\n- 生抽 30ml（调汁）\n- 料酒 15ml",
      ),
    );
    expect(
      result.ingredients.map((part) => [part.ingredientId, part.quantity]),
    ).toEqual([
      ["garlic", 2],
      ["soy-sauce", 15],
      ["soy-sauce", 30],
      ["wine", 15],
    ]);
    expect(result.duplicatesMerged).toBe(2);
  });
  it("formula quantities stay null while literal ingredient identity remains included", () => {
    const result = extractHowToCookIngredients(
      source("- 盐量 = 猪肉斤数 * 6 克\n- 糖 1-2g"),
    );
    expect(
      result.calculation.map((part) => [part.ingredientId, part.quantity]),
    ).toEqual([
      ["salt", null],
      ["sugar", null],
    ]);
  });
  it.each([
    "牛奶 50*2g",
    "盐 1-2g",
    "盐 2g/人",
    "盐量 = 份数 * 5 克",
    "土豆 2 个适中大小：750g",
  ])("does not invent quantities: %s", (text) => {
    expect(explicitHowToCookQuantity(text).quantity).toBeNull();
  });
  it("material optionality survives calculation enrichment", () => {
    const result = extractHowToCookIngredients(
      source("- 生抽 15ml").replace("- 生抽\n", "- 生抽（可选）\n"),
    );
    expect(
      result.ingredients.find((part) => part.ingredientId === "soy-sauce")
        ?.optional,
    ).toBe(true);
  });
  it("operation-only candidates are reported, never promoted to required ingredients", () => {
    const markdown = source("- 蒜 2 瓣");
    const result = extractHowToCookIngredients(markdown);
    expect(
      result.ingredients.some((part) => part.ingredientId === "wine"),
    ).toBe(false);
    expect(
      operationOnlyIngredientCandidates(markdown, result.ingredients).map(
        (part) => part.ingredientId,
      ),
    ).toContain("wine");
    expect(
      operationOnlyIngredientCandidates(
        markdown.replace("加入料酒 15ml", "加入水 150ml"),
        result.ingredients,
      ).map((part) => part.ingredientId),
    ).toContain("water");
  });
  it("detects a missing calculation ingredient even when the material list is intact", () => {
    expect(
      howToCookCompletenessViolations(
        snapshot,
        mushroom.ingredients.filter((part) => part.ingredientId !== "wine"),
      ).map((part) => part.ingredientId),
    ).toEqual(["wine"]);
  });
  it("all 365 pinned tutorials contain every high-confidence calculated identity", () => {
    expect(manifest).toHaveLength(365);
    for (const entry of manifest) {
      const recipe = verifiedRecipes.find((recipe) => recipe.id === entry.id)!;
      expect(
        howToCookCompletenessViolations(
          fs.readFileSync(entry.snapshotPath, "utf8"),
          recipe.ingredients,
        ),
        entry.id,
      ).toEqual([]);
    }
  });
});
