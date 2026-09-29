import type { Ingredient, PantryItem } from "./model";
import { z } from "zod";
import catalog from "@/data/ingredients/catalog.json";
const rows = [
  ["tomato", "番茄", "Tomato", "西红柿|tomatoes", "蔬菜", "🍅"],
  [
    "cherry-tomato",
    "小番茄",
    "Cherry tomato",
    "圣女果|cherry tomatoes",
    "蔬菜",
    "🍅",
  ],
  ["potato", "土豆", "Potato", "马铃薯|potatoes", "蔬菜", "🥔"],
  ["onion", "洋葱", "Onion", "onions", "蔬菜", "🧅"],
  ["broccoli", "西兰花", "Broccoli", "绿花椰菜", "蔬菜", "🥦"],
  ["carrot", "胡萝卜", "Carrot", "carrots", "蔬菜", "🥕"],
  ["cabbage", "白菜", "Cabbage", "大白菜|napa cabbage", "蔬菜", "🥬"],
  [
    "pepper",
    "青椒",
    "Green pepper",
    "bell pepper|green bell pepper",
    "蔬菜",
    "🫑",
  ],
  ["mushroom", "蘑菇", "Mushroom", "mushrooms", "蔬菜", "🍄"],
  [
    "chicken-breast",
    "鸡胸肉",
    "Chicken breast",
    "鸡胸|chicken breasts",
    "肉类",
    "🍗",
  ],
  ["chicken-thigh", "鸡腿", "Chicken thigh", "chicken thighs", "肉类", "🍗"],
  ["chicken", "整鸡", "Chicken", "鸡肉", "肉类", "🍗"],
  ["pork", "猪肉", "Pork", "", "肉类", "🥩"],
  ["beef", "牛肉", "Beef", "beef steak", "肉类", "🥩"],
  ["ribs", "排骨", "Ribs", "pork ribs", "肉类", "🥩"],
  ["bacon", "培根", "Bacon", "", "肉类", "🥓"],
  ["shrimp", "虾", "Shrimp", "prawns|prawn|shrimp|shrimps", "海鲜", "🦐"],
  ["fish", "鱼", "Fish", "", "海鲜", "🐟"],
  ["salmon", "三文鱼", "Salmon", "", "海鲜", "🐟"],
  ["egg", "鸡蛋", "Egg", "eggs", "蛋奶", "🥚"],
  ["milk", "牛奶", "Milk", "", "蛋奶", "🥛"],
  ["butter", "黄油", "Butter", "", "蛋奶", "🧈"],
  ["cheese", "芝士", "Cheese", "奶酪|parmesan", "蛋奶", "🧀"],
  ["cream", "淡奶油", "Cream", "double cream|heavy cream", "蛋奶", "🥛"],
  ["rice", "米饭", "Rice", "熟米饭|cooked rice", "主食", "🍚"],
  ["noodles", "面条", "Noodles", "noodle", "主食", "🍜"],
  ["pasta", "意大利面", "Pasta", "意面|spaghetti|penne", "主食", "🍝"],
  ["bread", "吐司", "Bread", "面包|toast", "主食", "🍞"],
  ["flour", "面粉", "Flour", "plain flour", "主食", "🌾"],
  ["tofu", "豆腐", "Tofu", "", "豆制品", "🧊"],
  ["salt", "盐", "Salt", "食盐", "调料", "🧂"],
  ["sugar", "糖", "Sugar", "白糖|白砂糖", "调料", "🍬"],
  [
    "soy-sauce",
    "生抽",
    "Light soy sauce",
    "酱油/生抽|light soy sauce",
    "调料",
    "🍶",
  ],
  ["dark-soy", "老抽", "Dark soy sauce", "酱油/老抽", "调料", "🍶"],
  ["vinegar", "醋", "Vinegar", "", "调料", "🍶"],
  ["oyster-sauce", "蚝油", "Oyster sauce", "", "调料", "🍶"],
  ["wine", "料酒", "Cooking wine", "shaoxing wine", "调料", "🍶"],
  ["black-pepper", "黑胡椒", "Black pepper", "胡椒|pepper", "调料", "🧂"],
  ["chili", "辣椒", "Chili", "chilli|chillies", "调料", "🌶️"],
  ["garlic", "蒜", "Garlic", "大蒜|蒜瓣|garlic cloves", "调料", "🧄"],
  ["ginger", "姜", "Ginger", "生姜", "调料", "🫚"],
  [
    "scallion",
    "葱",
    "Spring onion",
    "香葱|小葱|葱花|spring onions|scallions",
    "调料",
    "🌱",
  ],
  [
    "oil",
    "食用油",
    "Oil",
    "植物油|vegetable oil",
    "调料",
    "🫒",
  ],
  ["water", "水", "Water", "", "调料", "💧"],
  ["peanut", "花生", "Peanut", "peanuts", "其他", "🥜"],
  ["douban", "豆瓣酱", "Chili bean paste", "郫县豆瓣酱", "调料", "🥫"],
  ["starch", "淀粉", "Starch", "", "调料", "🥣"],
  ["wings", "鸡翅", "Chicken wings", "", "肉类", "🍗"],
  ["cola", "可乐", "Cola", "", "其他", "🥤"],
];
const legacyIngredients: Ingredient[] = rows.map(
  ([id, zh, en, aliases, category, emoji]) => ({
    id,
    canonicalName: id,
    displayNameZh: zh,
    displayNameEn: en,
    aliases: aliases.split("|").filter(Boolean),
    category,
    emoji,
    pantryStaple: ["salt", "sugar", "water", "oil", "black-pepper"].includes(
      id,
    ),
    allergens:
      id === "egg"
        ? ["鸡蛋"]
        : ["milk", "butter", "cheese", "cream"].includes(id)
          ? ["牛奶"]
          : ["shrimp", "fish", "salmon", "oyster-sauce"].includes(id)
            ? ["海鲜"]
            : [
                  "pasta",
                  "bread",
                  "flour",
                  "noodles",
                  "soy-sauce",
                  "dark-soy",
                ].includes(id)
              ? ["麸质"]
              : id === "peanut"
                ? ["花生"]
                : [],
  }),
);
const catalogSchema = z.record(z.string().min(1), z.array(z.string().min(1)));
const expandedCatalog = catalogSchema.parse(catalog);
const legacyNames = new Set(legacyIngredients.map((i) => i.displayNameZh));
const aliasOverrides: Record<string, string[]> = {
  鸡胸肉: ["鸡胸", "鸡胸脯", "鸡胸脯肉", "chicken breast"],
  嫩豆腐: ["软豆腐", "silken tofu"],
  老豆腐: ["北豆腐", "firm tofu"],
  五花肉: ["猪五花", "pork belly"],
  里脊肉: ["猪里脊", "pork tenderloin"],
  牛腩: ["beef brisket"],
  鸡翅根: ["翅根", "chicken drumette"],
  玉米淀粉: ["cornstarch", "corn starch"],
  红薯淀粉: ["sweet potato starch"],
  陈醋: ["老陈醋", "aged vinegar"],
  香醋: ["镇江香醋", "black rice vinegar"],
  米醋: ["rice vinegar"],
  白醋: ["white vinegar"],
  普通酱油: ["酱油", "soy sauce"],
  橄榄油: ["olive oil"],
  芝麻油: ["sesame oil"],
  香油: ["麻油"],
  杏鲍菇: ["king oyster mushroom"],
  金针菇: ["enoki mushroom"],
  香菇: ["shiitake mushroom"],
  上海青: ["小青菜", "青江菜"],
  包菜: ["圆白菜"],
  生菜: ["莴苣叶", "lettuce"],
};
const categoryEmoji: Record<string, string> = {
  蔬菜: "🥬", 水果: "🍎", 菌菇: "🍄", 豆制品: "🧊", 猪肉: "🥩",
  牛肉: "🥩", 羊肉: "🥩", 禽肉: "🍗", 加工肉类: "🥓", 鱼类: "🐟",
  贝类: "🦪", 虾蟹: "🦐", 其他海鲜: "🦑", 蛋类: "🥚", 乳制品: "🥛",
  米: "🍚", 面: "🍜", 谷物: "🌾", 面粉: "🌾", 烘焙材料: "🧁",
  干货: "🥣", 坚果: "🥜", 香料: "🌿", 中式调味料: "🍶",
  西式调味料: "🍶", 酱料: "🥫", 油脂: "🫒", 罐头: "🥫",
  速冻食品: "🧊", 方便食品: "🍱", 饮品: "🥤", 其他: "🥣",
};
const expandedIngredients: Ingredient[] = Object.entries(expandedCatalog).flatMap(
  ([category, names]) => names.filter((name) => !legacyNames.has(name)).map((name) => ({
    id: `zh:${name}`,
    canonicalName: name,
    displayNameZh: name,
    displayNameEn: "",
    aliases: aliasOverrides[name] ?? [],
    category,
    emoji: categoryEmoji[category] ?? "🥣",
    pantryStaple: false,
    allergens: category === "乳制品" ? ["牛奶"] : category === "蛋类" ? ["鸡蛋"] : ["鱼类", "贝类", "虾蟹", "其他海鲜"].includes(category) ? ["海鲜"] : category === "坚果" ? ["坚果"] : [],
  })),
);
export const ingredients: Ingredient[] = [...legacyIngredients, ...expandedIngredients];
export const ingredientById = new Map(ingredients.map((i) => [i.id, i]));
export function normalizeIngredientText(text: string) {
  return text.normalize("NFKC").toLowerCase().trim().replace(/\s+/g, " ");
}
const aliasToIngredient = new Map<string, Ingredient>();
for (const item of ingredients) {
  for (const alias of [item.id, item.displayNameZh, item.displayNameEn, ...item.aliases]) {
    if (alias) {
      const normalized = normalizeIngredientText(alias);
      if (!aliasToIngredient.has(normalized)) aliasToIngredient.set(normalized, item);
    }
  }
}
export function normalizeIngredient(text: string) {
  return aliasToIngredient.get(normalizeIngredientText(text));
}
export function normalizeSearchQuery(text: string) {
  return normalizeIngredientText(text).split(/\s+/).filter(Boolean).map((term) =>
    normalizeIngredient(term)?.displayNameZh ?? term,
  ).join(" ");
}
export function ingredientFromText(text: string) {
  const exact = normalizeIngredient(text);
  if (exact) return exact;
  const normalized = normalizeIngredientText(text);
  const withoutAmount = normalized
    .replace(/^\s*[\d½¼¾⅓⅔⅛⅜⅝⅞./\s-]+\s*(?:g|kg|ml|l|克|千克|毫升|升|个|根|瓣|勺|汤匙|茶匙)?\s*/i, "")
    .replace(/\s*[\d½¼¾⅓⅔⅛⅜⅝⅞./\s-]+\s*(?:g|kg|ml|l|克|千克|毫升|升|个|根|瓣|勺|汤匙|茶匙)?\s*$/i, "")
    .trim();
  const stripped = normalizeIngredient(withoutAmount);
  if (stripped) return stripped;
  return searchableAliases.find(([alias]) =>
    /[\u4e00-\u9fff]/.test(alias)
      ? normalized.includes(alias)
      : new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(normalized),
  )?.[1];
}
const searchableAliases: [string, Ingredient][] = ingredients.flatMap((item) =>
  [item.displayNameZh, item.displayNameEn, ...item.aliases]
    .filter((alias) => alias.length > 1)
    .map((alias): [string, Ingredient] => [normalizeIngredientText(alias), item]),
).sort((a, b) => b[0].length - a[0].length);
export function ingredientName(id: string) {
  return (
    ingredientById.get(id)?.displayNameZh ??
    id.replace(/^unknown:/, "")
  );
}
export function makePantryItem(id: string): PantryItem {
  const i = ingredientById.get(id)!;
  const now = new Date().toISOString();
  return {
    ingredientId: id,
    canonicalName: i.canonicalName,
    displayName: i.displayNameZh,
    category: i.category,
    quantity: null,
    unit: "",
    expiryDate: null,
    storageLocation: i.category === "调料" ? "调料柜" : "冰箱",
    createdAt: now,
    updatedAt: now,
  };
}
export function togglePantry(p: PantryItem[], id: string) {
  return p.some((i) => i.ingredientId === id)
    ? p.filter((i) => i.ingredientId !== id)
    : [...p, makePantryItem(id)];
}
export const demoPantry = () =>
  [
    "tomato",
    "egg",
    "chicken-breast",
    "potato",
    "onion",
    "scallion",
    "oil",
    "salt",
  ].map(makePantryItem);
