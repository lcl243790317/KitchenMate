import { canDisplayRecipe } from "./recipe-trust";
import type { Recipe } from "./model";
import { searchRecipe } from "./matching";
import { beginnerSignals, compareBeginnerRecipes } from "./beginner-recipes";
import { recipeSourcePolicy } from "./recipe-source-registry";
export function browseSource(recipe: Recipe) {
  return recipeSourcePolicy(recipe)?.name ?? recipe.sourceName;
}

export function browseCategory(recipe: Recipe) {
  // Preserve source categories; do not infer cuisine or cooking difficulty.
  return recipe.category || "未分类";
}
export function browseRecipes(
  recipes: Recipe[],
  query = "",
  category = "",
  source = "",
  beginner = false,
  quick = false,
) {
  return recipes
    .filter(
      (recipe) =>
        canDisplayRecipe(recipe) &&
        searchRecipe(recipe, query) &&
        (!category || browseCategory(recipe) === category) &&
        (!source || browseSource(recipe) === source) &&
        (!beginner || beginnerSignals(recipe).beginnerFriendly) &&
        (!quick || (recipe.totalTime !== null && recipe.totalTime <= 30)),
    )
    .sort((a, b) =>
      beginner
        ? compareBeginnerRecipes(a, b)
        : a.title.localeCompare(b.title, "zh-CN") || a.id.localeCompare(b.id),
    );
}
