import type { Ingredient, PantryItem } from "./model";
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
  ["pork", "猪肉", "Pork", "猪里脊", "肉类", "🥩"],
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
    "酱油|酱油/生抽|soy sauce",
    "调料",
    "🍶",
  ],
  ["dark-soy", "老抽", "Dark soy sauce", "酱油/老抽", "调料", "🍶"],
  ["vinegar", "醋", "Vinegar", "陈醋|rice vinegar", "调料", "🍶"],
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
    "植物油|vegetable oil|olive oil|sunflower oil",
    "调料",
    "🫒",
  ],
  ["water", "水", "Water", "", "调料", "💧"],
  ["peanut", "花生", "Peanut", "peanuts", "其他", "🥜"],
  ["douban", "豆瓣酱", "Chili bean paste", "郫县豆瓣酱", "调料", "🥫"],
  ["starch", "淀粉", "Corn starch", "cornflour|cornstarch", "调料", "🥣"],
  ["wings", "鸡翅", "Chicken wings", "", "肉类", "🍗"],
  ["cola", "可乐", "Cola", "", "其他", "🥤"],
];
export const ingredients: Ingredient[] = rows.map(
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
const key = (s: string) =>
  s.normalize("NFKC").toLowerCase().trim().replace(/\s+/g, " ");
export function normalizeIngredient(text: string) {
  return ingredients.find((i) =>
    [i.id, i.displayNameZh, i.displayNameEn, ...i.aliases].some(
      (a) => key(a) === key(text),
    ),
  );
}
export function ingredientFromText(text: string) {
  const exact = normalizeIngredient(text);
  if (exact) return exact;
  return [...ingredients]
    .sort((a, b) => b.displayNameZh.length - a.displayNameZh.length)
    .find((i) =>
      [i.displayNameZh, i.displayNameEn, ...i.aliases].some((a) =>
        /[\u4e00-\u9fff]/.test(a)
          ? text.includes(a)
          : new RegExp(
              `\\b${a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
              "i",
            ).test(text),
      ),
    );
}
export function ingredientName(id: string) {
  return (
    ingredients.find((i) => i.id === id)?.displayNameZh ??
    id.replace(/^unknown:/, "")
  );
}
export function makePantryItem(id: string): PantryItem {
  const i = ingredients.find((i) => i.id === id)!;
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
