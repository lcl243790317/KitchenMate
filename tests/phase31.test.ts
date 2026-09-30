import { describe, expect, it } from "vitest";
import { ingredients, normalizeIngredient } from "../lib/ingredients";
import {
  pantryPrimary,
  pantryCommonIds,
  pantryUiCategories,
  searchPantryIngredients,
} from "../lib/pantry-selection";
import {
  matchesRecommendationMode,
  searchRecipe,
  matchRecipe,
} from "../lib/matching";
import { browseRecipes } from "../lib/recipe-browse";
import { verifiedRecipes } from "../lib/verified-recipes";
import type { Recipe } from "../lib/model";
const original = verifiedRecipes.find((r) => r.title === "西红柿炒鸡蛋")!;
const pantry = [{ ingredientId: "tomato" }, { ingredientId: "egg" }];
const make = (ids: string[], time: number | null = 20): Recipe => ({
  ...original,
  totalTime: time,
  ingredients: ids.map((ingredientId) => ({
    ingredientId,
    originalText: ingredientId,
    quantity: null,
    unit: "",
    optional: false,
    group: "主料",
  })),
});
describe("Pantry presentation stays separate from vocabulary", () => {
  it("contains valid unique primary IDs with 24 common shortcuts", () => {
    expect(ingredients).toHaveLength(703);
    expect(pantryPrimary).toHaveLength(86);
    expect(new Set(pantryPrimary.map((i) => i.id)).size).toBe(86);
    expect(
      pantryPrimary.every((i) => ingredients.some((v) => v.id === i.id)),
    ).toBe(true);
    expect(pantryCommonIds.size).toBe(24);
    expect(pantryUiCategories).toHaveLength(9);
  });
  it.each(["羊肚", "松茸", "牛舌", "鸡翅根", "baby bok choy"])(
    "searches the full vocabulary: %s",
    (q) => {
      expect(searchPantryIngredients(q).length).toBeGreaterThan(0);
      expect(normalizeIngredient(q)).toBeDefined();
    },
  );
  it("preserves specific to generic direction without substitutions", () => {
    const specific = normalizeIngredient("牛腩")!;
    expect(
      matchRecipe(make(["beef"]), [{ ingredientId: specific.id }]).missingCore,
    ).toBe(0);
    expect(
      matchRecipe(make([specific.id]), [{ ingredientId: "beef" }]).missingCore,
    ).toBe(1);
  });
});
describe("all recommendation modes require selected ingredient use", () => {
  it.each(["现在就能做", "只差一样", "只差两样", "最匹配", "快手菜"])(
    "%s rejects unrelated and empty pantry",
    (mode) => {
      expect(matchesRecommendationMode(make(["beef"]), pantry, mode)).toBe(
        false,
      );
      expect(matchesRecommendationMode(original, [], mode)).toBe(false);
    },
  );
  it("accepts exact missing core modes", () => {
    expect(
      matchesRecommendationMode(make(["tomato", "beef"]), pantry, "只差一样"),
    ).toBe(true);
    expect(
      matchesRecommendationMode(make(["tomato", "egg"]), pantry, "现在就能做"),
    ).toBe(true);
    expect(
      matchesRecommendationMode(
        make(["tomato", "beef", "pork"]),
        pantry,
        "只差两样",
      ),
    ).toBe(true);
  });
  it("requires known quick time", () => {
    expect(
      matchesRecommendationMode(make(["tomato"], null), pantry, "快手菜"),
    ).toBe(false);
    expect(
      matchesRecommendationMode(make(["tomato"], 31), pantry, "快手菜"),
    ).toBe(false);
    expect(
      matchesRecommendationMode(make(["tomato"], 30), pantry, "快手菜"),
    ).toBe(true);
  });
});
describe("explicit recipe aliases and browsing", () => {
  it.each(["番茄炒蛋", "西红柿炒蛋", "番茄炒鸡蛋", "tomato", "鸡蛋"])(
    "finds source title using %s",
    (q) => expect(searchRecipe(original, q)).toBe(true),
  );
  it("does not broaden chicken eggs into cake or duck eggs", () => {
    expect(searchRecipe(original, "蛋糕")).toBe(false);
    expect(searchRecipe(original, "鸭蛋")).toBe(false);
  });
  it("includes source links and excludes unverified and test fixtures", () => {
    const unverified = {
      ...original,
      id: "legacy",
      provenance: { ...original.provenance, type: "UNVERIFIED" as const },
    };
    const fixture = {
      ...unverified,
      id: "fixture",
      provenance: { ...original.provenance, type: "FIRST_PARTY_TEST" as const },
    };
    const all = browseRecipes([...verifiedRecipes, unverified, fixture]);
    expect(all).toHaveLength(verifiedRecipes.length);
    expect(
      all.filter((r) => r.instructionAvailability === "source-only"),
    ).toHaveLength(
      verifiedRecipes.filter((r) => r.instructionAvailability === "source-only")
        .length,
    );
    expect(
      browseRecipes(all, "tomato").every((r) => searchRecipe(r, "tomato")),
    ).toBe(true);
    expect(
      browseRecipes(all, "", "主食").every((r) => r.category === "主食"),
    ).toBe(true);
    expect(browseRecipes(all, "", "", "HowToCook")).toHaveLength(365);
    expect(browseRecipes(all).map((r) => r.id)).toEqual(all.map((r) => r.id));
  });
});
