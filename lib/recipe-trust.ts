import type { Recipe } from "./model";

export function canDisplayRecipe(recipe: Recipe): boolean {
  const p = recipe.provenance;
  if (!p || ["UNVERIFIED", "FIRST_PARTY_TEST"].includes(p.type)) return false;
  if (
    !p.sourceUrl ||
    !p.sourceName.trim() ||
    !p.sourceRecipeTitle.trim() ||
    !p.verifiedAt ||
    !p.verificationMethod ||
    !p.licenseOrUsageBasis.trim()
  )
    return false;
  if (
    recipe.sourceUrl !== p.sourceUrl ||
    recipe.verificationStatus === "unverified"
  )
    return false;
  try {
    if (new URL(p.sourceUrl).protocol !== "https:") return false;
  } catch {
    return false;
  }
  if (recipe.instructionAvailability === "source-only")
    return p.type === "SOURCE_LINKED" && recipe.instructions.length === 0;
  return hasFullInstructions(recipe);
}
function hasFullInstructions(recipe: Recipe) {
  return (
    recipe.ingredients.length >= 2 &&
    recipe.instructions.length >= 1 &&
    recipe.provenance.instructionSource !== "none" &&
    recipe.instructions.every(
      (step, index) =>
        step.stepNumber === index + 1 && step.description.trim().length > 0,
    )
  );
}
export function canCookRecipe(recipe: Recipe): boolean {
  return (
    canDisplayRecipe(recipe) &&
    recipe.instructionAvailability === "full" &&
    hasFullInstructions(recipe)
  );
}
export function normalizeSourceUrl(url: string) {
  const parsed = new URL(url);
  parsed.hash = "";
  for (const key of [...parsed.searchParams.keys()])
    if (/^(utm_|fbclid|gclid)/.test(key)) parsed.searchParams.delete(key);
  return parsed.toString().replace(/\/$/, "");
}
export function dedupeRecipes(recipes: Recipe[]) {
  const identities = new Set<string>();
  const urls = new Set<string>();
  return [...recipes]
    .sort((a, b) => Number(canCookRecipe(b)) - Number(canCookRecipe(a)))
    .filter((recipe) => {
      if (!canDisplayRecipe(recipe)) return false;
      const identity = `${recipe.sourceProvider}:${recipe.externalId ?? recipe.id}`;
      const url = normalizeSourceUrl(recipe.sourceUrl!);
      if (identities.has(identity) || urls.has(url)) return false;
      identities.add(identity);
      urls.add(url);
      return true;
    });
}
