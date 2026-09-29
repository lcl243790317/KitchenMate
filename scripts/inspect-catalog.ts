import { verifiedRecipes } from "../lib/verified-recipes";
import { ingredients } from "../lib/ingredients";
const unknown = new Map<string, number>();
for (const r of verifiedRecipes)
  for (const i of r.ingredients)
    if (i.ingredientId.startsWith("unknown:"))
      unknown.set(i.originalText, (unknown.get(i.originalText) ?? 0) + 1);
console.log(
  JSON.stringify(
    {
      count: verifiedRecipes.length,
      en: ingredients.filter((i) => i.displayNameEn).length,
      parents: ingredients.filter((i) => i.parentIngredientId).length,
      totalIngredients: verifiedRecipes.reduce(
        (n, r) => n + r.ingredients.length,
        0,
      ),
      unknown: [...unknown].sort((a, b) => b[1] - a[1]).slice(0, 65),
      sample: verifiedRecipes
        .filter((_, i) => i % 19 === 0)
        .map((r) => ({
          title: r.title,
          ingredients: r.ingredients.map((i) => i.originalText),
          steps: r.instructions.length,
          first: r.instructions[0].description.slice(0, 100),
        })),
    },
    null,
    2,
  ),
);
