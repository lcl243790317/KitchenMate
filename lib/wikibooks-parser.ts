import { normalizeIngredient, ingredientById } from "./ingredients";
import type { RecipeIngredient } from "./model";

/** Rendering only: retain source units, never derive conversions, measures or prose. */
export function wikiText(value: string) {
  return value
    .replace(/<!--[^]*?-->/g, "")
    .replace(/\{\{convert\|([^|}]+)\|([^|}]+)[^}]*\}\}/gi, "$1 $2")
    .replace(/\{\{frac\|([^|}]+)\|([^|}]+)\}\}/gi, "$1/$2")
    .replace(/\[\[(?:File|Image|Category):[^]*?\]\]/gi, "")
    .replace(
      /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
      (_, target: string, label?: string) =>
        label ?? target.replace(/^Cookbook:/i, ""),
    )
    .replace(/\[(https?:\/\/\S+)\s+([^\]]+)\]/g, "$2 ($1)")
    .replace(/'{2,5}/g, "")
    .replace(/<br\s*\/?\s*>/gi, " ")
    .trim();
}
// Explicit English source heads whose preparation/form must not be inferred from a substring.
const heads: Record<string, string> = {
  "boneless skinless chicken breasts": "chicken-breast",
  "chicken breasts": "chicken-breast",
  "minced raw chicken": "chicken",
  "raw chicken": "chicken",
  "cooked rice": "rice",
  rice: "zh:大米",
  "soy sauce": "zh:普通酱油",
  "green cabbage": "zh:包菜",
  cabbage: "zh:包菜",
  "freshly-ground black pepper": "black-pepper",
  pepper: "black-pepper",
  "lemon zest": "zh:柠檬皮屑",
  "egg noodles": "zh:意大利宽面",
  "skim milk": "milk",
  "kosher salt": "salt",
  "starchy (floury) potatoes": "potato",
  "starchy potatoes": "potato",
  "unsalted butter": "butter",
  "freshly-ground pepper": "black-pepper",
  "ground pepper": "black-pepper",
  "ground black pepper": "black-pepper",
  "whole milk": "milk",
  "white granulated sugar": "sugar",
  "sesame seed oil": "zh:芝麻油",
  "sesame seed": "zh:芝麻粒",
  "asparagus spears": "zh:芦笋",
  "quick-cooking oats": "zh:燕麦",
  "cooking oil": "oil",
  preserves: "zh:果酱",
  jam: "zh:果酱",
  "very cold milk": "milk",
  "groundnut oil": "zh:花生油",
  "oat flakes": "zh:燕麦片",
  "white cabbage": "zh:包菜",
  "coarsely-ground pepper": "black-pepper",
  "extra-virgin olive oil": "zh:橄榄油",
  "distilled white vinegar": "zh:白醋",
  "boneless chicken breasts": "chicken-breast",
  "heavy whipping cream": "cream",
  "dried pasta": "pasta",
  "mozzarella cheese": "zh:马苏里拉奶酪",
  "cheddar cheese": "zh:切达奶酪",
  "cooked chicken": "chicken",
  "boiling water": "water",
  "tomato slices": "tomato",
  "broccoli florets": "broccoli",
  "lettuce leaves": "zh:生菜",
  "cooked bacon": "bacon",
  "slices of cooked bacon": "bacon",
  "vanilla ice cream": "zh:冰淇淋",
  "american cheese": "cheese",
  "slices of american cheese": "cheese",
  "thick asparagus spears": "zh:芦笋",
  "toasted sesame seeds": "zh:芝麻粒",
  "rice wine vinegar": "zh:米醋",
  "whole-wheat spaghetti": "pasta",
  "tomato pasta sauce": "zh:番茄酱",
  "corn off the cob": "zh:玉米粒",
  "chopped clams": "zh:蛤蜊",
  "salmon steaks": "salmon",
  "salmon fillet": "salmon",
  "salmon fillets": "salmon",
  "plain white flour": "flour",
  "dry red wine": "zh:红葡萄酒",
  "warm water": "water",
  "uncooked basmati rice": "zh:大米",
  "tinned sweetcorn": "zh:玉米罐头",
  "ground cinnamon": "zh:肉桂粉",
  "cinnamon powder": "zh:肉桂粉",
  "soft brown sugar": "zh:红糖",
  "melted butter": "butter",
  "broccoli pieces": "broccoli",
  "vegetable oil": "oil",
  "neutral oil": "oil",
  "fish fillet": "fish",
  "raw spinach": "zh:菠菜",
  "red onion": "onion",
  "yellow onion": "onion",
  "rolled oats": "zh:燕麦片",
  "sea salt": "salt",
  "sesame oil": "zh:香油",
  "king oyster mushrooms": "zh:杏鲍菇",
  "udon noodles": "zh:乌冬面",
  "udon noodle": "zh:乌冬面",
  "japanese raddish": "zh:白萝卜",
  "sweet corn": "zh:甜玉米",
  "heavy cream": "cream",
  "general purpose flour": "flour",
  "all-purpose flour": "flour",
  "wheat flour": "flour",
  "dried thyme": "zh:百里香",
  zucchinis: "zh:西葫芦",
  champignons: "zh:口蘑",
  "uncooked pasta": "pasta",
  "corn starch": "zh:玉米淀粉",
};
export function parseWikiIngredient(
  text: string,
  optional: boolean,
): RecipeIngredient {
  const clean = text
    .replace(/^About\s+/i, "")
    .replace(/\([^)]*\d[^)]*\)/g, "")
    .replace(
      /^[\d¼½¾⅛⅓⅔⅜⅝⅞./–—\s-]+\s*(?:(?:kg|g|oz|ounces?|lb|ml|l|cup|cups|tbsp|tsp|tablespoons?|teaspoons?|cloves?|pints?|quarts?|head|heads|slice|slices|grams?|kilograms?|pounds?|liters?|pinch|pcs|cake|mugfuls|table spoon|ears|cm|T|bunches)\b\s*(?:of\s*)?)?/i,
      "",
    )
    .trim();
  const exactHead = clean
    .split(/,|\s*\(/)[0]
    .replace(/\s+(?:to taste|as needed)$/i, "")
    .replace(
      /^(?:(?:large|small|medium|standard|fresh|finely-chopped|chopped|minced|grated|ripe|medium-size|diced|shredded|very ripe)\s+)+/i,
      "",
    )
    .trim();
  const id =
    heads[exactHead.toLowerCase()] ?? normalizeIngredient(exactHead)?.id;
  // No whole-string substring fallback. Compounds, alternatives and specialty foods stay unknown.
  const trusted =
    id &&
    ingredientById.has(id) &&
    !/\bor\b|\band\b|\//i.test(exactHead) &&
    !/\bwhite\s*fish\b/i.test(clean);
  return {
    ingredientId: trusted ? id : `unknown:${text}`,
    originalText: text,
    quantity: null,
    unit: "",
    optional: optional || /\boptional\b/i.test(text),
    group: "原料",
  };
}
export function parseWikibooks(wikitext: string, language = "en") {
  const sections = [
    ...wikitext.matchAll(
      /^==\s*([^=\n]+?)\s*==\s*\n([^]*?)(?=^==[^=]|$(?![^]))/gm,
    ),
  ];
  const material = sections.find((s) => /^(ingredients?|材料)$/i.test(s[1]));
  const procedure = sections.find((s) =>
    /^(procedure|directions|method|preparation|做法)$/i.test(s[1]),
  );
  if (!material || !procedure)
    throw new Error("Explicit Ingredients and Procedure sections required");
  let optional = false;
  const items: RecipeIngredient[] = [];
  for (const line of material[2].split("\n")) {
    if (/^===/.test(line)) optional = /optional/i.test(line);
    if (/^\s*\*\s*\S/.test(line))
      items.push(
        language === "zh"
          ? parseChineseWikiIngredient(wikiText(line.replace(/^\s*\*\s*/, "")))
          : parseWikiIngredient(
              wikiText(line.replace(/^\s*\*\s*/, "")),
              optional,
            ),
      );
    else if (line.trim() && !/^\s*(?:===|<!--)/.test(line))
      throw new Error("Ingredient prose/table requires manual parsing review");
  }
  // Keep nested steps in their parent block, with original numbering markers intact.
  const descriptions = procedure[2]
    .trim()
    .split(/\n(?=#(?![#*:]))/)
    .map((block) =>
      wikiText(
        block
          .replace(/^#\s*/, "")
          .replace(/\{\{noteTag\|1=([^}]+)\}\}/g, "（来源注释：$1）"),
      ),
    )
    .filter(Boolean);
  if (
    !descriptions.length ||
    !/^#/.test(procedure[2].trim()) ||
    descriptions.some((s) => /\{\{|\}\}/.test(s))
  )
    throw new Error("Procedure is not a supported complete numbered list");
  // Reviewed explicit operation phrase in the pinned Chinese recipe, not general prose extraction.
  if (
    language === "zh" &&
    procedure[2].includes("加入半杯水（讓料稍微浸著的量）")
  )
    items.push({
      ingredientId: "water",
      originalText: "加入半杯水（讓料稍微浸著的量）",
      quantity: null,
      unit: "",
      optional: false,
      group: "原料",
      verificationMethod: "source-operation-explicit",
    });
  const params = (key: string) =>
    wikitext
      .match(new RegExp(`\\|\\s*${key}\\s*=\\s*([^|}]+)`, "i"))?.[1]
      .trim();
  const time = params("time");
  // Only an explicit single total duration, never sum preparation/cooking or guess a range.
  const minutes = time?.match(/^(?:About\s+)?(\d+)\s*(minutes?|mins?)$/i);
  const hours = time?.match(/^(\d+)\s*hours?$/i);
  const difficulty = params("difficulty");
  const sourceDifficulty =
    difficulty === "1" ? "Very Easy" : difficulty === "2" ? "Easy" : undefined;
  const servings = params("servings");
  return {
    ingredients: items,
    descriptions,
    sourceTime: time ?? null,
    totalTime: minutes
      ? Number(minutes[1])
      : hours
        ? Number(hours[1]) * 60
        : null,
    sourceDifficulty,
    sourceCategory: params("category") ?? "",
    servings: servings && /^\d+$/.test(servings) ? Number(servings) : 1,
    servingsEstimated: !servings || !/^\d+$/.test(servings),
    equipment: [
      ...new Set(
        [
          ...wikitext.matchAll(
            /\[\[Cookbook:(Oven|Microwave|Blender|Food Processor|Pressure Cooker|Thermometer)(?:\||\]\])/gi,
          ),
        ]
          .map((m) => m[1])
          .concat(
            /\boven\b/i.test(procedure[2]) ? ["烤箱"] : [],
            /\bmicrowave\b/i.test(procedure[2]) ? ["微波炉"] : [],
          ),
      ),
    ],
    sourceNotes: sections
      .filter((s) => s !== material && s !== procedure)
      .map((s) => `${s[1]}\n${wikiText(s[2])}`)
      .filter((s) => s.trim())
      .join("\n\n"),
  };
}

function parseChineseWikiIngredient(text: string): RecipeIngredient {
  const identities: Record<string, string> = {
    杏鮑菇數支: "zh:杏鲍菇",
    麻油: "zh:香油",
    "醋，烏醋白醋皆可": "vinegar",
  };
  return {
    ingredientId: identities[text] ?? `unknown:${text}`,
    originalText: text,
    quantity: null,
    unit: "",
    optional: false,
    group: "原料",
  };
}
