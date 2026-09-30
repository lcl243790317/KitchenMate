import {
  ingredientById,
  normalizeSearchQuery,
  normalizeIngredientText,
} from "./ingredients";
import type { Recipe, PantryItem, RecipeIngredient } from "./model";
import recipeAliases from "@/data/recipe-search-aliases.json";
export function selectedIngredientIds(pantry: PantryItem[]) {
  const ids = new Set<string>();
  for (const item of pantry) {
    let id: string | undefined = item.ingredientId;
    const visited = new Set<string>();
    while (id && !visited.has(id)) {
      visited.add(id);
      ids.add(id);
      id = ingredientById.get(id)?.parentIngredientId;
    }
  }
  return ids;
}
export function matchRecipe(recipe: Recipe, pantry: PantryItem[]) {
  const ids = selectedIngredientIds(pantry);
  const required = [
    ...new Map(
      recipe.ingredients
        .filter((i) => !i.optional)
        .map((i) => [i.ingredientId, i]),
    ).values(),
  ];
  const available = required.filter((i) => ids.has(i.ingredientId));
  const missing = required.filter((i) => !ids.has(i.ingredientId));
  const staple = (id: string) => ingredientById.get(id)?.pantryStaple ?? false;
  const weight = (item: RecipeIngredient) =>
    staple(item.ingredientId) ? 0.15 : /辅料|调料/.test(item.group) ? 0.7 : 1;
  const total = required.reduce((sum, item) => sum + weight(item), 0);
  const weightedCoverage = total
    ? available.reduce((sum, item) => sum + weight(item), 0) / total
    : 0;
  const core = required.filter((i) => !staple(i.ingredientId));
  const matchedCore = available.filter((i) => !staple(i.ingredientId));
  const score = matchedCore.length
    ? Math.round(weightedCoverage * 100)
    : Math.min(15, Math.round(weightedCoverage * 100));
  const used = pantry.filter((item) => {
    const expanded = selectedIngredientIds([item]);
    return required.some((i) => expanded.has(i.ingredientId));
  }).length;
  return {
    score,
    available,
    missing,
    matchedRequiredIngredients: available,
    missingRequiredIngredients: missing,
    availableRequiredIngredients: available.length,
    totalRequiredIngredients: required.length,
    optionalIngredients: recipe.ingredients.filter((i) => i.optional),
    missingCore: core.length - matchedCore.length,
    selectedIngredientUsage: pantry.length ? used / pantry.length : 0,
    ingredientCoverage: required.length
      ? available.length / required.length
      : 0,
    weightedCoverage,
  };
}
const recipeSearchIndex = new WeakMap<Recipe, string>();
const ingredientNamesByLength = [...ingredientById.values()]
  .map((item) => item.displayNameZh)
  .filter((name) => name.length >= 2)
  .sort((a, b) => b.length - a.length);
function searchText(recipe: Recipe) {
  const cached = recipeSearchIndex.get(recipe);
  if (cached) return cached;
  const text = normalizeIngredientText(
    [
      recipe.title,
      ...((recipeAliases as Record<string, string[]>)[recipe.title] ?? []),
      recipe.description,
      recipe.cuisine,
      recipe.category,
      ...recipe.tags,
      ...recipe.ingredients.flatMap((item) => {
        const ingredient = ingredientById.get(item.ingredientId);
        return [
          item.originalText,
          ingredient?.displayNameZh ?? "",
          ingredient?.displayNameEn ?? "",
          ...(ingredient?.aliases ?? []),
        ];
      }),
    ].join(" "),
  );
  recipeSearchIndex.set(recipe, text);
  return text;
}
export function searchRecipe(r: Recipe, q: string) {
  const indexed = searchText(r);
  return normalizeSearchQuery(q)
    .split(/\s+/)
    .every((term) => {
      if (indexed.includes(term)) return true;
      // A compound Chinese dish name can contain several known ingredients and a cooking verb.
      let remaining = term;
      const parts: string[] = [];
      for (const name of ingredientNamesByLength) {
        if (!remaining.includes(name)) continue;
        remaining = remaining.replace(name, "");
        parts.push(name);
      }
      return (
        parts.length > 0 &&
        parts.every((part) => indexed.includes(part)) &&
        (!remaining || indexed.includes(remaining))
      );
    });
}

export function matchesRecommendationMode(
  recipe: Recipe,
  pantry: PantryItem[],
  mode: string,
) {
  const match = matchRecipe(recipe, pantry);
  if (match.selectedIngredientUsage === 0) return false;
  if (mode === "现在就能做") return match.missingCore === 0;
  if (mode === "只差一样") return match.missingCore === 1;
  if (mode === "只差两样") return match.missingCore === 2;
  if (mode === "快手菜")
    return recipe.totalTime !== null && recipe.totalTime <= 30;
  return true;
}
