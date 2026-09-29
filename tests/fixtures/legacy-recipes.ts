import { ingredientName, ingredients, ingredientById } from "@/lib/ingredients";
import { recipeSchema, type Recipe } from "@/lib/model";
import { z } from "zod";
import quickData from "@/data/recipes/quick.json";
import mainData from "@/data/recipes/mains.json";
import everydayData from "@/data/recipes/everyday.json";
type Seed = {
  id: string;
  title: string;
  description: string;
  time: number;
  prep: number;
  items: [string, number, string, boolean?][];
  steps: [string, string, number][];
  tags: string[];
  cuisine?: string;
};
const seeds: Seed[] = [
  {
    id: "tomato-eggs",
    title: "番茄炒蛋",
    description: "酸甜的番茄汁裹住蓬松鸡蛋，是每次回家都想吃的那一口。",
    time: 15,
    prep: 5,
    items: [
      ["tomato", 2, "个"],
      ["egg", 3, "个"],
      ["scallion", 1, "根", true],
      ["oil", 15, "ml"],
      ["salt", 2, "g"],
      ["sugar", 3, "g", true],
    ],
    steps: [
      [
        "切好番茄，打散鸡蛋",
        "番茄洗净切块。鸡蛋打入碗中，加一半盐搅散。葱洗净切成葱花。",
        180,
      ],
      [
        "炒出蓬松的鸡蛋",
        "锅中加入一半油，中火加热。倒入蛋液，边缘凝固时轻推，炒至基本凝固后盛出。",
        120,
      ],
      [
        "炒软番茄",
        "加入剩余油，下番茄翻炒。加剩余盐，转中小火炒出汁；太干时可加一汤匙水。",
        180,
      ],
      [
        "合炒出锅",
        "倒回鸡蛋，轻轻翻匀至蛋液完全凝固、番茄软烂。按喜好加糖，撒葱花后关火。",
        60,
      ],
    ],
    tags: ["快手菜", "素食", "家常菜"],
  },
  {
    id: "beef-potato",
    title: "土豆炖牛肉",
    description: "小火慢炖，让土豆吸满浓浓肉汁。",
    time: 60,
    prep: 15,
    items: [
      ["beef", 400, "g"],
      ["potato", 2, "个"],
      ["onion", 1, "个"],
      ["ginger", 10, "g"],
      ["soy-sauce", 20, "ml"],
      ["oil", 15, "ml"],
      ["water", 700, "ml"],
    ],
    steps: [
      [
        "处理食材",
        "牛肉切成约 2 厘米块，土豆去皮切块，洋葱切片，姜切片。",
        300,
      ],
      ["焯水", "牛肉冷水下锅，煮开撇去浮沫，捞出沥水。", 300],
      ["炒香", "锅中加油，炒香姜和洋葱，加入牛肉与生抽炒匀。", 180],
      [
        "小火炖煮",
        "加热水没过牛肉，煮沸后加盖小火炖 30 分钟，期间检查水量。",
        1800,
      ],
      [
        "加入土豆",
        "加入土豆再煮 15 分钟，确认牛肉软烂、土豆可轻松戳透；不够软则继续炖。",
        900,
      ],
    ],
    tags: ["家常菜", "高蛋白"],
  },
  {
    id: "kung-pao",
    title: "宫保鸡丁",
    description: "微辣酸甜，花生酥香的经典下饭菜。",
    time: 25,
    prep: 10,
    items: [
      ["chicken-breast", 300, "g"],
      ["peanut", 40, "g"],
      ["scallion", 2, "根"],
      ["chili", 2, "个"],
      ["soy-sauce", 15, "ml"],
      ["vinegar", 10, "ml"],
      ["sugar", 8, "g"],
      ["starch", 8, "g"],
      ["oil", 20, "ml"],
    ],
    steps: [
      [
        "切丁腌制",
        "鸡胸切丁，用一半生抽和淀粉拌匀，腌制 5 分钟。生肉用具清洗后再处理其他食材。",
        300,
      ],
      [
        "调碗汁",
        "剩余生抽、淀粉与醋、糖、30 毫升水混合。葱切段，辣椒剪段。",
        120,
      ],
      [
        "炒鸡丁",
        "油热后炒香辣椒，加入鸡丁翻炒至完全熟透，最厚处中心温度达到 74°C。",
        360,
      ],
      ["收汁撒花生", "加入葱段和碗汁炒至浓稠，加入熟花生翻匀出锅。", 120],
    ],
    tags: ["高蛋白", "下饭菜"],
    cuisine: "川菜",
  },
  {
    id: "pepper-pork",
    title: "青椒肉丝",
    description: "青椒脆嫩，肉丝滑嫩，配一碗热饭刚刚好。",
    time: 20,
    prep: 10,
    items: [
      ["pork", 250, "g"],
      ["pepper", 2, "个"],
      ["soy-sauce", 15, "ml"],
      ["starch", 5, "g"],
      ["oil", 15, "ml"],
      ["garlic", 2, "瓣"],
    ],
    steps: [
      ["切丝腌肉", "猪肉切细丝，加生抽、淀粉拌匀。青椒去籽切丝，蒜切片。", 300],
      ["滑炒肉丝", "锅中加油，放入肉丝划散，翻炒至完全熟透后盛出。", 240],
      ["炒青椒", "用锅内余油炒香蒜片，加入青椒丝炒至稍软。", 120],
      ["合炒", "倒回肉丝，翻炒均匀。尝味后酌量调味，关火盛出。", 60],
    ],
    tags: ["快手菜", "高蛋白"],
  },
  {
    id: "garlic-broccoli",
    title: "蒜蓉西兰花",
    description: "清爽翠绿，蒜香四溢的一盘蔬菜。",
    time: 12,
    prep: 5,
    items: [
      ["broccoli", 1, "个"],
      ["garlic", 3, "瓣"],
      ["oil", 10, "ml"],
      ["salt", 2, "g"],
    ],
    steps: [
      ["切洗", "西兰花切小朵充分冲洗，蒜剁碎。", 180],
      ["焯水", "水煮沸后下西兰花，焯至颜色变亮后捞出沥水。", 90],
      [
        "蒜香翻炒",
        "锅中加油，小火炒香蒜末，再加入西兰花与盐，中火翻炒至熟、仍保留口感。",
        120,
      ],
    ],
    tags: ["Vegan", "素食", "低碳", "快手菜"],
  },
  {
    id: "egg-rice",
    title: "黄金蛋炒饭",
    description: "粒粒分明，十分钟把剩饭变成一顿好饭。",
    time: 10,
    prep: 3,
    items: [
      ["rice", 300, "g"],
      ["egg", 2, "个"],
      ["scallion", 1, "根"],
      ["oil", 15, "ml"],
      ["salt", 2, "g"],
    ],
    steps: [
      [
        "准备米饭",
        "使用及时冷藏、保存妥当的熟米饭，将结块打散。鸡蛋打散，葱切碎。",
        120,
      ],
      ["炒蛋", "油热后加入蛋液炒散至凝固。", 60],
      ["炒饭", "加入米饭，用锅铲压散并翻炒至米饭整体热透、冒热气。", 240],
      ["调味", "加入盐和葱花炒匀，立即盛出食用。", 60],
    ],
    tags: ["快手菜", "一人食", "素食"],
  },
  {
    id: "braised-chicken",
    title: "红烧鸡腿",
    description: "酱香浓郁，连汤汁都不想浪费。",
    time: 40,
    prep: 10,
    items: [
      ["chicken-thigh", 4, "个"],
      ["ginger", 10, "g"],
      ["soy-sauce", 20, "ml"],
      ["dark-soy", 5, "ml"],
      ["sugar", 8, "g"],
      ["oil", 10, "ml"],
    ],
    steps: [
      ["准备鸡腿", "鸡腿表面擦干，用刀在厚处划两道。姜切片。", 180],
      ["煎香", "锅中放油，中火煎鸡腿至两面略金黄。", 360],
      [
        "炖煮",
        "加入姜、生抽、老抽、糖和没过一半鸡腿的水，煮沸后加盖小火煮 20 分钟，中途翻面。",
        1200,
      ],
      ["收汁", "确认最厚处中心温度达到 74°C，再开盖收浓汤汁。", 240],
    ],
    tags: ["高蛋白", "家常菜"],
  },
  {
    id: "mapo-tofu",
    title: "家常麻婆豆腐",
    description: "热腾腾的豆腐配上香辣肉末，特别下饭。",
    time: 20,
    prep: 5,
    items: [
      ["tofu", 400, "g"],
      ["pork", 100, "g"],
      ["douban", 15, "g"],
      ["garlic", 2, "瓣"],
      ["starch", 5, "g"],
      ["oil", 10, "ml"],
      ["scallion", 1, "根", true],
    ],
    steps: [
      ["准备", "豆腐切方块，猪肉剁成肉末，蒜切末，淀粉加 30 毫升水调开。", 240],
      [
        "炒肉末",
        "热锅放油，炒肉末至完全熟透。加入蒜末与豆瓣酱，小火炒香。",
        240,
      ],
      [
        "煮豆腐",
        "加入 150 毫升水和豆腐，小火煮至充分热透，轻推避免破碎。",
        300,
      ],
      ["勾芡", "淀粉水再次搅匀，分两次倒入锅中，煮至汤汁浓稠，撒葱花。", 60],
    ],
    tags: ["下饭菜", "家常菜"],
    cuisine: "川菜",
  },
  {
    id: "onion-eggs",
    title: "洋葱炒蛋",
    description: "简单的两样食材，也能做出甜香好滋味。",
    time: 12,
    prep: 4,
    items: [
      ["onion", 1, "个"],
      ["egg", 3, "个"],
      ["oil", 15, "ml"],
      ["salt", 2, "g"],
    ],
    steps: [
      ["准备", "洋葱去皮切细丝，鸡蛋加盐打散。", 120],
      ["炒洋葱", "热锅放油，加入洋葱中火炒至软化透明。", 240],
      ["加入鸡蛋", "倒入蛋液，稍凝固后翻炒至鸡蛋完全凝固，盛出。", 120],
    ],
    tags: ["素食", "快手菜", "低碳"],
  },
  {
    id: "cola-wings",
    title: "可乐鸡翅",
    description: "甜咸适口、色泽诱人的家常鸡翅。",
    time: 35,
    prep: 5,
    items: [
      ["wings", 8, "个"],
      ["cola", 250, "ml"],
      ["soy-sauce", 15, "ml"],
      ["ginger", 10, "g"],
      ["oil", 10, "ml"],
    ],
    steps: [
      ["准备", "鸡翅擦干，两面划口，姜切片。", 180],
      ["煎香", "锅内加油，把鸡翅两面煎至金黄。", 360],
      ["煮透", "加入姜、生抽和可乐，煮开后中小火加盖煮 15 分钟。", 900],
      [
        "收汁",
        "确认中心温度达到 74°C，开盖收汁至浓稠，不停翻动避免烧焦。",
        300,
      ],
    ],
    tags: ["家常菜", "下饭菜"],
  },
  {
    id: "chicken-pasta",
    title: "番茄鸡肉意面",
    description: "一盘满足的意面，番茄与鸡胸肉的轻盈搭配。",
    time: 25,
    prep: 8,
    items: [
      ["pasta", 180, "g"],
      ["chicken-breast", 200, "g"],
      ["tomato", 2, "个"],
      ["onion", 0.5, "个"],
      ["garlic", 2, "瓣"],
      ["oil", 15, "ml"],
      ["salt", 3, "g"],
    ],
    steps: [
      ["准备食材", "番茄切块，洋葱与蒜切碎，鸡胸肉切小块。", 240],
      ["煮意面", "沸水加盐，按包装时间煮意面，捞出前留半杯煮面水。", 600],
      [
        "做酱汁",
        "锅中加油炒香蒜和洋葱，加入鸡肉炒至中心 74°C，加入番茄煮软。",
        480,
      ],
      ["拌面", "放入意面，少量多次加入煮面水，拌炒至酱汁包裹面条。", 120],
    ],
    tags: ["高蛋白"],
    cuisine: "意大利菜",
  },
  {
    id: "mushroom-pasta",
    title: "奶油蘑菇意面",
    description: "浓郁奶香与蘑菇鲜味，一道温柔的晚餐。",
    time: 25,
    prep: 5,
    items: [
      ["pasta", 180, "g"],
      ["mushroom", 200, "g"],
      ["cream", 100, "ml"],
      ["butter", 15, "g"],
      ["garlic", 2, "瓣"],
      ["salt", 2, "g"],
      ["black-pepper", 1, "g"],
    ],
    steps: [
      ["煮面", "按包装说明在沸水中煮意面，留半杯煮面水。", 600],
      [
        "煎蘑菇",
        "蘑菇切片、蒜切碎。黄油融化后炒香蒜，下蘑菇炒至表面微黄。",
        300,
      ],
      ["煮奶油酱", "加入淡奶油，小火煮至略稠，加盐与黑胡椒。", 180],
      ["拌匀", "加入意面，少量煮面水调整浓稠度，翻拌均匀后立即食用。", 60],
    ],
    tags: ["素食"],
    cuisine: "意大利菜",
  },
];
const originalRecipes: Recipe[] = seeds.map((s) =>
  recipeSchema.parse({
    id: s.id,
    slug: s.id,
    title: s.title,
    description: s.description,
    image: null,
    sourceProvider: "local",
    sourceName: "KitchenMate 原创示范",
    sourceUrl: null,
    sourceAuthor: "KitchenMate",
    externalId: s.id,
    cuisine: s.cuisine ?? "中餐",
    category: "家常菜",
    difficulty: "简单",
    prepTime: s.prep,
    cookTime: s.time - s.prep,
    totalTime: s.time,
    servings: 2,
    ingredients: s.items.map(([ingredientId, quantity, unit, optional]) => ({
      ingredientId,
      quantity,
      unit,
      optional: optional ?? false,
      originalText: `${ingredientName(ingredientId)} ${quantity}${unit}`,
      group:
        ingredients.find((i) => i.id === ingredientId)?.category === "调料"
          ? "调料"
          : "主料",
    })),
    instructions: s.steps.map(([title, description, durationSeconds], i) => ({
      stepNumber: i + 1,
      title,
      description,
      durationSeconds,
      image: null,
      tips: "按实际火力与食材状态调整时间。",
      temperature: null,
    })),
    equipment: ["炒锅"],
    tags: s.tags,
    allergens: [
      ...new Set(
        s.items.flatMap(
          ([id]) => ingredients.find((i) => i.id === id)?.allergens ?? [],
        ),
      ),
    ],
    nutrition: null,
    rating: null,
    createdAt: "2026-09-28T00:00:00.000Z",
    updatedAt: "2026-09-28T00:00:00.000Z",
    sourceUpdatedAt: null,
    lastFetchedAt: null,
  }),
);
const contentRowSchema = z.tuple([
  z.string().min(1),
  z.string().min(1),
  z.number().positive(),
  z.string().min(8),
  z
    .array(
      z.tuple([z.string().min(1), z.number().positive(), z.string().min(1)]),
    )
    .min(2),
  z.array(z.string().min(5)).min(2),
]);
function loadRecipes(raw: unknown, category: string): Recipe[] {
  return z
    .array(contentRowSchema)
    .parse(raw)
    .map(([id, title, totalTime, description, items, steps]) => {
      for (const [ingredientId] of items) {
        if (!ingredientById.has(ingredientId))
          throw new Error(`Unknown ingredient ${ingredientId} in ${id}`);
      }
      return recipeSchema.parse({
        id,
        slug: id,
        title,
        description,
        image: null,
        sourceProvider: "local",
        sourceName: "KitchenMate 原创",
        sourceUrl: null,
        sourceAuthor: "KitchenMate",
        externalId: id,
        cuisine: category === "西式与海鲜" ? "家常融合" : "中餐",
        category,
        difficulty: totalTime <= 30 ? "简单" : "普通",
        prepTime: Math.min(10, Math.max(3, Math.floor(totalTime / 3))),
        cookTime:
          totalTime - Math.min(10, Math.max(3, Math.floor(totalTime / 3))),
        totalTime,
        servings: 2,
        ingredients: items.map(([ingredientId, quantity, unit]) => ({
          ingredientId,
          quantity,
          unit,
          optional: false,
          originalText: `${ingredientName(ingredientId)} ${quantity}${unit}`,
          group: ingredientById.get(ingredientId)?.pantryStaple
            ? "调料"
            : "主料",
        })),
        instructions: steps.map((step, index) => ({
          stepNumber: index + 1,
          title: `步骤 ${index + 1}`,
          description: step,
          durationSeconds: null,
          image: null,
          tips: "根据火力与食材状态调整时间。",
          temperature: null,
        })),
        equipment: ["炒锅"],
        tags: [category, ...(totalTime <= 20 ? ["快手菜"] : [])],
        allergens: [
          ...new Set(
            items.flatMap(([id]) => ingredientById.get(id)?.allergens ?? []),
          ),
        ],
        nutrition: null,
        rating: null,
        createdAt: "2026-09-29T00:00:00.000Z",
        updatedAt: "2026-09-29T00:00:00.000Z",
        sourceUpdatedAt: null,
        lastFetchedAt: null,
      });
    });
}
export const localRecipes: Recipe[] = [
  ...originalRecipes,
  ...loadRecipes(quickData, "快手家常"),
  ...loadRecipes(mainData, "肉类主菜"),
  ...loadRecipes(everydayData, "西式与海鲜"),
];
export const localRecipeById = new Map(
  localRecipes.map((recipe) => [recipe.id, recipe]),
);
