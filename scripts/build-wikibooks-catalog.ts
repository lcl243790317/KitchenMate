import fs from "node:fs";
import { createHash } from "node:crypto";
import { parseWikibooks } from "../lib/wikibooks-parser";
import { recipeSchema, type Recipe } from "../lib/model";
import { pantryPrimary } from "../lib/pantry-selection";
import { validateRecipeSourcePolicy } from "../lib/recipe-source-registry";
type WikiPage = {
  pageid: number;
  title: string;
  revisions?: {
    revid: number;
    timestamp: string;
    slots: { main: { content: string } };
  }[];
  retrievedAt?: string;
  httpStatus?: number;
};
const pages: WikiPage[] = process.argv.includes("--research")
  ? JSON.parse(fs.readFileSync(".cache/phase313/wiki-reviewed.json", "utf8"))
  : JSON.parse(
      fs.readFileSync("data/verified-recipes/wikibooks/manifest.json", "utf8"),
    ).map((m: { snapshotPath: string; sha256: string; revisionId: number }) => {
      const raw = fs.readFileSync(m.snapshotPath, "utf8");
      const s = JSON.parse(raw);
      if (
        createHash("sha256").update(raw).digest("hex") !== m.sha256 ||
        s.revisionId !== m.revisionId
      )
        throw new Error(
          "Pinned Wikibooks snapshot modified; source review required",
        );
      return {
        pageid: s.pageid,
        title: s.title,
        retrievedAt: s.retrievedAt,
        httpStatus: s.httpStatus,
        revisions: [
          {
            revid: s.revisionId,
            timestamp: s.timestamp,
            slots: { main: { content: s.wikitext } },
          },
        ],
      };
    });
const primary = new Set(pantryPrimary.map((i) => i.id));
const recipes: Recipe[] = [],
  manifest: Record<string, unknown>[] = [],
  candidates: Record<string, unknown>[] = [];
