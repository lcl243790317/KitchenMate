import fs from "node:fs";
import { createHash } from "node:crypto";
import { parseBasedCooking } from "../lib/based-cooking-parser";
import { recipeSchema } from "../lib/model";
import { validateRecipeSourcePolicy } from "../lib/recipe-source-registry";
import manifest from "../data/verified-recipes/based-cooking/manifest.json";
import wiki from "../data/verified-recipes/wikibooks/recipes.json";
const recipes = manifest.map((entry) => {
  const raw = fs.readFileSync(entry.snapshotPath, "utf8");
  if (
    createHash("sha256").update(raw).digest("hex") !== entry.sha256 ||
    entry.httpStatus !== 200
  )
    throw Error("Based Cooking snapshot checksum/status mismatch");
  const x = parseBasedCooking(raw, entry.operationIngredients);
  const sourceUrl =
    "https://based.cooking/" +
    entry.path.replace("content/", "").replace(".md", "") +
    "/";
  const recipe = recipeSchema.parse({
    ...wiki[0],
    id: entry.id,
    slug: entry.id,
    title: entry.title,
    originalTitle: x.title,
    titleTranslation: "KitchenMate",
    description: "Based Cooking 开放授权教程；原始步骤和用量保持来源内容。",
    sourceProvider: "based-cooking",
    sourceName: "Based Cooking",
    sourceUrl,
    sourceAuthor: x.author,
    externalId: entry.path,
    provenance: {
      type: "OPEN_LICENSE",
      sourceName: "Based Cooking",
      sourceUrl,
      sourceRecipeTitle: x.title,
      sourceAuthor: x.author,
      sourceExternalId: entry.path,
      sourceRevision: entry.sourceRevision,
      verifiedAt: entry.retrievedAt,
      lastVerifiedAt: entry.retrievedAt,
      httpStatus: 200,
      verificationMethod: "open-license-dataset",
      instructionSource: "open-license-source",
      imageSource: null,
      licenseOrUsageBasis:
        "README dedicates all website content to public domain; repository Unlicense. Images not reused.",
      licenseName: "The Unlicense",
      licenseUrl:
        "https://github.com/LukeSmithxyz/based.cooking/blob/" +
        entry.sourceRevision +
        "/LICENSE.md",
      attributionText:
        x.author +
        " / Based Cooking. Original text preserved; Chinese title translated by KitchenMate.",
    },
    category: /soup|chowder/.test(entry.path)
      ? "汤"
      : /pancake|cookies/.test(entry.path)
        ? "主食"
        : "其他",
    difficulty: x.sourceDifficulty ? "简单" : "未知",
    sourceDifficulty: x.sourceDifficulty,
    prepTime: x.prepTime,
    cookTime: x.cookTime,
    totalTime: x.totalTime,
    servings: x.servings,
    servingsEstimated: x.servingsEstimated,
    ingredients: x.ingredients,
    instructions: x.descriptions.map((description, index) => ({
      stepNumber: index + 1,
      title: "Original step " + (index + 1),
      description,
      durationSeconds: null,
    })),
    sourceNotes: x.sourceNotes,
    equipment: x.equipment,
    createdAt: entry.retrievedAt,
    updatedAt: entry.retrievedAt,
    sourceUpdatedAt: null,
    lastFetchedAt: entry.retrievedAt,
  });
  validateRecipeSourcePolicy(recipe);
  return recipe;
});
fs.writeFileSync(
  "data/verified-recipes/based-cooking/recipes.json",
  JSON.stringify(recipes, null, 2) + "\n",
);
console.log(`Rebuilt ${recipes.length} pinned Based Cooking tutorials.`);
