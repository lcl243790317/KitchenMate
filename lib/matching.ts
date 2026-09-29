import { ingredients } from "./ingredients";
import type { Recipe, PantryItem } from "./model";
export function matchRecipe(recipe: Recipe, pantry: PantryItem[]) {
  const ids = new Set(pantry.map((p) => p.ingredientId));
  const required = recipe.ingredients.filter((i) => !i.optional);
  const available = required.filter((i) => ids.has(i.ingredientId));
  const missing = required.filter((i) => !ids.has(i.ingredientId));
  const staple = (id: string) =>
    ingredients.find((i) => i.id === id)?.pantryStaple ?? false;
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
    inventoryScore:
      available.filter((i) => !staple(i.ingredientId)).length +
      available.filter((i) => expiring.includes(i.ingredientId)).length * 2,
  };
}
export function searchRecipe(r: Recipe, q: string) {
  return q
    .trim()
    .split(/\s+/)
    .every((term) =>
      [
        r.title,
        r.description,
        ...r.tags,
        ...r.ingredients.flatMap((x) => {
          const i = ingredients.find((i) => i.id === x.ingredientId);
          return [
            x.originalText,
            i?.displayNameZh ?? "",
            i?.displayNameEn ?? "",
            ...(i?.aliases ?? []),
          ];
        }),
      ]
        .join(" ")
        .toLowerCase()
        .includes(
          term
            .toLowerCase()
            .replace("西红柿", "番茄")
            .replace("炒鸡蛋", "炒蛋"),
        ),
    );
}
