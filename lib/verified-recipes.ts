import { recipeSchema } from "./model";
import catalog from "@/data/verified-recipes/howtocook/recipes.json";
import linked from "@/data/verified-recipes/source-linked/recipes.json";
import wikibooks from "@/data/verified-recipes/wikibooks/recipes.json";
import based from "@/data/verified-recipes/based-cooking/recipes.json";
import commons from "@/data/verified-recipes/commons/recipes.json";
import health from "@/data/verified-recipes/source-health.json";
import { dedupeRecipes } from "./recipe-trust";
export const verifiedRecipes = dedupeRecipes(
  [...catalog, ...wikibooks, ...based, ...commons, ...linked].map((recipe) =>
    recipeSchema.parse({
      ...recipe,
      verificationStatus:
        (health as Record<string, { consecutiveFailures: number }>)[recipe.id]
          ?.consecutiveFailures >= 2
          ? "temporarily-unavailable"
          : recipe.verificationStatus,
    }),
  ),
);
export const recipesById = new Map(
  verifiedRecipes.map((recipe) => [recipe.id, recipe]),
);
export const ingredientToRecipes = new Map<string, string[]>();
export const sourceUrlIndex = new Map<string, string>();
export const searchIndex = new Map<string, string>();
for (const recipe of verifiedRecipes) {
  if (recipe.sourceUrl) sourceUrlIndex.set(recipe.sourceUrl, recipe.id);
  searchIndex.set(
    recipe.id,
    [
      recipe.title,
      recipe.originalTitle,
      recipe.provenance.sourceRecipeTitle,
      ...recipe.ingredients.map((item) => item.originalText),
    ].join(" "),
  );
  for (const id of new Set(
    recipe.ingredients.map((item) => item.ingredientId),
  )) {
    ingredientToRecipes.set(id, [
      ...(ingredientToRecipes.get(id) ?? []),
      recipe.id,
    ]);
  }
}
