import fs from "node:fs";
import { createHash } from "node:crypto";
import { verifiedRecipes } from "../lib/verified-recipes";
import {
  canDisplayRecipe,
  canCookRecipe,
  normalizeSourceUrl,
} from "../lib/recipe-trust";
import manifest from "../data/verified-recipes/howtocook/manifest.json";
import {
  assertAtomicHowToCookIngredients,
  extractHowToCookIngredients,
  howToCookCompletenessViolations,
} from "../lib/howtocook-ingredient-parser";
import { recipeSchema } from "../lib/model";
import { validateRecipeSourcePolicy } from "../lib/recipe-source-registry";
import wikiManifest from "../data/verified-recipes/wikibooks/manifest.json";
import { parseWikibooks } from "../lib/wikibooks-parser";
import beginnerEvidence from "../data/recipe-beginner-source-signals.json";
import basedManifest from "../data/verified-recipes/based-cooking/manifest.json";
import { parseBasedCooking } from "../lib/based-cooking-parser";
import commonsManifest from "../data/verified-recipes/commons/manifest.json";
import { parseCommonsRecipe } from "../lib/commons-recipe-parser";
const byId = new Map(manifest.map((m) => [m.id, m]));
const urls = new Set();
for (const evidence of beginnerEvidence) {
  const source = fs.readFileSync(evidence.snapshotPath, "utf8");
  if (
    !source.split("##")[0].includes(evidence.sourcePhrase) ||
    !evidence.sourcePhrase.includes(evidence.sourceDifficulty) ||
    byId.get(evidence.recipeId)?.commit !== evidence.sourceRevision
  )
    throw new Error("Beginner source statement/revision mismatch");
}
for (const recipe of verifiedRecipes) {
  validateRecipeSourcePolicy(recipe);
  if (!canDisplayRecipe(recipe)) throw new Error(`Unverified ${recipe.id}`);
  const url = normalizeSourceUrl(recipe.sourceUrl!);
  if (urls.has(url)) throw new Error(`Duplicate source ${url}`);
  urls.add(url);
  if (recipe.instructionAvailability === "full") {
    if (!canCookRecipe(recipe))
      throw new Error(`Invalid tutorial ${recipe.id}`);
    const record = byId.get(recipe.id);
    if (recipe.sourceProvider === "wikibooks") {
      const entry = wikiManifest.find((item) => item.id === recipe.id);
      if (!entry) throw new Error("Wikibooks snapshot missing");
      const raw = fs.readFileSync(entry.snapshotPath, "utf8");
      const snapshot = JSON.parse(raw);
      if (
        createHash("sha256").update(raw).digest("hex") !== entry.sha256 ||
        String(snapshot.revisionId) !== recipe.provenance.sourceRevision
      )
        throw new Error("Wikibooks revision/checksum mismatch");
      const parsed = parseWikibooks(snapshot.wikitext, snapshot.language);
      if (
        JSON.stringify(
          recipeSchema.shape.ingredients.parse(parsed.ingredients),
        ) !== JSON.stringify(recipe.ingredients) ||
        JSON.stringify(parsed.descriptions) !==
          JSON.stringify(recipe.instructions.map((step) => step.description))
      )
        throw new Error(`Wikibooks source fidelity mismatch: ${recipe.id}`);
      if (
        recipe.provenance.instructionSource !== "open-license-source" ||
        recipe.provenance.httpStatus !== 200
      )
        throw new Error("Wikibooks verification missing");
    }
    if (recipe.sourceProvider === "based-cooking") {
      const entry = basedManifest.find((e) => e.id === recipe.id);
      if (!entry) throw Error("Based Cooking snapshot missing");
      const raw = fs.readFileSync(entry.snapshotPath, "utf8");
      const parsed = parseBasedCooking(raw, entry.operationIngredients);
      if (
        createHash("sha256").update(raw).digest("hex") !== entry.sha256 ||
        recipe.provenance.sourceRevision !== entry.sourceRevision ||
        JSON.stringify(recipe.ingredients) !==
          JSON.stringify(
            recipeSchema.shape.ingredients.parse(parsed.ingredients),
          ) ||
        JSON.stringify(recipe.instructions.map((s) => s.description)) !==
          JSON.stringify(parsed.descriptions)
      )
        throw Error("Based Cooking source identity/content mismatch");
    }
    if (recipe.sourceProvider === "commons") {
      const entry = commonsManifest.find((e) => e.id === recipe.id);
      if (!entry) throw Error("Commons snapshot missing");
      const raw = fs.readFileSync(entry.snapshotPath, "utf8"),
        s = JSON.parse(raw),
        x = parseCommonsRecipe(s.wikitext);
      if (
        createHash("sha256").update(raw).digest("hex") !== entry.sha256 ||
        String(s.revisionId) !== recipe.provenance.sourceRevision ||
        JSON.stringify(recipe.ingredients) !==
          JSON.stringify(recipeSchema.shape.ingredients.parse(x.ingredients)) ||
        JSON.stringify(recipe.instructions.map((i) => i.description)) !==
          JSON.stringify(x.descriptions)
      )
        throw Error("Commons source content/revision mismatch");
    }
    if (record) {
      assertAtomicHowToCookIngredients(recipe.ingredients);
      const source = fs.readFileSync(record.snapshotPath, "utf8");
      if (howToCookCompletenessViolations(source, recipe.ingredients).length)
        throw new Error(`Calculation ingredient omission in ${recipe.id}`);
      const expected = extractHowToCookIngredients(source).ingredients.map(
        (part) => recipeSchema.shape.ingredients.element.parse(part),
      );
      if (JSON.stringify(expected) !== JSON.stringify(recipe.ingredients))
        throw new Error(`Atomic source parsing mismatch in ${recipe.id}`);
      if (createHash("sha256").update(source).digest("hex") !== record.sha256)
        throw new Error("Snapshot checksum mismatch");
      for (const step of recipe.instructions)
        if (!source.includes(step.description))
          throw new Error(`Invented step in ${recipe.id}`);
      for (const item of recipe.ingredients)
        if (
          !source.includes(item.originalText) ||
          (item.sourceGroupText && !source.includes(item.sourceGroupText))
        )
          throw new Error(`Invented ingredient in ${recipe.id}`);
    }
  } else if (recipe.instructions.length)
    throw new Error("Source-only record has instructions");
  if (
    recipe.instructionAvailability === "source-only" &&
    ["Budget Bytes", "Love and Lemons"].includes(recipe.sourceName)
  ) {
    const snapshot = JSON.parse(
      fs.readFileSync(
        `data/verified-recipes/source-linked/snapshots/${recipe.id.split(":")[1]}.json`,
        "utf8",
      ),
    );
    if (
      snapshot.id !== recipe.id ||
      snapshot.sourceUrl !== recipe.sourceUrl ||
      snapshot.title !== recipe.provenance.sourceRecipeTitle ||
      snapshot.httpStatus !== 200 ||
      JSON.stringify(snapshot.ingredientIdentities) !==
        JSON.stringify(recipe.ingredients)
    )
      throw new Error(`Source-linked factual snapshot mismatch: ${recipe.id}`);
    if (snapshot.instructions || snapshot.image || snapshot.description)
      throw new Error(
        "Commercial prose/image must not enter factual snapshots",
      );
  }
}
console.log(
  `Validated ${verifiedRecipes.length} records, source identity, attribution and full instruction snapshot integrity.`,
);
