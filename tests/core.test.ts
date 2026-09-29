import { describe, it, expect, vi } from "vitest";
import {
  normalizeIngredient,
  ingredientFromText,
  togglePantry,
  makePantryItem,
} from "../lib/ingredients";
import { matchRecipe, searchRecipe } from "../lib/matching";
import { scaleQuantity, normalizeUnit } from "../lib/units";
import { localRecipes } from "../lib/seed";
import { recipeSchema } from "../lib/model";
import {
  LocalRecipeProvider,
  RecipeAggregator,
  TheMealDBProvider,
} from "../lib/providers";
import { parseRecipeHtml } from "../lib/recipe-parser";
import { isPublicAddress, validateImportUrl } from "../lib/safe-fetch";
import { MemoryRecipeRepository } from "../lib/db/repository";
import { GET as searchRoute } from "../app/api/recipes/route";
import { GET as detailRoute } from "../app/api/recipes/[id]/route";
import { POST as importRoute } from "../app/api/import/route";
describe("ingredient normalization", () => {
  it.each(["西红柿", "Tomatoes", " TOMATO ", "番茄"])("normalizes %s", (s) =>
    expect(normalizeIngredient(s)?.id).toBe("tomato"),
  );
  it("preserves distinct sauce varieties", () => {
    expect(normalizeIngredient("老抽")?.id).toBe("dark-soy");
    expect(normalizeIngredient("生抽")?.id).toBe("soy-sauce");
  });
  it("recognizes ingredient in quantity text", () =>
    expect(ingredientFromText("鸡胸肉 300 克")?.id).toBe("chicken-breast"));
});
describe("match engine", () => {
  it("gives core ingredients much more weight than staples", () => {
    const r = localRecipes[0];
    const core = matchRecipe(r, ["tomato", "egg"].map(makePantryItem));
    const staples = matchRecipe(r, ["oil", "salt"].map(makePantryItem));
    expect(core.score).toBeGreaterThan(80);
    expect(staples.score).toBeLessThan(20);
    expect(core.missingCore).toBe(0);
    expect(core.optionalIngredients).toHaveLength(2);
  });
  it("does not count optional ingredients as missing", () =>
    expect(
      matchRecipe(
        localRecipes[0],
        ["tomato", "egg", "oil", "salt"].map(makePantryItem),
      ).score,
    ).toBe(100));
  it("boosts expiring items only for inventory sorting", () => {
    const p = makePantryItem("tomato");
    const base = matchRecipe(localRecipes[0], [p]);
    p.expiryDate = new Date(Date.now() + 86400000).toISOString();
    const boosted = matchRecipe(localRecipes[0], [p]);
    expect(boosted.score).toBe(base.score);
    expect(boosted.inventoryScore).toBeGreaterThan(base.inventoryScore);
  });
  it("supports alias dish search", () =>
    expect(searchRecipe(localRecipes[0], "番茄炒鸡蛋")).toBe(true));
  it("requires all search terms", () =>
    expect(searchRecipe(localRecipes[0], "番茄 牛肉")).toBe(false));
});
describe("quantities", () => {
  it("scales servings", () => expect(scaleQuantity(3, 2, 4)).toBe(6));
  it("retains unknown quantities", () =>
    expect(scaleQuantity(null, 2, 4)).toBeNull());
  it("rejects zero servings", () =>
    expect(() => scaleQuantity(3, 0, 2)).toThrow());
  it.each([
    ["克", "g"],
    ["毫升", "ml"],
    ["汤匙", "tbsp"],
  ])("normalizes %s", (from, to) => expect(normalizeUnit(from)).toBe(to));
});
describe("provider and repository integration", () => {
  it("validates all authored recipes", () =>
    localRecipes.forEach((r) =>
      expect(recipeSchema.safeParse(r).success).toBe(true),
    ));
  it("updates pantry immutably", () => {
    const empty: ReturnType<typeof makePantryItem>[] = [];
    const added = togglePantry(empty, "egg");
    expect(empty).toHaveLength(0);
    expect(added[0].canonicalName).toBe("egg");
    expect(togglePantry(added, "egg")).toHaveLength(0);
  });
  it("normalizes TheMealDB without inventing timing", () => {
    const r = new TheMealDBProvider().normalizeRecipe({
      idMeal: "123",
      strMeal: "Test",
      strIngredient1: "Tomatoes",
      strMeasure1: "2",
      strInstructions: "Chop tomatoes.\nCook thoroughly.",
      strMealThumb: "https://www.themealdb.com/images/test.jpg",
    });
    expect(r.ingredients[0].ingredientId).toBe("tomato");
    expect(r.instructions).toHaveLength(2);
    expect(r.totalTime).toBeNull();
    expect(r.rating).toBeNull();
  });
  it("falls back when external provider throws", async () => {
    class Broken extends LocalRecipeProvider {
      id = "broken";
      name = "Broken";
      async search(): Promise<never> {
        throw new Error("network");
      }
    }
    const result = await new RecipeAggregator([
      new LocalRecipeProvider(),
      new Broken(),
    ]).search("番茄");
    expect(result.recipes.length).toBeGreaterThan(0);
    expect(result.warnings).toHaveLength(1);
  });
  it("deduplicates provider identities", async () => {
    const result = await new RecipeAggregator([
      new LocalRecipeProvider(),
      new LocalRecipeProvider(),
    ]).search("");
    expect(result.recipes).toHaveLength(localRecipes.length);
  });
  it("upserts detail cache", async () => {
    const repo = new MemoryRecipeRepository();
    await repo.save(localRecipes[0]);
    await repo.save({ ...localRecipes[0], title: "Changed" });
    expect((await repo.get(localRecipes[0].id))?.title).toBe("Changed");
  });
  it("search API returns normalized recipes", async () => {
    const res = await searchRoute(
      new Request("http://localhost/api/recipes?q=番茄"),
    );
    const body = await res.json();
    expect(
      body.recipes.some((r: { id: string }) => r.id === "tomato-eggs"),
    ).toBe(true);
  });
  it("detail API returns exact requested recipe", async () => {
    const res = await detailRoute(new Request("http://localhost"), {
      params: Promise.resolve({ id: "tomato-eggs" }),
    });
    expect((await res.json()).recipe.title).toBe("番茄炒蛋");
  });
});
describe("import parser and security", () => {
  const recipe = {
    "@type": "Recipe",
    name: "<b>Test</b>",
    recipeIngredient: ["2 tomatoes", "3 eggs"],
    recipeInstructions: [
      {
        "@type": "HowToSection",
        itemListElement: [{ "@type": "HowToStep", text: "<b>Cook</b> fully" }],
      },
    ],
    totalTime: "PT20M",
    recipeYield: "4 servings",
  };
  it("parses nested graph and sanitizes markup", () => {
    const html = `<script type="application/ld+json">${JSON.stringify({ "@graph": [recipe] })}</script>`;
    const r = parseRecipeHtml(html, "https://example.com/recipe");
    expect(r.title).toBe("Test");
    expect(r.instructions[0].description).toBe("Cook fully");
    expect(r.totalTime).toBe(20);
    expect(r.servings).toBe(4);
    expect(r.ingredients[0].ingredientId).toBe("tomato");
  });
  it("supports microdata", () => {
    const r = parseRecipeHtml(
      '<div itemtype="https://schema.org/Recipe"><h1 itemprop="name">Eggs</h1><p itemprop="recipeIngredient">2 eggs</p><p itemprop="recipeInstructions">Cook eggs fully.</p></div>',
      "https://example.com/r",
    );
    expect(r.title).toBe("Eggs");
  });
  it("does not mistake OpenGraph alone for a recipe", () =>
    expect(() =>
      parseRecipeHtml(
        '<meta property="og:title" content="No recipe">',
        "https://example.com",
      ),
    ).toThrow());
  it.each([
    "127.0.0.1",
    "10.0.0.1",
    "172.16.2.3",
    "192.168.1.1",
    "169.254.169.254",
    "::1",
    "::ffff:127.0.0.1",
    "fc00::1",
    "fe80::1",
    "0.0.0.0",
  ])("blocks %s", (ip) => expect(isPublicAddress(ip)).toBe(false));
  it("allows ordinary public IP", () =>
    expect(isPublicAddress("8.8.8.8")).toBe(true));
  it.each([
    "http://example.com",
    "https://localhost/",
    "https://user:pass@example.com/",
    "https://example.com:8443/",
  ])("rejects unsafe URL %s", (u) =>
    expect(() => validateImportUrl(u)).toThrow(),
  );
  it("rejects cross origin mutations before fetching", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const res = await importRoute(
      new Request("https://kitchen.example/api/import", {
        method: "POST",
        headers: { origin: "https://evil.example" },
        body: JSON.stringify({ url: "https://example.com" }),
      }),
    );
    expect(res.status).toBe(403);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
