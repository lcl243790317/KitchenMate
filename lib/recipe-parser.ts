import * as cheerio from "cheerio";
import { createHash } from "node:crypto";
import { ingredientFromText, ingredients } from "./ingredients";
import { recipeSchema } from "./model";
import { parseAmount, normalizeUnit } from "./units";
import { safePublicImage } from "./providers";
const text = (v: unknown): string =>
  cheerio
    .load(`<body>${typeof v === "string" ? v : ""}</body>`)("body")
    .text()
    .trim();
type Obj = Record<string, unknown>;
function findRecipe(v: unknown, depth = 0): Obj | null {
  if (depth > 20 || !v || typeof v !== "object") return null;
  if (Array.isArray(v)) {
    for (const x of v) {
      const found = findRecipe(x, depth + 1);
      if (found) return found;
    }
    return null;
  }
  const o = v as Obj;
  const types = Array.isArray(o["@type"]) ? o["@type"] : [o["@type"]];
  if (types.includes("Recipe")) return o;
  return findRecipe(o["@graph"], depth + 1);
}
export function duration(v: unknown) {
  if (typeof v !== "string") return null;
  const m = v.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  return m
    ? Number(m[1] ?? 0) * 1440 +
        Number(m[2] ?? 0) * 60 +
        Number(m[3] ?? 0) +
        Number(m[4] ?? 0) / 60
    : null;
}
function steps(v: unknown): string[] {
  if (typeof v === "string") return v.split(/\n+/).map(text).filter(Boolean);
  if (Array.isArray(v)) return v.flatMap(steps);
  if (v && typeof v === "object") {
    const o = v as Obj;
    return o.itemListElement
      ? steps(o.itemListElement)
      : [text(o.text ?? o.name)].filter(Boolean);
  }
  return [];
}
export function parseRecipeHtml(html: string, url: string) {
  const $ = cheerio.load(html);
  let data: Obj | null = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (data) return;
    try {
      data = findRecipe(JSON.parse($(el).text()));
    } catch {
      /* Skip malformed blocks. */
    }
  });
  if (!data) {
    const root = $('[itemtype$="/Recipe"]').first();
    if (root.length) {
      const get = (p: string) =>
        root.find(`[itemprop="${p}"]`).first().attr("content") ??
        root.find(`[itemprop="${p}"]`).first().text();
      data = {
        "@type": "Recipe",
        name: get("name"),
        description: get("description"),
        recipeIngredient: root
          .find('[itemprop="recipeIngredient"]')
          .toArray()
          .map((e) => $(e).text()),
        recipeInstructions: root
          .find('[itemprop="recipeInstructions"]')
          .toArray()
          .map((e) => $(e).text()),
        prepTime: get("prepTime"),
        cookTime: get("cookTime"),
        totalTime: get("totalTime"),
        recipeYield: get("recipeYield"),
      };
    }
  }
  if (!data) throw new Error("页面中没有可导入的 Recipe 结构化数据");
  const d = data as Obj;
  const rawItems = Array.isArray(d.recipeIngredient) ? d.recipeIngredient : [];
  const items = rawItems.map((v) => {
    const s = text(v);
    const ingredient = ingredientFromText(s);
    const amount = parseAmount(s);
    const trailing = s.match(
      /(\d+(?:\.\d+)?)\s*(克|千克|毫升|升|个|根|瓣|g|ml)\s*$/,
    );
    return {
      ingredientId: ingredient?.id ?? `unknown:${s}`,
      originalText: s,
      quantity: amount.quantity ?? (trailing ? Number(trailing[1]) : null),
      unit: amount.unit || (trailing ? normalizeUnit(trailing[2]) : ""),
      optional: false,
      group: "食材",
    };
  });
  const now = new Date().toISOString();
  const id =
    "import:" + createHash("sha256").update(url).digest("hex").slice(0, 24);
  const img = Array.isArray(d.image) ? d.image[0] : d.image;
  const image = typeof img === "object" && img ? (img as Obj).url : img;
  return recipeSchema.parse({
    id,
    slug: id,
    title: text(d.name) || text($('meta[property="og:title"]').attr("content")),
    description: text(d.description),
    image: safePublicImage(
      image ?? $('meta[property="og:image"]').attr("content"),
    ),
    sourceProvider: "url-import",
    sourceName: new URL(url).hostname,
    sourceUrl: url,
    sourceAuthor:
      typeof d.author === "string"
        ? text(d.author)
        : d.author && typeof d.author === "object"
          ? text((d.author as Obj).name)
          : null,
    externalId: url,
    cuisine: Array.isArray(d.recipeCuisine)
      ? text(d.recipeCuisine[0])
      : text(d.recipeCuisine) || "未知",
    category: text(d.recipeCategory),
    difficulty: "未知",
    prepTime: duration(d.prepTime),
    cookTime: duration(d.cookTime),
    totalTime: duration(d.totalTime),
    servings: Math.max(
      1,
      Number(String(d.recipeYield ?? "2").match(/\d+/)?.[0] ?? 2),
    ),
    servingsEstimated: !String(d.recipeYield ?? "").match(/\d+/),
    ingredients: items,
    instructions: steps(d.recipeInstructions).map((description, i) => ({
      stepNumber: i + 1,
      title: `步骤 ${i + 1}`,
      description,
      durationSeconds: null,
    })),
    equipment: [],
    tags: typeof d.keywords === "string" ? d.keywords.split(",").map(text) : [],
    allergens: [
      ...new Set(
        items.flatMap(
          (i) =>
            ingredients.find((x) => x.id === i.ingredientId)?.allergens ?? [],
        ),
      ),
    ],
    nutrition: null,
    rating: null,
    createdAt: now,
    updatedAt: now,
    sourceUpdatedAt: null,
    lastFetchedAt: now,
  });
}
