import { ingredientById, normalizeSearchQuery, normalizeIngredientText } from "./ingredients";
import type { Recipe, PantryItem } from "./model";
export function matchRecipe(recipe: Recipe, pantry: PantryItem[]) {
  const ids = new Set(pantry.map((p) => p.ingredientId));
  const required = recipe.ingredients.filter((i) => !i.optional);
  const available = required.filter((i) => ids.has(i.ingredientId));
  const missing = required.filter((i) => !ids.has(i.ingredientId));
  const staple = (id: string) => ingredientById.get(id)?.pantryStaple ?? false;
  const weight = (id: string) => (staple(id) ? 0.15 : 1);
  const total = required.reduce((s, i) => s + weight(i.ingredientId), 0);
  const score = total
    ? Math.round(
        (available.reduce((s, i) => s + weight(i.ingredientId), 0) / total) *
          100,
      )
    : 100;
  const expiring = pantry
    .filter(
      (p) =>
        p.expiryDate &&
        new Date(p.expiryDate).getTime() >= Date.now() - 86400000 &&
        new Date(p.expiryDate).getTime() - Date.now() < 3 * 86400000,
    )
    .map((p) => p.ingredientId);
  const pantryById = new Map(pantry.map((item) => [item.ingredientId, item]));
  const quantityKnown = available.filter((item) => {
    const stock = pantryById.get(item.ingredientId);
    return stock?.quantity !== null && stock?.quantity !== undefined && item.quantity !== null && item.unit === stock.unit;
  });
  const quantityEnough = quantityKnown.filter((item) => (pantryById.get(item.ingredientId)?.quantity ?? 0) >= (item.quantity ?? 0));
  return {
    score,
    available,
    missing,
    availableRequiredIngredients: available.length,
    totalRequiredIngredients: required.length,
    missingRequiredIngredients: missing.length,
    optionalIngredients: recipe.ingredients.filter((i) => i.optional),
    missingCore: missing.filter((i) => !staple(i.ingredientId)).length,
    pantryCoverage: pantry.length
      ? new Set(available.map((i) => i.ingredientId)).size / pantry.length
      : 0,
    ingredientCoverage: required.length ? available.length / required.length : 1,
    quantityCoverage: quantityKnown.length ? quantityEnough.length / quantityKnown.length : null,
    quantityConfidence: quantityKnown.length / Math.max(1, available.length),
    quantityShortfalls: quantityKnown.filter((item) => (pantryById.get(item.ingredientId)?.quantity ?? 0) < (item.quantity ?? 0)),
    inventoryScore:
      available.filter((i) => !staple(i.ingredientId)).length +
      available.filter((i) => expiring.includes(i.ingredientId)).length * 2,
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
  const text = normalizeIngredientText([
    recipe.title, recipe.description, recipe.cuisine, recipe.category,
    ...recipe.tags,
    ...recipe.ingredients.flatMap((item) => {
      const ingredient = ingredientById.get(item.ingredientId);
      return [item.originalText, ingredient?.displayNameZh ?? "", ingredient?.displayNameEn ?? "", ...(ingredient?.aliases ?? [])];
    }),
  ].join(" "));
  recipeSearchIndex.set(recipe, text);
  return text;
}
export function searchRecipe(r: Recipe, q: string) {
  const indexed = searchText(r);
  return normalizeSearchQuery(q).split(/\s+/).every((term) => {
    if (indexed.includes(term)) return true;
    // A compound Chinese dish name can contain several known ingredients and a cooking verb.
    let remaining = term;
    const parts: string[] = [];
    for (const name of ingredientNamesByLength) {
      if (!remaining.includes(name)) continue;
      remaining = remaining.replace(name, "");
      parts.push(name);
    }
    return parts.length > 0 && parts.every((part) => indexed.includes(part)) && (!remaining || indexed.includes(remaining));
  });
}
