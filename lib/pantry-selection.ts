import primary from "@/data/ingredients/pantry-primary.json";
import {
  ingredientById,
  ingredients,
  normalizeIngredientText,
} from "./ingredients";

// Presentation only: parsing and matching always use the complete vocabulary.
export const pantryPrimary = primary.ingredients.map((entry) => ({
  ...ingredientById.get(entry.ingredientId)!,
  pantryUiCategory: entry.pantryUiCategory,
}));
export const pantryCommonIds = new Set(primary.common);
export const pantryUiCategories = [
  ...new Set(pantryPrimary.map((i) => i.pantryUiCategory)),
];
export function searchPantryIngredients(query: string) {
  const normalized = normalizeIngredientText(query);
  return ingredients.filter((item) =>
    [item.displayNameZh, item.displayNameEn, ...item.aliases].some((value) =>
      normalizeIngredientText(value).includes(normalized),
    ),
  );
}
