"use client";
import { useEffect, useLayoutEffect, useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  BookOpen,
  Menu,
  ArrowRight,
  Plus,
  Check,
  ChefHat,
  ShoppingBasket,
  Refrigerator,
  Compass,
  Link2,
  Moon,
  Sun,
  X,
  Clock,
  Flame,
  Leaf,
  Heart,
} from "lucide-react";
import { z } from "zod";
import {
  createBackup,
  loadDeviceState,
  parseBackup,
  saveDeviceState,
  type DeviceState,
} from "@/lib/storage/device";
import { AllRecipesPage } from "@/features/recipes/all-recipes-page";
import {
  saveBrowseState,
  takeBrowseState,
  restoreBrowsePosition,
  recordRecipeOrigin,
  type BrowsePosition,
} from "@/lib/recipe-navigation";
import { IngredientPicker } from "@/features/pantry/ingredient-picker";
import {
  ingredientById,
  ingredientName,
  demoPantry,
  togglePantry,
} from "@/lib/ingredients";
import { verifiedRecipes } from "@/lib/verified-recipes";
import {
  canCookRecipe,
  canDisplayRecipe,
  dedupeRecipes,
} from "@/lib/recipe-trust";
import {
  matchesRecommendationMode,
  matchRecipe,
  searchRecipe,
  selectedIngredientIds,
} from "@/lib/matching";
import { scaleQuantity } from "@/lib/units";
import { Recipe, PantryItem, ShoppingItem, recipeSchema } from "@/lib/model";

