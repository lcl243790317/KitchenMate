import fs from "node:fs";
import { createHash, randomInt } from "node:crypto";
import { verifiedRecipes } from "../lib/verified-recipes";
import manifest from "../data/verified-recipes/howtocook/manifest.json";
import { safeFetchHtml } from "../lib/safe-fetch";
import { parseRecipeHtml } from "../lib/recipe-parser";
async function main() {
  if (process.env.LIVE_RECIPE_VERIFICATION !== "true")
    throw new Error("Opt in with LIVE_RECIPE_VERIFICATION=true");
  const count = Number(
    process.env.RECIPE_VERIFY_LIMIT ?? verifiedRecipes.length,
  );
  const sample = [...verifiedRecipes];
  for (let i = sample.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [sample[i], sample[j]] = [sample[j], sample[i]];
  }
  const records = [];
  const oldPath = "docs/LIVE_RECIPE_VERIFICATION.json";
  const previous: { sourceUrl: string; consecutiveFailures?: number }[] =
    fs.existsSync(oldPath) ? JSON.parse(fs.readFileSync(oldPath, "utf8")) : [];
  for (const recipe of sample.slice(0, count)) {
    const data = {
      id: recipe.id,
      title: recipe.title,
      sourceUrl: recipe.sourceUrl,
      lastVerifiedAt: recipe.provenance.verifiedAt,
      lastCheckedAt: new Date().toISOString(),
      httpStatus: 0,
      structuredData: false,
      ingredientCount: 0,
      instructionCount: 0,
      status: "unverified",
      consecutiveFailures: 0,
      error: "",
    };
    try {
      const record = manifest.find((m) => m.id === recipe.id);
      if (record) {
        const page = await fetch(record.sourceUrl, {
          signal: AbortSignal.timeout(15000),
        });
        data.httpStatus = page.status;
        if (!page.ok) throw new Error(`Source page HTTP ${page.status}`);
        const raw = await fetch(record.rawUrl, {
          signal: AbortSignal.timeout(15000),
        });
        if (!raw.ok) throw new Error(`Snapshot HTTP ${raw.status}`);
        const content = await raw.text();
        if (
          createHash("sha256").update(content).digest("hex") !==
            record.sha256 ||
          !content.includes(recipe.provenance.sourceRecipeTitle)
        )
          throw new Error("Source title or checksum changed");
        for (const step of recipe.instructions)
          if (!content.includes(step.description))
            throw new Error("Instruction mismatch");
        for (const ingredient of recipe.ingredients)
          if (!content.includes(ingredient.originalText))
            throw new Error("Ingredient mismatch");
        data.ingredientCount = recipe.ingredients.length;
        data.instructionCount = recipe.instructions.length;
      } else {
        const page = await safeFetchHtml(recipe.sourceUrl!);
        const parsed = parseRecipeHtml(page.html, page.url);
        data.httpStatus = 200;
        data.structuredData = true;
        data.ingredientCount = parsed.ingredients.length;
        data.instructionCount = parsed.instructions.length;
        if (parsed.title !== recipe.title)
          throw new Error("Source title changed");
      }
      data.lastVerifiedAt = new Date().toISOString();
      data.status = "verified";
    } catch (error) {
      data.consecutiveFailures =
        (previous.find((p) => p.sourceUrl === data.sourceUrl)
          ?.consecutiveFailures ?? 0) + 1;
      data.status = "temporarily-unavailable";
      data.error = String(error);
    }
    records.push(data);
    console.log(`${data.status} ${data.title}`);
  }
  fs.writeFileSync(oldPath, JSON.stringify(records, null, 2));
  const healthPath = "data/verified-recipes/source-health.json";
  const health = JSON.parse(fs.readFileSync(healthPath, "utf8"));
  for (const record of records)
    health[record.id] = {
      consecutiveFailures: record.consecutiveFailures,
      lastCheckedAt: record.lastCheckedAt,
      status: record.status,
    };
  fs.writeFileSync(healthPath, JSON.stringify(health, null, 2));
  if (records.some((r) => r.status !== "verified")) process.exitCode = 1;
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
