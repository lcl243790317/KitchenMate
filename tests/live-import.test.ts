import { it, expect } from "vitest";
import { ExternalUrlImportProvider } from "@/lib/url-import-provider";

const candidates = [
  "https://www.allrecipes.com/recipe/21014/good-old-fashioned-pancakes/",
  "https://www.simplyrecipes.com/recipes/banana_bread/",
  "https://www.budgetbytes.com/garlic-noodles/",
  "https://www.bbcgoodfood.com/recipes/best-ever-chocolate-brownies-recipe",
  "https://www.foodnetwork.com/recipes/food-network-kitchen/spaghetti-carbonara-recipe-1972868",
  "https://www.seriouseats.com/the-best-slow-cooked-tomato-sauce-recipe",
  "https://www.loveandlemons.com/banana-bread/",
  "https://cookieandkate.com/healthy-banana-bread-recipe/",
  "https://www.gimmesomeoven.com/fried-rice-recipe/",
  "https://thewoksoflife.com/stir-fried-tomato-and-egg/",
];
it.runIf(process.env.LIVE_IMPORT_TESTS === "true")("checks real recipe pages with the production importer", async () => {
  const provider = new ExternalUrlImportProvider();
  const results = await Promise.all(candidates.map(async (url) => {
    try {
      const recipe = await provider.importUrl(url);
      return { url, ok: Boolean(recipe.title && recipe.ingredients.length && recipe.instructions.length), title: recipe.title, ingredients: recipe.ingredients.length, instructions: recipe.instructions.length, image: Boolean(recipe.image), time: recipe.totalTime !== null };
    } catch (error) {
      return { url, ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }));
  for (const result of results) console.log(JSON.stringify(result));
  expect(results.length).toBe(candidates.length);
  expect(results.filter((result) => result.ok).length).toBeGreaterThanOrEqual(5);
}, 60000);