const nav = [
  ["/", "今天吃什么", ChefHat],
  ["/pantry", "我的厨房", Refrigerator],
  ["/discover", "发现菜谱", Compass],
  ["/recipes", "全部教程", BookOpen],
  ["/shopping", "购物清单", ShoppingBasket],
  ["/import", "导入菜谱", Link2],
] as const;
const ImportPageView = dynamic(() =>
  import("@/features/import/import-page").then(
    (module) => module.ImportPageView,
  ),
);
const CookingMode = dynamic(() =>
  import("@/features/cooking/cooking-mode").then(
    (module) => module.CookingMode,
  ),
);
const ShoppingPageView = dynamic(() =>
  import("@/features/shopping/shopping-page").then(
    (module) => module.ShoppingPageView,
  ),
);
const RecipeDetailView = dynamic(() =>
  import("@/features/recipes/recipe-detail-view").then(
    (module) => module.RecipeDetailView,
  ),
);
const PantryPageView = dynamic(() =>
  import("@/features/pantry/pantry-page").then(
    (module) => module.PantryPageView,
  ),
);
const DiscoverPageView = dynamic(() =>
  import("@/features/recipes/discover-page").then(
    (module) => module.DiscoverPageView,
  ),
);
const foodArt: Record<string, string> = {
  "tomato-eggs": "🍅",
  "beef-potato": "🥔",
  "kung-pao": "🌶️",
  "pepper-pork": "🫑",
  "garlic-broccoli": "🥦",
  "egg-rice": "🍚",
  "braised-chicken": "🍗",
  "mapo-tofu": "🥢",
  "onion-eggs": "🧅",
  "cola-wings": "🍗",
  "chicken-pasta": "🍝",
  "mushroom-pasta": "🍄",
};
function FoodImage({ recipe, big = false }: { recipe: Recipe; big?: boolean }) {
  return recipe.image ? (
    <img
      className={big ? "food-image big" : "food-image"}
      src={recipe.image}
      alt={recipe.title}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  ) : (
    <div
      className={`food-art ${big ? "big" : ""} art-${verifiedRecipes.findIndex((r) => r.id === recipe.id) % 4}`}
    >
      <div className="plate">
        <span>
          {foodArt[recipe.id] ??
            ingredientById.get(
              recipe.ingredients.find(
                (item) => !ingredientById.get(item.ingredientId)?.pantryStaple,
              )?.ingredientId ?? "",
            )?.emoji ??
            "🥣"}
        </span>
        <i>✦</i>
      </div>
      <span className="illustration-label">食材插画 · 非菜品实拍</span>
    </div>
  );
}
export function KitchenApp() {
  const path = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [pantry, setPantry] = useState<PantryItem[]>([]);
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [saved, setSaved] = useState<Recipe[]>([]);
  const [online, setOnline] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentRecipeIds, setRecentRecipeIds] = useState<string[]>([]);
  const [dark, setDark] = useState(false);
  const [message, setMessage] = useState("");
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("现在就能做");
  const [filters, setFilters] = useState(false);
  const [maxTime, setMaxTime] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [diet, setDiet] = useState("");
  const [equipment, setEquipment] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("为我推荐");
  const [visibleRecipes, setVisibleRecipes] = useState(24);
  const [browsePosition, setBrowsePosition] = useState<BrowsePosition | null>(
    null,
  );
  useEffect(() => {
    if (path !== "/discover") return;
    const frame = requestAnimationFrame(() => {
      const restored = takeBrowseState<{
        query: string;
        mode: string;
        filters: boolean;
        maxTime: string;
        difficulty: string;
        cuisine: string;
        diet: string;
        equipment: string;
        onlyFavorites: boolean;
        sourceFilter: string;
        visibleRecipes: number;
      }>("/discover");
      if (!restored) return;
      setQuery(restored.query);
      setMode(restored.mode);
      setFilters(restored.filters);
      setMaxTime(restored.maxTime);
      setDifficulty(restored.difficulty);
      setCuisine(restored.cuisine);
      setDiet(restored.diet);
      setEquipment(restored.equipment);
      setOnlyFavorites(restored.onlyFavorites);
      setSourceFilter(restored.sourceFilter);
      setVisibleRecipes(restored.visibleRecipes);
      setBrowsePosition(restored);
    });
    return () => cancelAnimationFrame(frame);
  }, [path]);
  useLayoutEffect(() => {
    if (path === "/discover" && ready && browsePosition)
      return restoreBrowsePosition(browsePosition, () =>
        setBrowsePosition(null),
      );
  }, [path, ready, browsePosition]);
  const [servingChoice, setServingChoice] = useState<{
    id: string;
    value: number;
  } | null>(null);
  const [importUrl, setImportUrl] = useState("");
  const [importPreview, setImportPreview] = useState<Recipe | null>(null);
  const [backupPreview, setBackupPreview] = useState<DeviceState | null>(null);
  useEffect(() => {
    let active = true;
    loadDeviceState()
      .then((data) => {
        if (!active) return;
        if (data) {
          setPantry(data.pantry);
          setShopping(data.shopping);
          setSaved(data.saved);
          const currentId = window.location.pathname.startsWith("/recipe/")
            ? decodeURIComponent(window.location.pathname.split("/")[2])
            : null;
          setFavorites(data.favorites);
          setRecentRecipeIds(
            currentId
              ? [
                  currentId,
                  ...data.recentRecipeIds.filter((id) => id !== currentId),
                ].slice(0, 20)
              : data.recentRecipeIds,
          );
          setDark(data.dark);
        } else setPantry(demoPantry());
        setReady(true);
      })
      .catch(() => {
        if (!active) return;
        setMessage("本地数据无法读取，已保留空厨房。");
        setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  useLayoutEffect(() => {
    if (ready) {
      saveDeviceState({
        pantry,
        shopping,
        saved,
        favorites,
        recentRecipeIds,
        dark,
      }).catch(() => {});
      document.documentElement.dataset.theme = dark ? "dark" : "light";
    }
  }, [ready, pantry, shopping, saved, favorites, recentRecipeIds, dark]);
  function exportData() {
    const backup = createBackup({
      pantry,
      shopping,
      saved,
      favorites,
      recentRecipeIds,
      dark,
    });
    const href = URL.createObjectURL(
      new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }),
    );
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = "kitchenmate-backup.json";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
  async function previewBackup(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 5_000_000) throw new Error("备份文件过大");
      setBackupPreview(parseBackup(await file.text()).data);
    } catch {
      setMessage("备份格式无效，请选择 KitchenMate 导出的 JSON 文件。");
    }
  }
  function restoreBackup() {
    if (!backupPreview) return;
    setPantry(backupPreview.pantry);
    setShopping(backupPreview.shopping);
    setSaved(backupPreview.saved);
    setFavorites(backupPreview.favorites);
    setRecentRecipeIds(backupPreview.recentRecipeIds);
    setDark(backupPreview.dark);
    setBackupPreview(null);
    setMessage("备份已恢复到这台设备。");
  }
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 4500);
    return () => clearTimeout(t);
  }, [message]);
  const allRecipes = useMemo(
    () => dedupeRecipes([...verifiedRecipes, ...saved, ...online]),
    [saved, online],
  );
  const ingredientIndex = useMemo(() => {
    const index = new Map<string, Set<string>>();
    for (const recipe of allRecipes)
      for (const item of recipe.ingredients) {
        if (!index.has(item.ingredientId))
          index.set(item.ingredientId, new Set());
        index.get(item.ingredientId)!.add(recipe.id);
      }
    return index;
  }, [allRecipes]);
  const candidates = useMemo(
    () =>
      new Set(
        [...selectedIngredientIds(pantry)].flatMap((id) => [
          ...(ingredientIndex.get(id) ?? []),
        ]),
      ),
    [pantry, ingredientIndex],
  );
  const selectedId = path.startsWith("/recipe/")
    ? decodeURIComponent(path.split("/")[2])
    : null;
  // Catalog URL deduplication must not hide a device-only snapshot opened by ID.
  const selected = [...saved, ...online, ...verifiedRecipes].find(
    (r) => r.id === selectedId && canDisplayRecipe(r),
  );
  const servings =
    servingChoice?.id === selectedId
      ? servingChoice.value
      : (selected?.servings ?? 2);
  function setServings(value: number | ((previous: number) => number)) {
    setServingChoice({
      id: selectedId ?? "",
      value: typeof value === "function" ? value(servings) : value,
    });
  }
  const cooking = path.endsWith("/cook");
  useEffect(() => {
    if (!ready || !selectedId || selected || selectedId.startsWith("import:"))
      return;
    let cancelled = false;
    fetch(`/api/recipes/${encodeURIComponent(selectedId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.recipe)
          setOnline((prev) => [...prev, recipeSchema.parse(data.recipe)]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [ready, selectedId, selected]);
  async function searchOnline() {
    setLoading(true);
    setWarning("");
    try {
      const result = await fetch(
        `/api/recipes?q=${encodeURIComponent(query)}&ingredients=${pantry.map((i) => i.ingredientId).join(",")}`,
      ).then((r) => r.json());
      if (result.error) throw new Error(result.error);
      setOnline(z.array(recipeSchema).parse(result.recipes));
      setWarning(result.warnings.join(" · "));
      if (!result.recipes.some((r: Recipe) => r.sourceProvider !== "howtocook"))
        setMessage("已验证菜谱已更新；在线来源未配置或没有匹配结果。");
    } catch {
      setWarning("在线菜谱暂时不可用，已验证菜谱仍可使用。");
    } finally {
      setLoading(false);
    }
  }
  function addMissing(recipe: Recipe) {
    const missing = matchRecipe(recipe, pantry).missing;
    setShopping((prev) => {
      const next = [...prev];
      for (const item of missing) {
        const existing = next.find(
          (x) =>
            x.ingredientId === item.ingredientId &&
            x.unit === item.unit &&
            !x.checked,
        );
        const quantity = scaleQuantity(
          item.quantity,
          recipe.servings,
          servings,
        );
        if (existing) {
          const idx = next.indexOf(existing);
          next[idx] = {
            ...existing,
            quantity:
              existing.quantity === null || quantity === null
                ? null
                : existing.quantity + quantity,
          };
        } else
          next.push({
            ...item,
            quantity,
            id: crypto.randomUUID(),
            name: ingredientName(item.ingredientId),
            category: ingredientById.get(item.ingredientId)?.category ?? "其他",
            checked: false,
          });
      }
      return next;
    });
    setMessage(
      missing.length
        ? `已将 ${missing.length} 种食材加入购物清单`
        : "食材都齐了，可以开火啦！",
    );
  }
  function openRecipe(recipe: Recipe) {
    if (path === "/discover")
      saveBrowseState(
        path,
        {
          query,
          mode,
          filters,
          maxTime,
          difficulty,
          cuisine,
          diet,
          equipment,
          onlyFavorites,
          sourceFilter,
          visibleRecipes,
        },
        recipe.id,
      );
    else recordRecipeOrigin(recipe.id);
    setRecentRecipeIds((current) =>
      [recipe.id, ...current.filter((id) => id !== recipe.id)].slice(0, 20),
    );
    setServingChoice({ id: recipe.id, value: recipe.servings });
    if (recipe.sourceProvider !== "howtocook")
      setSaved((prev) => [...prev.filter((r) => r.id !== recipe.id), recipe]);
    router.push(`/recipe/${encodeURIComponent(recipe.id)}`);
  }
  async function importRecipe(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const recipe = recipeSchema.parse(data.recipe);
      setImportPreview(recipe);
      setMessage("找到了这个菜谱，请预览后保存到本设备。");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "导入失败");
    } finally {
      setLoading(false);
    }
  }
  function saveImportPreview() {
    if (!importPreview) return;
    setSaved((prev) => [
      ...prev.filter((r) => r.id !== importPreview.id),
      importPreview,
    ]);
    setMessage("菜谱已保存到这台设备，刷新页面仍可查看。");
    setImportPreview(null);
  }
  async function refreshImportedRecipe(recipe: Recipe) {
    if (!recipe.sourceUrl || recipe.sourceProvider !== "url-import") return;
    setLoading(true);
    try {
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: recipe.sourceUrl }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const refreshed = recipeSchema.parse(data.recipe);
      const changed =
        JSON.stringify([
          recipe.title,
          recipe.ingredients,
          recipe.instructions,
        ]) !==
        JSON.stringify([
          refreshed.title,
          refreshed.ingredients,
          refreshed.instructions,
        ]);
      setSaved((prev) => [
        ...prev.filter((item) => item.id !== recipe.id),
        refreshed,
      ]);
      setOnline((prev) => [
        ...prev.filter((item) => item.id !== recipe.id),
        refreshed,
      ]);
      setMessage(
        changed
          ? "原菜谱有更新，已保存新的本地快照。"
          : "已检查原网页，菜谱内容没有变化。",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "暂时无法检查原网页");
    } finally {
      setLoading(false);
    }
  }
  const matches = allRecipes
    .filter(
      (r) =>
        !(sourceFilter === "为我推荐" && pantry.length) || candidates.has(r.id),
    )
    .filter(
      (r) =>
        searchRecipe(r, query) &&
        (!maxTime ||
          (r.totalTime !== null && r.totalTime <= Number(maxTime))) &&
        (!difficulty || r.difficulty === difficulty) &&
        (!cuisine || r.cuisine === cuisine) &&
        (!diet || r.tags.includes(diet)) &&
        (!equipment || r.equipment.includes(equipment)) &&
        (!onlyFavorites || favorites.includes(r.id)) &&
        (sourceFilter === "为我推荐" ||
          (sourceFilter === "在线菜谱" && r.sourceProvider === "themealdb") ||
          (sourceFilter === "我的导入" &&
            r.provenance.type === "USER_IMPORTED")),
    )
    .map((recipe) => ({ recipe, match: matchRecipe(recipe, pantry) }))
    .filter(
      ({ recipe }) =>
        sourceFilter !== "为我推荐" ||
        matchesRecommendationMode(recipe, pantry, mode),
    )
    .sort(
      (a, b) =>
        (mode === "最匹配" ? 0 : a.match.missingCore - b.match.missingCore) ||
        b.match.score - a.match.score ||
        b.match.selectedIngredientUsage - a.match.selectedIngredientUsage ||
        Number(canCookRecipe(b.recipe)) - Number(canCookRecipe(a.recipe)),
    );
  const pantryPicker = (
    <IngredientPicker
      pantry={pantry}
      onToggle={(id) => setPantry((previous) => togglePantry(previous, id))}
    />
  );
  const recipeCards = (limit?: number) => (
    <div className="recipe-grid">
      {matches
        .slice(0, limit ?? visibleRecipes)
        .map(({ recipe: r, match: m }) => (
          <article className="recipe-card" key={r.id} data-recipe-id={r.id}>
            <button
              className="image-button"
              onClick={() => openRecipe(r)}
              aria-label={`查看${r.title}`}
            >
              <FoodImage recipe={r} />
              <span className="match-badge">
                <Leaf size={13} />
                {m.score}% 食材匹配
              </span>
            </button>
            <button
              className={`favorite ${favorites.includes(r.id) ? "saved" : ""}`}
              aria-label={`${favorites.includes(r.id) ? "取消收藏" : "收藏"}${r.title}`}
              onClick={() =>
                setFavorites((prev) =>
                  prev.includes(r.id)
                    ? prev.filter((id) => id !== r.id)
                    : [...prev, r.id],
                )
              }
            >
              <Heart size={17} />
            </button>
            <div className="recipe-body">
              <small>
                {"来源已验证"} <span>·</span> {r.sourceName}
              </small>
              <button className="recipe-title" onClick={() => openRecipe(r)}>
                {r.title}
              </button>
              {r.instructionAvailability === "source-only" && (
                <p>完整步骤在原网站</p>
              )}
              <div className="recipe-meta">
                <span>
                  <Clock size={14} />
                  {r.totalTime === null ? "时间未知" : `${r.totalTime} 分钟`}
                </span>
                <span>
                  <Flame size={14} />
                  {r.difficulty}
                </span>
              </div>
              <div className="match-line">
                <span>
                  已有 {m.available.length} / {m.totalRequiredIngredients} 种
                </span>
                <span>
                  {m.missing.length
                    ? `还缺 ${m.missing.length} 种`
                    : "食材已备齐"}
                </span>
              </div>
              <div className="progress">
                <i style={{ width: `${m.score}%` }} />
              </div>
              <p className="available">
                你已经有：
                {m.available
                  .map((i) => ingredientName(i.ingredientId))
                  .join("、") || "暂未添加"}
              </p>
              <p className="missing">
                还缺：
                {m.missing
                  .map((i) => ingredientName(i.ingredientId))
                  .join("、") || "无"}
              </p>
            </div>
          </article>
        ))}
      {!limit && matches.length > visibleRecipes && (
        <button
          className="secondary load-more"
          onClick={() => setVisibleRecipes((count) => count + 24)}
        >
          加载更多菜谱
        </button>
      )}
    </div>
  );
  if (cooking && selected && canCookRecipe(selected))
    return (
      <CookingMode
        recipe={selected}
        onExit={() => router.push(`/recipe/${encodeURIComponent(selected.id)}`)}
      />
    );
  if (!ready)
    return (
      <main aria-live="polite" className="loading-state">
        正在读取本机厨房数据…
      </main>
    );
  return (
    <>
      <header className="site-header">
        <Link href="/" className="brand">
          <span className="brand-icon">
            <ChefHat size={25} />
          </span>
          <span>
            今天吃什么<small>KITCHENMATE</small>
          </span>
        </Link>
        <nav aria-label="主导航">
          {nav.map(([href, label, Icon]) => (
            <Link
              key={href}
              href={href}
              className={path === href ? "active" : ""}
            >
              <Icon size={17} />
              {label}
              {href === "/shopping" &&
                shopping.filter((i) => !i.checked).length > 0 && (
                  <b>{shopping.filter((i) => !i.checked).length}</b>
                )}
            </Link>
          ))}
        </nav>
        <button
          className="icon-button theme"
          aria-label={dark ? "切换浅色模式" : "切换深色模式"}
          onClick={() => setDark(!dark)}
        >
          {dark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <span className="avatar">K</span>
      </header>
      <main>
        {path === "/" && (
          <>
            <section className="hero">
              <div className="hero-copy">
                <div className="eyebrow">
                  <span /> 好好吃饭，从自己的厨房开始
                </div>
                <h1>
                  今天吃什么？
                  <br />
                  <em>厨房里，就有答案。</em>
                </h1>
                <p>
                  选出手头有的食材，找到真实来源的菜谱。
                  <br />
                  每份正式教程都能查看原始出处。
                </p>
                <a href="#ingredients" className="primary">
                  <Plus size={18} /> 添加我的食材
                </a>
                <Link href="/recipes" className="text-link hero-browse">
                  浏览全部教程 <ArrowRight size={16} />
                </Link>
                <div className="hero-note">
                  <Leaf size={15} /> 用好每一份食材，不浪费每一份美好
                </div>
              </div>
              <div className="hero-art" aria-label="厨房食材插画">
                <span className="art-caption">
                  A LITTLE OF THIS,
                  <br />A TASTE OF HOME.
                </span>
                <div className="board">
                  <span className="tomato">🍅</span>
                  <span className="broccoli">🥦</span>
                  <span className="egg">🥚</span>
                  <span className="carrot">🥕</span>
                  <span className="garlic">🧄</span>
                  <span className="leaf">🌿</span>
                </div>
                <span className="art-sticker">
                  <span>🌱</span> 新鲜灵感
                  <br />
                  <b>就在你的厨房</b>
                </span>
                <small>厨房食材插画</small>
              </div>
            </section>
            <div className="home-layout">
              <section className="panel picker-panel" id="ingredients">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">MY INGREDIENTS</span>
                    <h2>你厨房里现在有什么？</h2>
                  </div>
                  <span className="subtle">点一下，就加好了</span>
                </div>
                {pantryPicker}
              </section>
              <aside className="pantry-summary">
                <div className="section-heading">
                  <h3>
                    <Refrigerator size={20} /> 我的厨房
                  </h3>
                  <span className="count">{pantry.length}</span>
                </div>
                <p>今晚的美味，从这些食材开始。</p>
                <div className="selected-chips">
                  {pantry.length ? (
                    pantry.map((p) => (
                      <button
                        key={p.ingredientId}
                        onClick={() =>
                          setPantry((prev) =>
                            prev.filter(
                              (i) => i.ingredientId !== p.ingredientId,
                            ),
                          )
                        }
                      >
                        {ingredientById.get(p.ingredientId)?.emoji}{" "}
                        {ingredientName(p.ingredientId)}
                        <X size={12} />
                      </button>
                    ))
                  ) : (
                    <p>先告诉我你厨房里有什么吧。试试鸡蛋、番茄和土豆。</p>
                  )}
                </div>
                <Link className="text-link" href="/pantry">
                  选择我的食材 <ArrowRight size={14} />
                </Link>
                <Link href="/discover" className="primary full">
                  看看我能做什么 <ArrowRight size={18} />
                </Link>
                <Link href="/recipes" className="secondary full">
                  浏览全部教程
                </Link>
                <span className="tiny">点选食材，查看真实来源</span>
              </aside>
            </div>
            <section className="recommend-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">MADE FOR YOUR PANTRY</span>
                  <h2>今天，试试这几道</h2>
                  <p>根据你的厨房食材，为你挑选。</p>
                </div>
                <Link href="/recipes" className="text-link">
                  查看全部教程 <ArrowRight size={16} />
                </Link>
              </div>
              {pantry.length ? (
                recipeCards(4)
              ) : (
                <div className="empty">
                  <Leaf />
                  <h3>先添加食材，让灵感发生</h3>
                  <p>点击上方的热门食材，推荐会跟着你的厨房变化。</p>
                </div>
              )}
            </section>
          </>
        )}
        {path === "/recipes" && (
          <AllRecipesPage recipes={allRecipes} onOpen={openRecipe} />
        )}
        {path === "/pantry" && (
          <PantryPageView
            pantry={pantry}
            setPantry={setPantry}
            picker={pantryPicker}
            onDemo={() => {
              setPantry(demoPantry());
              setMessage("已装入示范厨房");
            }}
            onExport={exportData}
            onBackupFile={previewBackup}
            backupPreview={backupPreview}
            onRestore={restoreBackup}
            onCancelRestore={() => setBackupPreview(null)}
          />
        )}
        {path === "/discover" && (
          <DiscoverPageView
            pantryCount={pantry.length}
            query={query}
            setQuery={setQuery}
            loading={loading}
            onSearch={searchOnline}
            mode={mode}
            setMode={setMode}
            onlyFavorites={onlyFavorites}
            setOnlyFavorites={setOnlyFavorites}
            filtersOpen={filters}
            setFiltersOpen={setFilters}
            sourceFilter={sourceFilter}
            setSourceFilter={setSourceFilter}
            resetVisible={() => setVisibleRecipes(24)}
            maxTime={maxTime}
            setMaxTime={setMaxTime}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            cuisine={cuisine}
            setCuisine={setCuisine}
            diet={diet}
            setDiet={setDiet}
            equipment={equipment}
            setEquipment={setEquipment}
            warning={warning}
            resultCount={matches.length}
            cards={recipeCards()}
            recentRecipes={recentRecipeIds
              .map((id) => allRecipes.find((recipe) => recipe.id === id))
              .filter((recipe): recipe is Recipe => Boolean(recipe))
              .slice(0, 5)}
            onOpen={openRecipe}
          />
        )}
        {selected && cooking && !canCookRecipe(selected) && (
          <section className="empty">
            <h2>完整步骤在原网站</h2>
            <a
              className="primary"
              href={selected.sourceUrl!}
              target="_blank"
              rel="noopener noreferrer"
            >
              查看原始教程
            </a>
          </section>
        )}
        {selected && !cooking && (
          <RecipeDetailView
            recipe={selected}
            pantry={pantry}
            servings={servings}
            setServings={setServings}
            loading={loading}
            onRefresh={() => refreshImportedRecipe(selected)}
            onAddMissing={() => addMissing(selected)}
            artwork={<FoodImage recipe={selected} big />}
            jsonLd={<RecipeJsonLd recipe={selected} />}
          />
        )}
        {selectedId && !selected && (
          <div className="empty">
            <h2>正在查找菜谱</h2>
            <p>如果未能载入，请返回发现页重新选择。导入菜谱保存在当前设备。</p>
            <Link href="/discover" className="primary">
              返回发现菜谱
            </Link>
          </div>
        )}
        {path === "/shopping" && (
          <ShoppingPageView shopping={shopping} onChange={setShopping} />
        )}
        {path === "/import" && (
          <ImportPageView
            importUrl={importUrl}
            setImportUrl={setImportUrl}
            preview={importPreview}
            clearPreview={() => setImportPreview(null)}
            loading={loading}
            savedCount={saved.length}
            onImport={importRecipe}
            onSave={saveImportPreview}
            onView={() => {
              if (!importPreview) return;
              setRecentRecipeIds((current) =>
                [
                  importPreview.id,
                  ...current.filter((id) => id !== importPreview.id),
                ].slice(0, 20),
              );
              setOnline((prev) => [
                ...prev.filter((r) => r.id !== importPreview.id),
                importPreview,
              ]);
              router.push("/recipe/" + encodeURIComponent(importPreview.id));
            }}
          />
        )}
      </main>
      <footer>
        <Link href="/" className="footer-brand">
          <ChefHat size={19} /> KitchenMate
        </Link>
        <p>用手边的食材，做喜欢的饭。</p>
        <span>为每一个认真吃饭的人而做</span>
      </footer>
      {message && (
        <div className="toast" role="status">
          <Check size={18} />
          {message}
          <button aria-label="关闭提示" onClick={() => setMessage("")}>
            <X size={16} />
          </button>
        </div>
      )}
      <div className="mobile-nav">
        {nav.slice(0, 4).map(([href, label, Icon]) => (
          <Link
            className={path === href ? "active" : ""}
            href={href}
            key={href}
          >
            <Icon size={21} />
            <span>{label}</span>
          </Link>
        ))}
        <details className="mobile-more">
          <summary>
            <Menu size={21} />
            <span>更多</span>
          </summary>
          <div>
            {nav.slice(4).map(([href, label]) => (
              <Link href={href} key={href}>
                {label}
              </Link>
            ))}
          </div>
        </details>
      </div>
    </>
  );
}
function RecipeJsonLd({ recipe: r }: { recipe: Recipe }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: r.title,
    description: r.description,
    ...(r.image ? { image: r.image } : {}),
    recipeIngredient: r.ingredients.map((i) => i.originalText),
    recipeInstructions: r.instructions.map((i) => ({
      "@type": "HowToStep",
      name: i.title,
      text: i.description,
    })),
    ...(r.prepTime !== null ? { prepTime: `PT${r.prepTime}M` } : {}),
    ...(r.cookTime !== null ? { cookTime: `PT${r.cookTime}M` } : {}),
    ...(r.totalTime !== null ? { totalTime: `PT${r.totalTime}M` } : {}),
    ...(!r.servingsEstimated ? { recipeYield: `${r.servings} servings` } : {}),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
