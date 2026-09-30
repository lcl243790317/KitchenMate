import type { Recipe } from "./model";
import registry from "@/data/recipe-sources.json";
export const recipeSources = registry;
export function recipeSourcePolicy(recipe: Recipe) {
  return registry.find(
    (source) =>
      source.providers.includes(recipe.sourceProvider) ||
      (recipe.sourceUrl &&
        source.hosts.includes(new URL(recipe.sourceUrl).hostname)),
  );
}
export function validateRecipeSourcePolicy(recipe: Recipe) {
  const source = recipeSourcePolicy(recipe);
  if (!source) throw new Error(`Unregistered formal source: ${recipe.id}`);
  if (
    recipe.instructionAvailability === "full" &&
    (!source.fullInstructionsAllowed ||
      recipe.provenance.instructionSource === "none")
  )
    throw new Error(
      `Full instructions forbidden by source policy: ${recipe.id}`,
    );
  if (recipe.image && !source.imagesAllowed)
    throw new Error(`Image reuse not authorized: ${recipe.id}`);
  if (
    recipe.instructionAvailability === "full" &&
    recipe.provenance.type === "OPEN_LICENSE" &&
    source.id !== "howtocook" &&
    (!recipe.provenance.licenseName ||
      !recipe.provenance.licenseUrl ||
      !recipe.provenance.attributionText ||
      !recipe.provenance.sourceRevision ||
      recipe.provenance.licenseName !== source.licenseName)
  )
    throw Error(`Open-license notice/revision missing: ${recipe.id}`);
  if (
    source.id === "wikibooks" &&
    (recipe.provenance.licenseName !== "CC BY-SA 4.0" ||
      !recipe.provenance.licenseUrl ||
      !recipe.provenance.attributionText ||
      !recipe.provenance.sourceRevision ||
      recipe.provenance.verificationMethod !== "mediawiki-api")
  )
    throw new Error(`Wikibooks attribution/revision missing: ${recipe.id}`);
}
