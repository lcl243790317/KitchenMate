import recipe from "@/tests/fixtures/first-party-recipe.json";
export const exampleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Recipe",
  name: recipe.title,
  description: recipe.description,
  author: { "@type": "Organization", name: "KitchenMate" },
  recipeYield: `${recipe.servings} 人份`,
  totalTime: "PT15M",
  recipeIngredient: recipe.ingredients.map((item) => item.originalText),
  recipeInstructions: recipe.instructions.map((step) => ({
    "@type": "HowToStep",
    text: step.description,
  })),
};