const dir = "data/verified-recipes/wikibooks";
fs.mkdirSync(dir + "/snapshots", { recursive: true });
fs.mkdirSync("data/recipe-candidates", { recursive: true });
const translations: Record<string, string> = {
  "Mashed Pumpkin": "南瓜泥",
  "Mushy Peas": "豌豆泥",
  "Cabbage Salad": "包菜沙拉",
  "Marinated Cucumbers and Onions": "腌黄瓜洋葱",
  "Bacon and Egg Stuffed Tomatoes": "培根鸡蛋酿番茄",
  "Microwaved Scrambled Egg": "微波炒鸡蛋",
  "Noodles for Soup": "汤面",
  "Microwave Oat Porridge": "微波燕麦粥",
  "Cheese Stuffed Tomatoes": "芝士酿番茄",
  "Cheesy Chicken Pasta": "芝士鸡肉意面",
  "Banana Milkshake": "香蕉奶昔",
  "Potato Salad": "土豆沙拉",
  "Basic Scrambled Eggs": "基础炒鸡蛋",
  "Basic Omelet": "基础蛋饼",
  "Bacon Cheese Omelet": "培根芝士蛋饼",
  "Fried Eggs": "煎鸡蛋",
  "French Toast": "法式吐司",
  "Chicken Fried Rice": "鸡肉炒饭",
  "Baked Chicken Breasts": "烤鸡胸肉",
  "Hash Browns": "煎土豆丝饼",
  "Boiled Potatoes": "水煮土豆",
  "Fried Potatoes": "煎土豆",
  "Mashed Potatoes": "土豆泥",
  "Oven-Roasted Potatoes": "烤土豆",
  "Baked Potato Halves": "烤半颗土豆",
  "Buttery Noodles with Cheese": "黄油芝士面",
  "Easy Pasta Sauce": "简单意面酱",
  "Kid-Friendly Pasta": "儿童意面",
  "Pasta with Vegetables": "蔬菜意面",
  "Salmon Spaghetti": "三文鱼意面",
  "Tomato Salad": "番茄沙拉",
  "Carrot Salad": "胡萝卜沙拉",
  "Vegetable Soup": "蔬菜汤",
  "Sweet Potato Soup": "红薯汤",
  "Asparagus Soup": "芦笋汤",
  "Cheesy Potato Soup": "芝士土豆汤",
  "Grilled Cheese Sandwich": "煎芝士三明治",
  "Peanut Butter Sandwich": "花生酱三明治",
  "Garlic Bread": "蒜香面包",
  "Baked Oatmeal": "烤燕麦",
  "Rice Pilaf": "焖饭",
  "Baked Pork Chops": "烤猪排",
  "Banana Pancakes": "香蕉煎饼",
  "Breakfast Burrito": "早餐卷饼",
  Colcannon: "爱尔兰蔬菜土豆泥",
  "Tuna Salad": "金枪鱼沙拉",
  "Baked Cabbage and Bacon": "培根烤包菜",
  "Asparagus with Sesame Seeds and Soy Sauce": "芝麻酱油芦笋",
  "American Potato Salad I": "美式土豆沙拉（一）",
  "American Potato Salad II": "美式土豆沙拉（二）",
  "Champ (Irish Mashed Potato with Scallion)": "葱香土豆泥",
  "Bean Soup (Vegetarian)": "素豆子汤",
  "Fresh Pasta with Mozzarella, Tomato and Basil": "马苏里拉番茄罗勒意面",
  "Sesame Noodle Salad": "芝麻面条沙拉",
  "Tomato Basil Soup with Garlic Toasts": "番茄罗勒汤配蒜香吐司",
};
for (const p of pages) {
  const revision = p.revisions?.[0];
  const sourceUrl =
    "https://en.wikibooks.org/wiki/" +
    encodeURIComponent(p.title.replaceAll(" ", "_"));
  const c: Record<string, unknown> = {
    title: p.title,
    revisionId: revision?.revid ?? null,
    sourceUrl,
    licenseOrUsageBasis: "CC BY-SA 4.0",
    candidateReason:
      "Curated everyday ingredients / beginner category research",
    decision: "DEFER",
  };
  try {
    if (!revision) throw Error("Missing original source page");
    const wikitext = revision.slots.main.content;
    const x = parseWikibooks(wikitext);
    const unknown = x.ingredients.filter((i) =>
      i.ingredientId.startsWith("unknown:"),
    );
    Object.assign(c, {
      sourceDifficulty: x.sourceDifficulty ?? null,
      sourceTime: x.sourceTime,
      ingredientCount: x.ingredients.length,
      instructionCount: x.descriptions.length,
      primaryIngredientCoverage: x.ingredients
        .filter((i) => primary.has(i.ingredientId))
        .map((i) => i.ingredientId),
      unresolvedIngredients: unknown.map((i) => i.originalText),
    });
    if (x.totalTime !== null && x.totalTime > 60)
      throw Error("Defer: over 60 minutes");
    if (
      x.ingredients.length < 2 ||
      x.ingredients.length > 15 ||
      x.descriptions.length > 10 ||
      unknown.length > Math.floor(x.ingredients.length * 0.3)
    )
      throw Error(
        "Beginner/identity gate: too many ingredients, steps or unknowns",
      );
    if (!x.sourceDifficulty && !(x.totalTime !== null && x.totalTime <= 30))
      throw Error("No strong beginner difficulty or time signal");
    const id = "wikibooks:" + p.pageid;
    const now = p.retrievedAt ?? new Date().toISOString();
    const original = p.title.replace(/^Cookbook:/, "");
    const r = recipeSchema.parse({
      id,
      slug: id,
      title: translations[original] ?? original,
      originalTitle: original,
      ...(translations[original] ? { titleTranslation: "KitchenMate" } : {}),
      description:
        "Wikibooks 开放授权教程。步骤保留英文原文；中文菜名由 KitchenMate 翻译。",
      sourceProvider: "wikibooks",
      sourceName: "Wikibooks Cookbook",
      sourceUrl,
      sourceAuthor: "Wikibooks contributors",
      externalId: String(p.pageid),
      provenance: {
        type: "OPEN_LICENSE",
        sourceName: "Wikibooks Cookbook",
        sourceUrl,
        sourceRecipeTitle: original,
        sourceAuthor: "Wikibooks contributors",
        sourceExternalId: String(p.pageid),
        sourceRevision: String(revision.revid),
        verifiedAt: now,
        lastVerifiedAt: now,
        httpStatus: 200,
        verificationMethod: "mediawiki-api",
        instructionSource: "open-license-source",
        imageSource: null,
        licenseOrUsageBasis:
          "CC BY-SA 4.0; original text and KitchenMate title translation retain ShareAlike license. No images reused.",
        licenseName: "CC BY-SA 4.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
        attributionText:
          "Wikibooks contributors. See original page and revision history for authors. Formatting adapted and title translated by KitchenMate; instructions retained in original English.",
      },
      verificationStatus: "verified",
      instructionAvailability: "full",
      image: null,
      cuisine: "未知",
      category: /Soup/.test(x.sourceCategory)
        ? "汤"
        : /Salad/.test(x.sourceCategory)
          ? "沙拉"
          : /Rice|Pasta|Sandwich|Breakfast/.test(x.sourceCategory)
            ? "主食"
            : /Vegetable|Potato/.test(x.sourceCategory)
              ? "蔬菜"
              : /Chicken|Beef|Pork/.test(x.sourceCategory)
                ? "肉类"
                : "其他",
      sourceDifficulty: x.sourceDifficulty,
      difficulty: x.sourceDifficulty ? "简单" : "未知",
      prepTime: null,
      cookTime: null,
      totalTime: x.totalTime,
      servings: x.servings,
      servingsEstimated: x.servingsEstimated,
      ingredients: x.ingredients,
      instructions: x.descriptions.map((description, i) => ({
        stepNumber: i + 1,
        title: "Original step " + (i + 1),
        description,
        durationSeconds: null,
      })),
      sourceNotes:
        "英文原文；原始说明、可选变化及作者记录见来源页面。\n" +
        x.sourceNotes +
        "\n" +
        (wikitext.includes("{{1881}}")
          ? "原文注明源自 1881 年食谱（Wikibooks 保留的来源标记）。"
          : ""),
      equipment: x.equipment,
      tags: [],
      allergens: [],
      nutrition: null,
      rating: null,
      createdAt: now,
      updatedAt: now,
      sourceUpdatedAt: revision.timestamp,
      lastFetchedAt: now,
    });
    validateRecipeSourcePolicy(r);
    const snapshot = {
      pageid: p.pageid,
      title: p.title,
      revisionId: revision.revid,
      timestamp: revision.timestamp,
      retrievedAt: now,
      httpStatus: 200,
      apiUrl: "https://en.wikibooks.org/w/api.php",
      wikitext,
    };
    const snapshotPath = dir + "/snapshots/" + p.pageid + ".json";
    const data = JSON.stringify(snapshot, null, 2) + "\n";
    fs.writeFileSync(snapshotPath, data);
    manifest.push({
      id,
      revisionId: revision.revid,
      snapshotPath,
      sha256: createHash("sha256").update(data).digest("hex"),
    });
    recipes.push(r);
    c.decision = "FULL";
    c.reason =
      "Explicit ingredient/procedure sections, pinned revision, beginner signals and source policy passed";
  } catch (e) {
    if (!process.argv.includes("--research")) throw e;
    c.reason = String(e);
    if (!revision) c.decision = "REJECT";
  }
  candidates.push(c);
}
fs.writeFileSync(
  dir + "/recipes.json",
  JSON.stringify(recipes, null, 2) + "\n",
);
fs.writeFileSync(
  dir + "/manifest.json",
  JSON.stringify(manifest, null, 2) + "\n",
);
if (process.argv.includes("--research"))
  fs.writeFileSync(
    "data/recipe-candidates/wikibooks.json",
    JSON.stringify(candidates, null, 2) + "\n",
  );
console.log(
  recipes.map((r) => [r.title, r.ingredients.length, r.instructions.length]),
);
console.log(
  candidates
    .filter((c) => c.decision !== "FULL" && c.revisionId)
    .map((c) => [c.title, c.reason, c.unresolvedIngredients]),
);
