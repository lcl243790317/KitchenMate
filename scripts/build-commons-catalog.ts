import fs from "node:fs";
import { createHash } from "node:crypto";
import { parseCommonsRecipe } from "../lib/commons-recipe-parser";
import { recipeSchema } from "../lib/model";
import manifest from "../data/verified-recipes/commons/manifest.json";
import wiki from "../data/verified-recipes/wikibooks/recipes.json";
const recipes = manifest.map((entry) => {
  const raw = fs.readFileSync(entry.snapshotPath, "utf8"),
    s = JSON.parse(raw);
  if (
    createHash("sha256").update(raw).digest("hex") !== entry.sha256 ||
    s.revisionId !== entry.revisionId
  )
    throw Error("Commons pinned source modified");
  const x = parseCommonsRecipe(s.wikitext);
  const sourceUrl =
    "https://commons.wikimedia.org/wiki/" +
    encodeURIComponent(s.title.replaceAll(" ", "_"));
  return recipeSchema.parse({
    ...wiki[0],
    id: entry.id,
    slug: entry.id,
    title: "讃岐乌冬面",
    originalTitle: "Sanuki udon noodle",
    titleTranslation: "KitchenMate",
    sourceProvider: "commons",
    sourceName: "Wikimedia Commons",
    sourceUrl,
    sourceAuthor: "pelican",
    externalId: String(s.pageid),
    description: "来源文件描述中明确提供了完整原料与步骤；保留英文原文。",
    provenance: {
      ...wiki[0].provenance,
      sourceName: "Wikimedia Commons",
      sourceUrl,
      sourceRecipeTitle: "Sanuki udon noodle",
      sourceAuthor: "pelican",
      sourceExternalId: String(s.pageid),
      sourceRevision: String(s.revisionId),
      verifiedAt: s.retrievedAt,
      lastVerifiedAt: s.retrievedAt,
      licenseOrUsageBasis:
        "Commons unstructured text CC BY-SA 4.0. Original attribution: pelican (Flickr). Image separately CC BY-SA 2.0; not reused.",
      attributionText:
        "pelican / Wikimedia Commons file-description text. Based on the original Sanuki udon noodle description from Flickr. Formatting and Chinese translation: KitchenMate, CC BY-SA 4.0. Image not reused.",
    },
    ingredients: x.ingredients,
    instructions: x.descriptions.map((description, i) => ({
      stepNumber: i + 1,
      title: "Original step " + (i + 1),
      description,
      durationSeconds: null,
    })),
    category: "主食",
    sourceDifficulty: undefined,
    difficulty: "未知",
    totalTime: null,
    servings: 2,
    servingsEstimated: false,
    equipment: [],
    sourceNotes:
      "来源：文件描述中的 Ingredients 与 Directions。Udon soup 是原文预制汤底，未猜测其配方或拆成额外必需食材。图片未复用。",
    createdAt: s.retrievedAt,
    updatedAt: s.retrievedAt,
    lastFetchedAt: s.retrievedAt,
  });
});
fs.writeFileSync(
  "data/verified-recipes/commons/recipes.json",
  JSON.stringify(recipes, null, 2) + "\n",
);
console.log(
  `Rebuilt ${recipes.length} explicit Commons description tutorials.`,
);
