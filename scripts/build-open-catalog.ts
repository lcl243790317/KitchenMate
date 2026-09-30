import fs from "node:fs";
import { createHash } from "node:crypto";
import {
  assertAtomicHowToCookIngredients,
  howToCookMaterialBullets,
  parseHowToCookIngredientBullet,
} from "../lib/howtocook-ingredient-parser";
import { recipeSchema } from "../lib/model";
import { canCookRecipe } from "../lib/recipe-trust";

async function main() {
  if (process.argv.includes("--snapshots")) {
    const dir = "data/verified-recipes/howtocook";
    const records = recipeSchema
      .array()
      .parse(JSON.parse(fs.readFileSync(`${dir}/recipes.json`, "utf8")));
    const manifest = JSON.parse(
      fs.readFileSync(`${dir}/manifest.json`, "utf8"),
    ) as { id: string; snapshotPath: string; sha256: string; commit: string }[];
    const baselinePath = `${dir}/ingredient-parsing-baseline.json`;
    if (!fs.existsSync(baselinePath))
      fs.writeFileSync(
        baselinePath,
        JSON.stringify(
          records.map((r) => ({
            id: r.id,
            ingredientCount: r.ingredients.length,
            groupedIngredientRows: r.ingredients
              .filter(
                (item) =>
                  parseHowToCookIngredientBullet(item.originalText).length > 1,
              )
              .map((item) => item.originalText),
            nonIngredientSha256: createHash("sha256")
              .update(JSON.stringify({ ...r, ingredients: [] }))
              .digest("hex"),
          })),
          null,
          2,
        ),
      );
    const rebuilt = records.filter((recipe) => {
      const entry = manifest.find((m) => m.id === recipe.id)!;
      if (entry.commit !== "a2d45c6984dff9ee941da0e7c452f7965965d962")
        throw new Error("Unexpected pinned commit");
      const source = fs.readFileSync(entry.snapshotPath, "utf8");
      if (createHash("sha256").update(source).digest("hex") !== entry.sha256)
        throw new Error(`Snapshot changed: ${recipe.id}`);
      recipe.ingredients = howToCookMaterialBullets(source)
        .flatMap(parseHowToCookIngredientBullet)
        .map((part) => recipeSchema.shape.ingredients.element.parse(part));
      assertAtomicHowToCookIngredients(recipe.ingredients);
      return canCookRecipe(recipe);
    });
    fs.writeFileSync(`${dir}/recipes.json`, JSON.stringify(rebuilt, null, 2));
    console.log(
      JSON.stringify({
        before: records.length,
        after: rebuilt.length,
        excluded: records.length - rebuilt.length,
        mode: "pinned snapshots",
        commit: manifest[0].commit,
      }),
    );
    return;
  }
  const metadata = JSON.parse(
    fs.readFileSync(".cache/howtocook/tree.json", "utf8"),
  );
  const dir = "data/verified-recipes/howtocook";
  fs.mkdirSync(`${dir}/snapshots`, { recursive: true });
  const paths = metadata.tree.filter(
    (entry: { path: string }) =>
      /^dishes\//.test(entry.path) && entry.path.endsWith(".md"),
  );
  const records: ReturnType<typeof recipeSchema.parse>[] = [];
  const manifest: object[] = [];
  const rejects: object[] = [];
  const categories: Record<string, string> = {
    aquatic: "水产",
    breakfast: "早餐",
    dessert: "甜品",
    drink: "饮品",
    meat_dish: "肉类",
    semi_finished: "半成品",
    soup: "汤",
    staple: "主食",
    vegetable_dish: "蔬菜",
  };
  for (let start = 0; start < paths.length; start += 4) {
    await Promise.all(
      paths
        .slice(start, start + 4)
        .map(async (entry: { path: string; sha: string }) => {
          const rawUrl = `https://raw.githubusercontent.com/Anduin2017/HowToCook/${metadata.sha}/${encodeURI(entry.path)}`;
          const sourceUrl = `https://github.com/Anduin2017/HowToCook/blob/${metadata.sha}/${encodeURI(entry.path)}`;
          const id = `howtocook:${createHash("sha256").update(entry.path).digest("hex").slice(0, 16)}`;
          const snapshotPath = `${dir}/snapshots/${id.split(":")[1]}.md`;
          try {
            const response = await fetch(rawUrl, {
              signal: AbortSignal.timeout(20000),
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const markdown = await response.text();
            const title = markdown
              .match(/^#\s+(.+)$/m)?.[1]
              ?.trim()
              .replace(/的做法$/, "");
            const sections = [
              ...markdown.matchAll(
                /^##\s+(.+)\n([\s\S]*?)(?=^##\s|$(?![\s\S]))/gm,
              ),
            ];
            const material = sections.find((m) =>
              /必备原料|原料和工具|所需食材/.test(m[1]),
            );
            const operation = sections.find((m) =>
              /^操作|制作步骤|做法/.test(m[1]),
            );
            if (!title || !material || !operation)
              throw new Error("missing recognized source sections");
            const rawIngredients = howToCookMaterialBullets(markdown);
            const equipment = rawIngredients.filter(
              (line) => !parseHowToCookIngredientBullet(line).length,
            );
            const items = rawIngredients.flatMap(
              parseHowToCookIngredientBullet,
            );
            assertAtomicHowToCookIngredients(items);
            const body = operation[2].trim();
            const numbered = /^\d+[.、]\s/m.test(body);
            const descriptions = body
              .split(numbered ? /\n(?=\d+[.、]\s)/ : /\n(?=[*-]\s)/)
              .map((s) => s.trim())
              .filter(Boolean);
            const now = new Date().toISOString();
            const recipe = recipeSchema.parse({
              id,
              slug: id,
              title,
              description:
                "HowToCook 开放授权原文。用量公式及补充说明见下方；未提供的时间与份量不会推测。",
              image: null,
              sourceProvider: "howtocook",
              sourceName: "HowToCook",
              sourceUrl,
              sourceAuthor: null,
              externalId: entry.path,
              provenance: {
                type: "OPEN_LICENSE",
                sourceName: "HowToCook",
                sourceUrl,
                sourceRecipeTitle: markdown.match(/^#\s+(.+)$/m)![1].trim(),
                sourceAuthor: null,
                sourceExternalId: entry.path,
                verifiedAt: now,
                verificationMethod: "open-license-dataset",
                instructionSource: "source-page",
                imageSource: null,
                licenseOrUsageBasis: `The Unlicense; pinned commit ${metadata.sha}; https://github.com/Anduin2017/HowToCook/blob/${metadata.sha}/LICENSE`,
              },
              verificationStatus: "verified",
              instructionAvailability: "full",
              cuisine: "未知",
              category: categories[entry.path.split("/")[1]] ?? "其他",
              difficulty: "未知",
              prepTime: null,
              cookTime: null,
              totalTime: null,
              servings: 1,
              servingsEstimated: true,
              ingredients: items,
              instructions: descriptions.map((description, index) => ({
                stepNumber: index + 1,
                title: `原文步骤 ${index + 1}`,
                description,
                durationSeconds: null,
              })),
              sourceNotes: sections
                .filter((m) => m !== operation)
                .map((m) => `## ${m[1]}\n${m[2].trim()}`)
                .join("\n\n"),
              equipment,
              tags: [],
              allergens: [],
              nutrition: null,
              rating: null,
              createdAt: now,
              updatedAt: now,
              sourceUpdatedAt: null,
              lastFetchedAt: now,
            });
            if (!canCookRecipe(recipe))
              throw new Error("does not meet full tutorial contract");
            fs.writeFileSync(snapshotPath, markdown);
            records.push(recipe);
            manifest.push({
              id,
              path: entry.path,
              blobSha: entry.sha,
              commit: metadata.sha,
              rawUrl,
              sourceUrl,
              sha256: createHash("sha256").update(markdown).digest("hex"),
              snapshotPath,
              verifiedAt: now,
              httpStatus: response.status,
            });
          } catch (error) {
            rejects.push({ path: entry.path, reason: String(error) });
          }
        }),
    );
    if (start % 40 === 0)
      console.log(
        `Checked ${Math.min(start + 4, paths.length)}/${paths.length}; accepted ${records.length}`,
      );
  }
  records.sort((a, b) => a.id.localeCompare(b.id));
  fs.writeFileSync(`${dir}/recipes.json`, JSON.stringify(records, null, 2));
  fs.writeFileSync(`${dir}/manifest.json`, JSON.stringify(manifest, null, 2));
  fs.writeFileSync(`${dir}/excluded.json`, JSON.stringify(rejects, null, 2));
  const license = await fetch(
    `https://raw.githubusercontent.com/Anduin2017/HowToCook/${metadata.sha}/LICENSE`,
  ).then((r) => r.text());
  fs.writeFileSync(`${dir}/LICENSE`, license);
  console.log(
    JSON.stringify({
      accepted: records.length,
      excluded: rejects.length,
      commit: metadata.sha,
    }),
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
