import fs from "node:fs";
import { verifiedImportExamples } from "../lib/import-examples";
import { safeFetchHtml } from "../lib/safe-fetch";
import { parseRecipeHtml } from "../lib/recipe-parser";
import { ingredientName } from "../lib/ingredients";
async function main() {
  const linked = [];
  const results = [];
  const examplesPath = "data/verified-import-examples.json";
  const examples = JSON.parse(fs.readFileSync(examplesPath, "utf8"));
  for (const example of verifiedImportExamples) {
    try {
      const page = await safeFetchHtml(example.url);
      const recipe = parseRecipeHtml(page.html, page.url);
      const unknown = recipe.ingredients.filter((i) =>
        i.ingredientId.startsWith("unknown:"),
      );
      results.push({
        url: example.url,
        title: recipe.title,
        lastVerifiedAt: new Date().toISOString(),
        status: "verified",
        structuredData: true,
        ingredientCount: recipe.ingredients.length,
        instructionCount: recipe.instructions.length,
        knownIngredients: recipe.ingredients.length - unknown.length,
        unknownIngredients: unknown.map((i) => i.originalText),
        unknownRate: unknown.length / recipe.ingredients.length,
      });
      // Index only factual ingredient identities and a title. No copyrighted instructions or descriptions are redistributed.
      linked.push({
        ...recipe,
        id: `source:${new URL(example.url).hostname}:${recipe.id.split(":")[1]}`,
        sourceProvider: "source-index",
        description: "已访问原始菜谱页；完整步骤请在来源网站查看。",
        instructions: [],
        image: null,
        ingredients: recipe.ingredients.map((i) => ({
          ...i,
          originalText: ingredientName(i.ingredientId),
          quantity: null,
          unit: "",
        })),
        provenance: {
          ...recipe.provenance,
          type: "SOURCE_LINKED",
          verificationMethod: "schema-org-jsonld",
          instructionSource: "none",
          licenseOrUsageBasis:
            "Factual title, ingredient identities and attribution link only. No third-party instructions, photos or descriptive prose redistributed.",
        },
        verificationStatus: "source-linked",
        instructionAvailability: "source-only",
        sourceSnapshot: undefined,
      });
    } catch (error) {
      results.push({
        url: example.url,
        status: "temporarily-unavailable",
        lastCheckedAt: new Date().toISOString(),
        error: String(error),
      });
    }
    console.log(results.at(-1));
  }
  fs.mkdirSync("data/verified-recipes/source-linked", { recursive: true });
  fs.writeFileSync(
    "data/verified-recipes/source-linked/recipes.json",
    JSON.stringify(linked, null, 2),
  );
  fs.writeFileSync(
    "docs/IMPORT_VERIFICATION.json",
    JSON.stringify(results, null, 2),
  );
  for (const example of examples) {
    const result = results.find((r) => r.url === example.url);
    if (result) {
      example.status = result.status;
      if (result.status === "verified" && result.lastVerifiedAt)
        example.verifiedAt = result.lastVerifiedAt.slice(0, 10);
    }
  }
  fs.writeFileSync(examplesPath, JSON.stringify(examples, null, 2));
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
