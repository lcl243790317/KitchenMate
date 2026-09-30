import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import fs from "node:fs";
import translations from "../data/recipe-translations/zh.json";
import basedManifest from "../data/verified-recipes/based-cooking/manifest.json";
import commonsManifest from "../data/verified-recipes/commons/manifest.json";
import { verifiedRecipes } from "../lib/verified-recipes";
import {
  recipeTranslation,
  translationFidelityErrors,
  localizedInstructions,
  type RecipeTranslation,
} from "../lib/recipe-localization";
import { parseBasedCooking } from "../lib/based-cooking-parser";
import { parseCommonsRecipe } from "../lib/commons-recipe-parser";
import { parseWikiIngredient } from "../lib/wikibooks-parser";
import { matchRecipe, searchRecipe } from "../lib/matching";
import { validateRecipeSourcePolicy } from "../lib/recipe-source-registry";
import { pantryPrimary, pantryCommonIds } from "../lib/pantry-selection";
import { ingredients } from "../lib/ingredients";
import { canCookRecipe } from "../lib/recipe-trust";
import { beginnerSignals } from "../lib/beginner-recipes";

describe("Pinned bilingual recipe fidelity", () => {
  it.each(translations)(
    "$recipeId preserves original source, license, units and every step",
    (t) => {
      const r = verifiedRecipes.find((r) => r.id === t.recipeId)!;
      const original = JSON.stringify(r);
      expect(translationFidelityErrors(r, t as RecipeTranslation)).toEqual([]);
      expect(t.sourceInstructionSha256).toBe(
        createHash("sha256")
          .update(JSON.stringify(r.instructions.map((i) => i.description)))
          .digest("hex"),
      );
      expect(t.licenseName).toBe(r.provenance.licenseName);
      expect(localizedInstructions(r, "zh").map((i) => i.description)).toEqual(
        t.steps.map((s) => s.description),
      );
      expect(localizedInstructions(r, "en")).toEqual(r.instructions);
      expect(JSON.stringify(r)).toBe(original);
      expect(r.sourceAuthor).not.toBe("KitchenMate");
    },
  );
  const r = verifiedRecipes.find((r) => r.title === "烤鸡胸肉")!;
  it.each(["400°F", "165°F", "30 minutes", "400°C"])(
    "rejects altered temperature/time %s",
    (text) => {
      const t = structuredClone(recipeTranslation(r)!);
      t.steps[1].description += " " + text;
      expect(translationFidelityErrors(r, t).length).toBeGreaterThan(0);
    },
  );
  it("rejects butter translated as oil and an original-text change even if numeric values match", () => {
    const butter = verifiedRecipes.find(
      (r) => r.id === "based-cooking:baked-salmon",
    )!;
    const t = structuredClone(recipeTranslation(butter)!);
    t.steps[2].description = t.steps[2].description.replace("黄油", "食用油");
    expect(translationFidelityErrors(butter, t).join()).toContain("butter");
    const changed = {
      ...butter,
      instructions: butter.instructions.map((s) => ({
        ...s,
        description: s.description.replace("butter", "oil"),
      })),
    };
    expect(recipeTranslation(changed)).toBeUndefined();
    expect(localizedInstructions(changed, "zh")).toEqual(changed.instructions);
  });
  it("rejects changed source revision, number, unit, order and omitted steps", () => {
    const recipe = verifiedRecipes.find(
      (r) => r.id === "based-cooking:spiced-apple-pancakes",
    )!;
    const source = recipeTranslation(recipe)!;
    for (const mutate of [
      (t: RecipeTranslation) => (t.sourceRevision = "wrong"),
      (t: RecipeTranslation) => t.steps.reverse(),
      (t: RecipeTranslation) => t.steps.pop(),
      (t: RecipeTranslation) =>
        (t.steps[5].description = t.steps[5].description.replace(
          "1 tbsp",
          "1 tsp",
        )),
      (t: RecipeTranslation) => (t.steps[5].description += " 100°C"),
    ]) {
      const t = structuredClone(source);
      mutate(t);
      expect(translationFidelityErrors(recipe, t).length).toBeGreaterThan(0);
    }
  });
  it("all formal English Wikibooks full tutorials have independent static Chinese artifacts", () => {
    const wiki = verifiedRecipes.filter(
      (r) =>
        r.sourceProvider === "wikibooks" &&
        new URL(r.sourceUrl!).hostname === "en.wikibooks.org",
    );
    expect(wiki.length).toBeGreaterThanOrEqual(36);
    for (const r of wiki) expect(recipeTranslation(r)).toBeDefined();
  });
});
describe("Reviewed new source snapshots", () => {
  it.each(basedManifest)(
    "$id faithfully retains source author, ingredient usages and directions",
    (entry) => {
      const raw = fs.readFileSync(entry.snapshotPath, "utf8");
      const x = parseBasedCooking(raw, entry.operationIngredients);
      const r = verifiedRecipes.find((r) => r.id === entry.id)!;
      expect(createHash("sha256").update(raw).digest("hex")).toBe(entry.sha256);
      expect(r.instructions.map((i) => i.description)).toEqual(x.descriptions);
      expect(r.ingredients).toEqual(x.ingredients);
      expect(r.sourceAuthor).toBe(x.author);
      expect(r.provenance.sourceRevision).toBe(entry.sourceRevision);
      expect(canCookRecipe(r)).toBe(true);
      expect(() => validateRecipeSourcePolicy(r)).not.toThrow();
      for (const i of entry.operationIngredients)
        expect(raw).toContain(i.originalText);
    },
  );
  it.each(commonsManifest)(
    "$id is a complete explicitly written recipe, not a photo-derived recipe",
    (entry) => {
      const raw = fs.readFileSync(entry.snapshotPath, "utf8");
      const x = parseCommonsRecipe(JSON.parse(raw).wikitext);
      const r = verifiedRecipes.find((r) => r.id === entry.id)!;
      expect(createHash("sha256").update(raw).digest("hex")).toBe(entry.sha256);
      expect(r.instructions.map((i) => i.description)).toEqual(x.descriptions);
      expect(r.ingredients).toEqual(x.ingredients);
      expect(r.image).toBeNull();
      expect(r.sourceAuthor).toBe("pelican");
    },
  );
  it("keeps nested procedure choices within one source step", () => {
    const r = verifiedRecipes.find((r) => r.id === "wikibooks:281314")!;
    expect(r.instructions).toHaveLength(5);
    expect(r.instructions[2].description).toContain("850W for 10 minutes");
  });
  it("does not accept an unlicensed full source or missing license notice", () => {
    const r = verifiedRecipes.find(
      (r) => r.sourceProvider === "based-cooking",
    )!;
    expect(() =>
      validateRecipeSourcePolicy({
        ...r,
        provenance: { ...r.provenance, licenseName: undefined },
      }),
    ).toThrow();
    expect(() =>
      parseBasedCooking("## Ingredients\n- egg\n## Directions\n1. Cook"),
    ).toThrow();
  });
});
describe("Exact primary identities and unchanged selection semantics", () => {
  it.each(["zh:蛤蜊", "zh:甜玉米", "zh:乌冬面", "zh:杏鲍菇"])(
    "%s has at least one source-bound full tutorial",
    (id) => {
      const recipes = verifiedRecipes.filter(
        (r) =>
          r.instructionAvailability === "full" &&
          r.ingredients.some((i) => i.ingredientId === id),
      );
      expect(recipes.length).toBeGreaterThanOrEqual(1);
      for (const r of recipes) expect(r.sourceUrl).toBeTruthy();
    },
  );
  it.each([
    ["7 ears sweet corn", "zh:甜玉米"],
    ["2 bunches of udon noodle", "zh:乌冬面"],
    ["1/4 Japanese raddish", "zh:白萝卜"],
    ["Chopped clams", "zh:蛤蜊"],
    ["2 zucchinis", "zh:西葫芦"],
    ["1 tsp dried thyme", "zh:百里香"],
    ["15ml sesame oil", "zh:香油"],
    ["1 cup corn starch", "zh:玉米淀粉"],
    ["3T neutral oil", "oil"],
    ["4cm ginger", "ginger"],
    ["200g salmon steaks", "salmon"],
    ["200g plain white flour", "flour"],
    ["100g cooked rice", "rice"],
    ["1 cup uncooked basmati rice", "zh:大米"],
  ])("%s maps to exactly %s", (text, id) =>
    expect(parseWikiIngredient(text, false).ingredientId).toBe(id),
  );
  it.each([
    "milk or cream",
    "clam juice or dashi stock",
    "canned or frozen corn",
    "egg noodles or pasta",
    "smoked or fresh salmon",
    "400g fish fillet (white fish)",
  ])("%s remains unknown instead of a wrong identity", (text) =>
    expect(parseWikiIngredient(text, false).ingredientId).toMatch(/^unknown:/),
  );
  it("frozen corn keeps its own identity instead of becoming sweet corn", () =>
    expect(parseWikiIngredient("frozen corn", false).ingredientId).toBe(
      "zh:速冻玉米",
    ));
  it("corn starch does not satisfy sweetcorn, and parent ownership remains one way", () => {
    const corn = verifiedRecipes.find((r) => r.title === "香草甜玉米")!;
    expect(
      matchRecipe(corn, [{ ingredientId: "zh:玉米淀粉" }])
        .selectedIngredientUsage,
    ).toBe(0);
    const oyster = verifiedRecipes.find((r) => r.title === "三杯杏鲍菇")!;
    expect(
      matchRecipe(oyster, [{ ingredientId: "mushroom" }]).available.some(
        (i) => i.ingredientId === "zh:杏鲍菇",
      ),
    ).toBe(false);
    const generic = {
      ...oyster,
      ingredients: [{ ...oyster.ingredients[0], ingredientId: "mushroom" }],
    };
    expect(
      matchRecipe(generic, [{ ingredientId: "zh:杏鲍菇" }]).available,
    ).toHaveLength(1);
  });
  it("retains 703 vocabulary, 86 primary and 24 common ingredients", () => {
    expect(ingredients).toHaveLength(703);
    expect(pantryPrimary).toHaveLength(86);
    expect(pantryCommonIds.size).toBe(24);
  });
  it("a white-fish requirement is not satisfied by generic fish or salmon", () => {
    const recipe = verifiedRecipes.find(
      (r) => r.id === "based-cooking:fish-curry",
    )!;
    expect(
      matchRecipe(recipe, [{ ingredientId: "fish" }]).selectedIngredientUsage,
    ).toBe(0);
    expect(
      matchRecipe(recipe, [{ ingredientId: "salmon" }]).selectedIngredientUsage,
    ).toBe(0);
  });
  it("search accepts Chinese and original English for new source recipes", () => {
    const r = verifiedRecipes.find((r) => r.title === "讃岐乌冬面")!;
    expect(searchRecipe(r, "乌冬面")).toBe(true);
    expect(searchRecipe(r, "udon")).toBe(true);
  });
  it("few ingredients alone cannot label a source-only or unknown-time recipe beginner friendly", () => {
    const r = verifiedRecipes.find((r) => r.title === "讃岐乌冬面")!;
    expect(beginnerSignals(r).beginnerFriendly).toBe(false);
  });
});
