import { canDisplayRecipe } from "./recipe-trust";
import type { Recipe } from "./model";
import { searchRecipe } from "./matching";

export function browseCategory(recipe: Recipe) {
  // Preserve source categories; do not infer cuisine or cooking difficulty.
  return recipe.category || "未分类";
}
export function browseRecipes(
  recipes: Recipe[],
  query = "",
  category = "",
  source = "",
) {
  return recipes
    .filter(
      (recipe) =>
        canDisplayRecipe(recipe) &&
        searchRecipe(recipe, query) &&
        (!category || browseCategory(recipe) === category) &&
        (!source || recipe.sourceName === source),
    )
    .sort(
      (a, b) =>
        a.title.localeCompare(b.title, "zh-CN") || a.id.localeCompare(b.id),
    );
}
