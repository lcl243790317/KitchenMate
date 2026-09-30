import { parseWikiIngredient } from "./wikibooks-parser";
/** Only explicitly labeled recipe text in a reviewed file-description page. Never infer a recipe from a photo. */
export function parseCommonsRecipe(wikitext: string) {
  const description = wikitext.match(
    /\| Description = ([^]*?)(?=\n\| Source)/,
  )?.[1];
  if (
    !description ||
    !description.startsWith("Ingredients (for two people)\n") ||
    !wikitext.includes("pelican") ||
    !wikitext.includes("{{cc-by-sa-2.0}}")
  )
    throw Error("Reviewed description/author/license required");
  const material = description.split("\n\n\nDirections\n")[0];
  const procedure = description.split("\n\n\nDirections\n")[1];
  if (!procedure) throw Error("Explicit complete Directions required");
  const ingredients = material
    .split("\n")
    .filter((l) => l.startsWith("- "))
    .map((line) => parseWikiIngredient(line.slice(2), false));
  const descriptions = [
    ...procedure.matchAll(/^\d+\. ([^]*?)(?=^\d+\. |$(?![^]))/gm),
  ].map((m) => m[1].trim());
  if (descriptions.length !== 9 || ingredients.length !== 6)
    throw Error("Source structure changed: review required");
  ingredients.push({
    ingredientId: "water",
    originalText: "cold water",
    quantity: null,
    unit: "",
    optional: false,
    group: "原料",
    verificationMethod: "source-operation-explicit",
  });
  return { ingredients, descriptions };
}
