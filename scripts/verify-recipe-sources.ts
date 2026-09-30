import fs from "node:fs";
import { createHash, randomInt } from "node:crypto";
import { verifiedRecipes } from "../lib/verified-recipes";
import manifest from "../data/verified-recipes/howtocook/manifest.json";
import { safeFetchHtml } from "../lib/safe-fetch";
import { parseRecipeHtml } from "../lib/recipe-parser";
import wikiManifest from "../data/verified-recipes/wikibooks/manifest.json";
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
  const sourceChanges: {
    id: string;
    source: string;
    status: string;
    detail: string;
  }[] = [];
  // One official API request for all Wikibooks sources. No per-page burst and no live CI dependency.
  const wikiRecipes = verifiedRecipes.filter(
    (r) => r.sourceProvider === "wikibooks",
  );
  const wikiUrl = new URL("https://en.wikibooks.org/w/api.php");
  wikiUrl.search = new URLSearchParams({
    action: "query",
    prop: "revisions",
    pageids: wikiRecipes.map((r) => r.externalId).join("|"),
    rvprop: "ids|content",
    rvslots: "main",
    format: "json",
    formatversion: "2",
    maxlag: "5",
  }).toString();
  const wikiResponse = await fetch(wikiUrl, {
    signal: AbortSignal.timeout(30000),
    headers: {
      "User-Agent":
        "KitchenMate source verification (github.com/lcl243790317/KitchenMate)",
    },
  });
  const wikiData = wikiResponse.ok
    ? await wikiResponse.json()
    : { query: { pages: [] } };
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
      if (recipe.sourceProvider === "wikibooks") {
        const snapshot = wikiManifest.find((m) => m.id === recipe.id)!;
        const local = JSON.parse(
          fs.readFileSync(snapshot.snapshotPath, "utf8"),
        );
        const latest = wikiData.query?.pages.find(
          (p: { pageid: number }) => String(p.pageid) === recipe.externalId,
        )?.revisions?.[0];
        data.httpStatus = wikiResponse.status;
        if (!latest)
          throw new Error(
            "Official MediaWiki API unavailable; no snapshot changed",
          );
        const changed = String(latest.revid) !== String(local.revisionId);
        sourceChanges.push({
          id: recipe.id,
          source: recipe.sourceName,
          status: changed ? "updated upstream" : "unchanged",
          detail: changed
            ? `Pinned ${local.revisionId}; upstream ${latest.revid}; manual content/license review required`
            : "Exact revision unchanged",
        });
        data.ingredientCount = recipe.ingredients.length;
        data.instructionCount = recipe.instructions.length;
      } else if (record) {
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
    if (recipe.sourceProvider !== "wikibooks")
      sourceChanges.push({
        id: recipe.id,
        source: recipe.sourceName,
        status:
          data.httpStatus === 404
            ? "404"
            : data.status === "verified"
              ? "unchanged"
              : "review required",
        detail:
          data.error ||
          "Source identity checked; no automatic catalog mutation",
      });
    console.log(`${data.status} ${data.title}`);
  }
  fs.writeFileSync(oldPath, JSON.stringify(records, null, 2));
  fs.writeFileSync(
    "docs/RECIPE_SOURCE_CHANGES.md",
    `# Recipe source changes\n\nReport only. Updated upstream content, license notices, redirects and structured-data changes require manual review; never automatically overwrite instructions or delete recipes. Images remain separately licensed.\n\n| ID | Source | Status | Detail |\n|---|---|---|---|\n${sourceChanges.map((r) => `|${r.id}|${r.source}|${r.status}|${r.detail.replaceAll("|", "/")}|`).join("\n")}\n`,
  );
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
