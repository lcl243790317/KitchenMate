import { describe, it, expect } from "vitest";
import {
  ingredients,
  ingredientFromText,
  makePantryItem,
  normalizeIngredient,
} from "@/lib/ingredients";
import { matchRecipe, searchRecipe } from "@/lib/matching";
import { recipeSchema } from "@/lib/model";
import {
  canDisplayRecipe,
  canCookRecipe,
  dedupeRecipes,
} from "@/lib/recipe-trust";
import {
  verifiedRecipes,
  ingredientToRecipes,
  recipesById,
  sourceUrlIndex,
} from "@/lib/verified-recipes";
import { localRecipes } from "@/tests/fixtures/legacy-recipes";
import {
  parseLegacyState,
  parseBackup,
  createBackup,
  migrateSavedRecipe,
} from "@/lib/storage/device";
import { parseRecipeHtml } from "@/lib/recipe-parser";
import verification from "@/docs/IMPORT_VERIFICATION.json";
const full = verifiedRecipes.find((r) => r.title === "西红柿炒鸡蛋")!;
const linked = verifiedRecipes.find(
  (r) => r.provenance.type === "SOURCE_LINKED",
)!;
describe("source truth contract", () => {
  it("keeps the entire legacy catalog hidden", () =>
    expect(localRecipes.every((r) => !canDisplayRecipe(r))).toBe(true));
  it("has at least 150 actual verified records", () =>
    expect(verifiedRecipes.length).toBeGreaterThanOrEqual(150));
  it("permits source-linked discovery but never cooking", () => {
    expect(canDisplayRecipe(linked)).toBe(true);
    expect(canCookRecipe(linked)).toBe(false);
    expect(linked.instructions).toEqual([]);
  });
  it("rejects invented steps on a source-only record", () =>
    expect(
      canDisplayRecipe({ ...linked, instructions: full.instructions }),
    ).toBe(false));
  it.each(["sourceUrl", "verifiedAt", "verificationMethod"] as const)(
    "requires provenance %s",
    (key) =>
      expect(
        canDisplayRecipe({
          ...full,
          provenance: { ...full.provenance, [key]: null },
        }),
      ).toBe(false),
  );
  it("rejects noncontiguous steps", () =>
    expect(
      canCookRecipe({
        ...full,
        instructions: [{ ...full.instructions[0], stepNumber: 2 }],
      }),
    ).toBe(false));
  it("rejects blank instruction", () =>
    expect(
      canCookRecipe({
        ...full,
        instructions: [{ ...full.instructions[0], description: " " }],
      }),
    ).toBe(false));
  it("requires two ingredients for full tutorial", () =>
    expect(
      canCookRecipe({ ...full, ingredients: full.ingredients.slice(0, 1) }),
    ).toBe(false));
  it("deduplicates provider identity", () =>
    expect(dedupeRecipes([full, { ...full, id: "duplicate" }])).toHaveLength(
      1,
    ));
  it("deduplicates normalized source URL", () =>
    expect(
      dedupeRecipes([
        full,
        {
          ...full,
          id: "another",
          externalId: "another",
          sourceProvider: "another",
        },
      ]),
    ).toHaveLength(1));
  it("does not deduplicate unrelated sources by title", () =>
    expect(
      dedupeRecipes([full, { ...linked, title: full.title }]),
    ).toHaveLength(2));
  it("prefers a private full import over the same source-only index", () => {
    const imported = {
      ...full,
      id: "import:same-source",
      sourceProvider: "url-import",
      sourceUrl: linked.sourceUrl,
      externalId: linked.externalId,
      provenance: {
        ...full.provenance,
        type: "USER_IMPORTED" as const,
        sourceUrl: linked.sourceUrl,
      },
    };
    expect(dedupeRecipes([linked, imported])).toEqual([imported]);
  });
  it("indexes every recipe and source", () => {
    expect(recipesById.size).toBe(verifiedRecipes.length);
    expect(sourceUrlIndex.size).toBe(verifiedRecipes.length);
    expect(ingredientToRecipes.get("egg")).toContain(full.id);
  });
  it("defaults old snapshots to unverified", () => {
    const raw = {
      ...full,
      provenance: undefined,
      verificationStatus: undefined,
      instructionAvailability: undefined,
    };
    expect(canDisplayRecipe(recipeSchema.parse(raw))).toBe(false);
  });
});
describe("ingredient semantics", () => {
  it("finds a source title using the everyday Chinese dish alias", () => {
    expect(searchRecipe(full, "番茄炒蛋")).toBe(true);
    expect(searchRecipe(full, "tomato 鸡蛋")).toBe(true);
  });
  it.each([
    ["2 boneless skinless chicken breasts", "chicken-breast"],
    ["3 medium tomatoes, chopped", "tomato"],
    ["1 lb baby bok choy", "zh:上海青"],
    ["1/2 bunch green onions", "scallion"],
    ["西红柿", "tomato"],
    ["300 克鸡胸脯肉", "chicken-breast"],
  ])("maps %s safely", (line, id) =>
    expect(ingredientFromText(line)?.id).toBe(id),
  );
  const recipeFor = (id: string) => ({
    ...full,
    ingredients: [{ ...full.ingredients[0], ingredientId: id }],
  });
  it.each([
    ["chicken-breast", "chicken"],
    ["zh:香菇", "mushroom"],
    ["zh:牛腩", "beef"],
  ])("allows specific %s to satisfy generic %s", (have, need) =>
    expect(
      matchRecipe(recipeFor(need), [makePantryItem(have)]).missingCore,
    ).toBe(0),
  );
  it.each([
    ["chicken", "chicken-breast"],
    ["zh:口蘑", "zh:香菇"],
    ["zh:白醋", "zh:米醋"],
    ["zh:老豆腐", "zh:嫩豆腐"],
    ["milk", "cream"],
  ])("never substitutes %s for %s", (have, need) =>
    expect(
      matchRecipe(recipeFor(need), [makePantryItem(have)]).missingCore,
    ).toBe(1),
  );
  it("has at least 300 meaningful English names", () =>
    expect(
      ingredients.filter((i) => i.displayNameEn.trim()).length,
    ).toBeGreaterThanOrEqual(300));
  it("does not choose an ingredient forbidden in a parenthetical note", () =>
    expect(ingredientFromText("洋葱（不要用紫色的洋葱）")?.id).toBe("onion"));
  it("leaves ambiguous alternatives unresolved", () =>
    expect(ingredientFromText("牛奶或淡奶油")).toBeUndefined());
  it("keeps generic bell pepper separate from green pepper", () =>
    expect(normalizeIngredient("bell pepper")?.id).toBe("zh:彩椒"));
  it("recognizes frozen peas without claiming they are fresh peas", () =>
    expect(ingredientFromText("1/2 cup frozen peas")?.id).toBe("zh:速冻豌豆"));
  it("does not turn a chicken breast into a whole bird requirement", () =>
    expect(normalizeIngredient("整鸡")).toBeUndefined());
  it("does not score staples alone highly", () =>
    expect(
      matchRecipe(full, ["salt", "oil"].map(makePantryItem)).score,
    ).toBeLessThan(20));
  it("can cook tomato eggs without selecting staples", () =>
    expect(
      matchRecipe(full, ["tomato", "egg"].map(makePantryItem)).missingCore,
    ).toBe(0));
  it("reports measured English unknown rate below 15 percent", () => {
    const total = verification.reduce(
      (n, r) => n + (r.ingredientCount ?? 0),
      0,
    );
    const unknown = verification.reduce(
      (n, r) => n + (r.unknownIngredients?.length ?? 0),
      0,
    );
    expect(total).toBeGreaterThan(40);
    expect(unknown / total).toBeLessThan(0.15);
  });
});
describe("Phase 2 data survives Phase 3", () => {
  const old = {
    pantry: [
      {
        ingredientId: "egg",
        quantity: 6,
        unit: "个",
        expiryDate: "2026-10-02",
        storageLocation: "冰箱",
      },
    ],
    saved: [localRecipes[0]],
    shopping: [],
    favorites: ["tomato-eggs"],
    recentRecipeIds: ["tomato-eggs"],
    dark: true,
  };
  it("strips obsolete fields without dropping selected IDs", () =>
    expect(parseLegacyState(JSON.stringify(old))!.pantry).toEqual([
      { ingredientId: "egg" },
    ]));
  it("preserves hidden snapshots, favorites, recents and settings", () => {
    const next = parseLegacyState(JSON.stringify(old))!;
    expect(next.saved).toHaveLength(1);
    expect(next.favorites).toEqual(old.favorites);
    expect(next.recentRecipeIds).toEqual(old.recentRecipeIds);
    expect(next.dark).toBe(true);
  });
  it("accepts v2 and exports v3", () => {
    const next = parseBackup(
      JSON.stringify({
        format: "kitchenmate-backup",
        version: 2,
        exportedAt: new Date().toISOString(),
        data: old,
      }),
    );
    expect(createBackup(next.data).version).toBe(3);
    expect(next.data.pantry).toEqual([{ ingredientId: "egg" }]);
  });
  it("retains an old user import as a historical private snapshot", () => {
    const oldImport = {
      ...localRecipes[0],
      sourceProvider: "url-import",
      sourceUrl: "https://example.org/recipe",
      lastFetchedAt: "2026-09-20T12:00:00Z",
    };
    const next = migrateSavedRecipe(oldImport);
    expect(next.provenance.type).toBe("USER_IMPORTED");
    expect(next.provenance.verifiedAt).toBe(oldImport.lastFetchedAt);
    expect(next.instructions).toEqual(oldImport.instructions);
  });
  it("classifies first-party import as a fixture", () => {
    const html =
      '<script type="application/ld+json">' +
      JSON.stringify({
        "@type": "Recipe",
        name: "Test",
        recipeIngredient: ["2 eggs", "salt"],
        recipeInstructions: ["Cook fully."],
      }) +
      "</script>";
    const recipe = parseRecipeHtml(
      html,
      "https://kitchenmate-production.up.railway.app/examples/import/tomato-eggs",
    );
    expect(recipe.provenance.type).toBe("FIRST_PARTY_TEST");
    expect(canDisplayRecipe(recipe)).toBe(false);
  });
});
