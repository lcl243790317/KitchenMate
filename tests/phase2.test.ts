import { describe, it, expect } from "vitest";
import { ingredients, ingredientById, normalizeIngredient, normalizeSearchQuery } from "@/lib/ingredients";
import { localRecipes } from "@/lib/seed";
import { matchRecipe, searchRecipe } from "@/lib/matching";
import { recipeSchema } from "@/lib/model";
import { parseLegacyState, createBackup, parseBackup } from "@/lib/storage/device";
import { parseRecipeHtml } from "@/lib/recipe-parser";
import { exampleJsonLd } from "@/lib/example-recipe";
import { clientKey } from "@/lib/rate-limit";

describe("ingredient library", () => {
  it("contains 400+ distinct ingredients in 25+ categories", () => {
    expect(ingredients.length).toBeGreaterThanOrEqual(400);
    expect(new Set(ingredients.map((item) => item.id)).size).toBe(ingredients.length);
    expect(new Set(ingredients.map((item) => item.canonicalName)).size).toBe(ingredients.length);
    expect(new Set(ingredients.map((item) => item.category)).size).toBeGreaterThanOrEqual(25);
  });
  it("keeps important kitchen distinctions", () => {
    expect(normalizeIngredient("西红柿")?.id).toBe("tomato");
    expect(normalizeIngredient("生抽")?.id).not.toBe(normalizeIngredient("老抽")?.id);
    expect(normalizeIngredient("嫩豆腐")?.id).not.toBe(normalizeIngredient("老豆腐")?.id);
    expect(normalizeIngredient("牛奶")?.id).not.toBe(normalizeIngredient("淡奶油")?.id);
    expect(normalizeIngredient("玉米淀粉")?.id).not.toBe(normalizeIngredient("红薯淀粉")?.id);
    expect(normalizeSearchQuery("tomato 鸡蛋")).toBe("番茄 鸡蛋");
  });
});
describe("recipe library", () => {
  it("contains 80+ independently structured recipes", () => {
    expect(localRecipes.length).toBeGreaterThanOrEqual(80);
    expect(new Set(localRecipes.map((recipe) => recipe.id)).size).toBe(localRecipes.length);
    for (const recipe of localRecipes) {
      recipeSchema.parse(recipe);
      expect(recipe.ingredients.length).toBeGreaterThanOrEqual(2);
      expect(recipe.instructions.length).toBeGreaterThanOrEqual(1);
      expect(recipe.instructions.map((step) => step.stepNumber)).toEqual(recipe.instructions.map((_, index) => index + 1));
      expect(recipe.instructions.every((step) => step.description.trim().length >= 5)).toBe(true);
      expect(recipe.ingredients.every((item) => ingredientById.has(item.ingredientId))).toBe(true);
    }
  });
  it("finds Chinese alias and mixed language queries", () => {
    const recipe = localRecipes.find((item) => item.id === "tomato-eggs")!;
    expect(searchRecipe(recipe, "西红柿")).toBe(true);
    expect(searchRecipe(recipe, "tomato 鸡蛋")).toBe(true);
  });
  it("reports known quantity shortfalls without penalizing unknown stock", () => {
    const recipe = localRecipes.find((item) => item.id === "tomato-eggs")!;
    const stock = [{ ingredientId: "egg", canonicalName: "egg", displayName: "鸡蛋", category: "蛋奶", quantity: 1, unit: "个", expiryDate: null, storageLocation: "冰箱" as const, createdAt: "2026-09-29", updatedAt: "2026-09-29" }];
    expect(matchRecipe(recipe, stock).quantityShortfalls.some((item) => item.ingredientId === "egg")).toBe(true);
    expect(matchRecipe(recipe, [{ ...stock[0], quantity: null }]).quantityShortfalls).toHaveLength(0);
  });
});
describe("local device data", () => {
  it("migrates the v1 shape without dropping collections", () => {
    const state = parseLegacyState(JSON.stringify({ pantry: [], shopping: [], saved: [], favorites: ["tomato-eggs"], dark: true }))!;
    expect(state.favorites).toEqual(["tomato-eggs"]);
    expect(state.dark).toBe(true);
    expect(parseBackup(JSON.stringify(createBackup(state))).data).toEqual(state);
  });
  it("rejects malformed backups", () => {
    expect(() => parseBackup('{"format":"kitchenmate-backup","version":2,"data":{"pantry":"bad"}}')).toThrow();
  });
});
describe("import example and request identity", () => {
  it("imports the first-party JSON-LD example", () => {
    const html = `<script type="application/ld+json">${JSON.stringify(exampleJsonLd)}</script>`;
    const recipe = parseRecipeHtml(html, "https://kitchenmate-production.up.railway.app/examples/import/tomato-eggs");
    expect(recipe.title).toBe("番茄炒蛋");
    expect(recipe.ingredients.length).toBeGreaterThan(1);
    expect(recipe.instructions.length).toBeGreaterThan(1);
  });
  it("ignores spoofed forwarding headers outside Railway", () => {
    expect(clientKey(new Request("http://localhost", { headers: { "x-forwarded-for": "1.2.3.4" } }))).toBe("unknown");
  });
});
