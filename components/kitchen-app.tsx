"use client";
import { useEffect, useLayoutEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  Plus,
  Check,
  Search,
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
  SlidersHorizontal,
  Trash2,
  Sparkles,
  Heart,
  UtensilsCrossed,
} from "lucide-react";
import { z } from "zod";
import { createBackup, loadDeviceState, parseBackup, saveDeviceState, type DeviceState } from "@/lib/storage/device";
import { IngredientPicker } from "@/features/pantry/ingredient-picker";
import {
  ingredientById,
  ingredientName,
  demoPantry,
  togglePantry,
} from "@/lib/ingredients";
import { localRecipes } from "@/lib/seed";
import { matchRecipe, searchRecipe } from "@/lib/matching";
import { scaleQuantity } from "@/lib/units";
import {
  Recipe,
  PantryItem,
  ShoppingItem,
  recipeSchema,
} from "@/lib/model";

const nav = [
  ["/", "今天吃什么", ChefHat],
  ["/pantry", "我的厨房", Refrigerator],
  ["/discover", "发现菜谱", Compass],
  ["/shopping", "购物清单", ShoppingBasket],
  ["/import", "导入菜谱", Link2],
] as const;
const ImportPageView = dynamic(() => import("@/features/import/import-page").then((module) => module.ImportPageView));
const CookingMode = dynamic(() => import("@/features/cooking/cooking-mode").then((module) => module.CookingMode));
const ShoppingPageView = dynamic(() => import("@/features/shopping/shopping-page").then((module) => module.ShoppingPageView));
const RecipeDetailView = dynamic(() => import("@/features/recipes/recipe-detail-view").then((module) => module.RecipeDetailView));
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
      className={`food-art ${big ? "big" : ""} art-${localRecipes.findIndex((r) => r.id === recipe.id) % 4}`}
    >
      <div className="plate">
        <span>{foodArt[recipe.id] ?? "🥣"}</span>
        <i>✦</i>
      </div>
      <span className="illustration-label">食材插画 · 非菜品实拍</span>
    </div>
  );
}
export function KitchenApp({ aiEnabled = false }: { aiEnabled?: boolean }) {
  const path = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [pantry, setPantry] = useState<PantryItem[]>([]);
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [saved, setSaved] = useState<Recipe[]>([]);
  const [online, setOnline] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [dark, setDark] = useState(false);
  const [message, setMessage] = useState("");
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("最匹配");
  const [filters, setFilters] = useState(false);
  const [maxTime, setMaxTime] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [diet, setDiet] = useState("");
  const [allergen, setAllergen] = useState("");
  const [equipment, setEquipment] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("全部");
  const [visibleRecipes, setVisibleRecipes] = useState(24);
  const [servingChoice, setServingChoice] = useState<{
    id: string;
    value: number;
  } | null>(null);
  const [importUrl, setImportUrl] = useState("");
  const [importPreview, setImportPreview] = useState<Recipe | null>(null);
  const [backupPreview, setBackupPreview] = useState<DeviceState | null>(null);
  const [constraints, setConstraints] =
    useState("30 分钟以内，两人份，不要太辣");
  useEffect(() => {
    let active = true;
    loadDeviceState().then((data) => {
      if (!active) return;
      if (data) {
        setPantry(data.pantry); setShopping(data.shopping); setSaved(data.saved);
        setFavorites(data.favorites); setDark(data.dark);
      } else setPantry(demoPantry());
      setReady(true);
    }).catch(() => {
      if (!active) return;
      setMessage("本地数据无法读取，已保留空厨房。"); setReady(true);
    });
    return () => { active = false; };
  }, []);
  useLayoutEffect(() => {
    if (ready) {
      saveDeviceState({ pantry, shopping, saved, favorites, dark }).catch(() => {});
      document.documentElement.dataset.theme = dark ? "dark" : "light";
    }
  }, [ready, pantry, shopping, saved, favorites, dark]);
  function exportData() {
    const backup = createBackup({ pantry, shopping, saved, favorites, dark });
    const href = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = href; anchor.download = "kitchenmate-backup.json"; anchor.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
  async function previewBackup(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 5_000_000) throw new Error("备份文件过大");
      setBackupPreview(parseBackup(await file.text()).data);
    } catch { setMessage("备份格式无效，请选择 KitchenMate 导出的 JSON 文件。"); }
  }
  function restoreBackup() {
    if (!backupPreview) return;
    setPantry(backupPreview.pantry); setShopping(backupPreview.shopping); setSaved(backupPreview.saved);
    setFavorites(backupPreview.favorites); setDark(backupPreview.dark);
    setBackupPreview(null); setMessage("备份已恢复到这台设备。");
  }
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 4500);
    return () => clearTimeout(t);
  }, [message]);
  const allRecipes = [
    ...new Map(
      [...localRecipes, ...saved, ...online].map((r) => [r.id, r]),
    ).values(),
  ];
  const selectedId = path.startsWith("/recipe/")
    ? decodeURIComponent(path.split("/")[2])
    : null;
  const selected = allRecipes.find((r) => r.id === selectedId);
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
    if (!selectedId || selected) return;
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
  }, [selectedId, selected]);
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
      if (!result.recipes.some((r: Recipe) => r.sourceProvider !== "local"))
        setMessage("本地菜谱已更新；在线来源未配置或没有匹配结果。");
    } catch {
      setWarning("在线菜谱暂时不可用，本地菜谱仍可使用。");
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
            category:
              ingredientById.get(item.ingredientId)?.category ??
              "其他",
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
    setServingChoice({ id: recipe.id, value: recipe.servings });
    if (recipe.sourceProvider !== "local")
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
    setSaved((prev) => [...prev.filter((r) => r.id !== importPreview.id), importPreview]);
    setMessage("菜谱已保存到这台设备，刷新页面仍可查看。");
    setImportPreview(null);
  }
  async function refreshImportedRecipe(recipe: Recipe) {
    if (!recipe.sourceUrl || recipe.sourceProvider !== "url-import") return;
    setLoading(true);
    try {
      const response = await fetch("/api/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: recipe.sourceUrl }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const refreshed = recipeSchema.parse(data.recipe);
      const changed = JSON.stringify([recipe.title, recipe.ingredients, recipe.instructions]) !== JSON.stringify([refreshed.title, refreshed.ingredients, refreshed.instructions]);
      setSaved((prev) => [...prev.filter((item) => item.id !== recipe.id), refreshed]);
      setOnline((prev) => [...prev.filter((item) => item.id !== recipe.id), refreshed]);
      setMessage(changed ? "原菜谱有更新，已保存新的本地快照。" : "已检查原网页，菜谱内容没有变化。");
    } catch (error) { setMessage(error instanceof Error ? error.message : "暂时无法检查原网页"); }
    finally { setLoading(false); }
  }
  async function generateAI() {
    setLoading(true);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: pantry.map((i) => i.displayName),
          constraints,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const recipes = z.array(recipeSchema).parse(data.recipes);
      setSaved((prev) => [...prev, ...recipes]);
      setQuery("");
      setMode("最匹配");
      setMessage("已生成 3 道候选菜谱，请检查食材与烹饪安全。");
      router.push("/discover");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "AI 暂时不可用");
    } finally {
      setLoading(false);
    }
  }
  const matches = allRecipes
    .filter(
      (r) =>
        searchRecipe(r, query) &&
        (!maxTime ||
          (r.totalTime !== null && r.totalTime <= Number(maxTime))) &&
        (!difficulty || r.difficulty === difficulty) &&
        (!cuisine || r.cuisine === cuisine) &&
        (!diet || r.tags.includes(diet)) &&
        (!allergen ||
          (r.sourceProvider === "local" && !r.allergens.includes(allergen))) &&
        (!equipment || r.equipment.includes(equipment)) &&
        (!onlyFavorites || favorites.includes(r.id)) &&
        (sourceFilter === "全部" ||
          (sourceFilter === "KitchenMate" && r.sourceProvider === "local") ||
          (sourceFilter === "在线菜谱" && r.sourceProvider === "themealdb") ||
          (sourceFilter === "我的菜谱" && saved.some((item) => item.id === r.id))),
    )
    .map((recipe) => ({ recipe, match: matchRecipe(recipe, pantry) }))
    .filter(({ match, recipe }) =>
      mode === "我现在就能做"
        ? match.missingCore === 0
        : mode === "只差一点"
          ? match.missingCore >= 1 && match.missingCore <= 2
          : mode === "快手菜"
            ? recipe.totalTime !== null && recipe.totalTime <= 30
          : true,
    )
    .sort((a, b) =>
      mode === "消耗库存"
        ? b.match.inventoryScore - a.match.inventoryScore ||
          b.match.score - a.match.score
        : b.match.score - a.match.score,
    );
  const pantryPicker = <IngredientPicker pantry={pantry} onToggle={(id) => setPantry((previous) => togglePantry(previous, id))} />;  const recipeCards = (limit?: number) => (
    <div className="recipe-grid">
      {matches.slice(0, limit ?? visibleRecipes).map(({ recipe: r, match: m }) => (
        <article className="recipe-card" key={r.id}>
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
              {r.cuisine} <span>·</span> {r.sourceName}
            </small>
            <button className="recipe-title" onClick={() => openRecipe(r)}>
              {r.title}
            </button>
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
      {!limit && matches.length > visibleRecipes && <button className="secondary load-more" onClick={() => setVisibleRecipes((count) => count + 24)}>加载更多菜谱</button>}
    </div>
  );
  if (cooking && selected)
    return (
      <CookingMode
        recipe={selected}
        onExit={() => router.push(`/recipe/${encodeURIComponent(selected.id)}`)}
      />
    );
  if (!ready) return <main aria-live="polite" className="loading-state">正在读取本机厨房数据…</main>;
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
                  看看现有的食材，找到刚刚好的一餐。
                  <br />
                  少一点纠结，多一点家的味道。
                </p>
                <a href="#ingredients" className="primary">
                  <Plus size={18} /> 添加我的食材
                </a>
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
                        {
                          ingredientById.get(p.ingredientId)?.emoji
                        }{" "}
                        {p.displayName}
                        <X size={12} />
                      </button>
                    ))
                  ) : (
                    <p>先告诉我你厨房里有什么吧。试试鸡蛋、番茄和土豆。</p>
                  )}
                </div>
                <Link className="text-link" href="/pantry">
                  管理数量与保质期 <ArrowRight size={14} />
                </Link>
                <Link href="/discover" className="primary full">
                  看看我能做什么 <ArrowRight size={18} />
                </Link>
                <span className="tiny">无需填数量，也能找到合适的菜</span>
              </aside>
            </div>
            <section className="recommend-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">MADE FOR YOUR PANTRY</span>
                  <h2>今天，试试这几道</h2>
                  <p>根据你的厨房食材，为你挑选。</p>
                </div>
                <Link href="/discover" className="text-link">
                  查看全部菜谱 <ArrowRight size={16} />
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
        {path === "/pantry" && (
          <>
            <PageHeading
              eyebrow="YOUR LITTLE KITCHEN"
              title="我的厨房"
              description="食材心里有数，每一餐都从容一点。"
            />
            <div className="pantry-actions">
              <button
                onClick={() => {
                  setPantry(demoPantry());
                  setMessage("已装入示范厨房");
                }}
                className="secondary"
              >
                装入示范食材
              </button>
              <button className="secondary" onClick={() => setPantry([])}>
                清空厨房
              </button>
              <Link href="/discover" className="primary">
                看看我能做什么 <ArrowRight size={16} />
              </Link>
            </div>
            <section className="panel backup-panel">
              <h2>我的厨房数据</h2>
              <p>食材、收藏、购物清单和保存的菜谱只在这台设备。换设备时可以导出备份，再在新设备恢复。</p>
              <div className="backup-actions"><button className="secondary" onClick={exportData}>导出我的数据</button><label className="secondary backup-file">恢复备份<input aria-label="选择 KitchenMate 备份" type="file" accept="application/json,.json" onChange={(event) => previewBackup(event.target.files?.[0])} /></label></div>
              {backupPreview && <div role="status" className="backup-preview"><strong>将恢复：</strong> {backupPreview.pantry.length} 个食材 · {backupPreview.favorites.length} 个收藏 · {backupPreview.shopping.length} 个购物项 · {backupPreview.saved.length} 道我的菜谱<div><button className="primary" onClick={restoreBackup}>确认恢复</button><button className="secondary" onClick={() => setBackupPreview(null)}>取消</button></div></div>}
            </section>
            <section className="panel">{pantryPicker}</section>
            <section className="stock-list">
              <h2>
                已拥有的食材 <span className="count">{pantry.length}</span>
              </h2>
              {!pantry.length && (
                <div className="empty">厨房还是空的，点选上方食材开始吧。</div>
              )}
              {pantry.map((p) => (
                <div className="stock-row" key={p.ingredientId}>
                  <strong>
                    {ingredientById.get(p.ingredientId)?.emoji}{" "}
                    {p.displayName}
                  </strong>
                  <label>
                    数量
                    <input
                      aria-label={`${p.displayName}数量`}
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="不限"
                      value={p.quantity ?? ""}
                      onChange={(e) =>
                        setPantry((prev) =>
                          prev.map((i) =>
                            i.ingredientId === p.ingredientId
                              ? {
                                  ...i,
                                  quantity:
                                    e.target.value === ""
                                      ? null
                                      : Math.max(0, Number(e.target.value)),
                                  updatedAt: new Date().toISOString(),
                                }
                              : i,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    单位
                    <input
                      aria-label={`${p.displayName}单位`}
                      placeholder="个 / g / ml"
                      value={p.unit}
                      onChange={(e) =>
                        setPantry((prev) =>
                          prev.map((i) =>
                            i.ingredientId === p.ingredientId
                              ? {
                                  ...i,
                                  unit: e.target.value,
                                  updatedAt: new Date().toISOString(),
                                }
                              : i,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    保质期
                    <input
                      type="date"
                      value={p.expiryDate ?? ""}
                      onChange={(e) =>
                        setPantry((prev) =>
                          prev.map((i) =>
                            i.ingredientId === p.ingredientId
                              ? {
                                  ...i,
                                  expiryDate: e.target.value || null,
                                  updatedAt: new Date().toISOString(),
                                }
                              : i,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    存放位置
                    <select
                      value={p.storageLocation}
                      onChange={(e) =>
                        setPantry((prev) =>
                          prev.map((i) =>
                            i.ingredientId === p.ingredientId
                              ? {
                                  ...i,
                                  storageLocation: e.target
                                    .value as PantryItem["storageLocation"],
                                  updatedAt: new Date().toISOString(),
                                }
                              : i,
                          ),
                        )
                      }
                    >
                      {["冰箱", "冷冻室", "橱柜", "调料柜"].map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="icon-button"
                    aria-label={`删除${p.displayName}`}
                    onClick={() =>
                      setPantry((prev) =>
                        prev.filter((i) => i.ingredientId !== p.ingredientId),
                      )
                    }
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </section>
          </>
        )}
        {path === "/discover" && (
          <>
            <PageHeading
              eyebrow="COOK SOMETHING GOOD"
              title="厨房里的无限可能"
              description={`你有 ${pantry.length} 种食材，看看今天能做点什么。`}
            />
            <div className="discover-search">
              <div className="searchbox">
                <Search size={20} />
                <input
                  aria-label="搜索菜谱"
                  placeholder="搜索菜名、食材或标签，例如：番茄炒蛋 / 快手菜"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <button
                className="secondary"
                onClick={searchOnline}
                disabled={loading}
              >
                {loading ? "正在查找…" : "查找在线菜谱"}
              </button>
            </div>
            <div className="recommend-tabs">
              {["最匹配", "我现在就能做", "只差一点", "消耗库存", "快手菜"].map((m) => (
                <button
                  key={m}
                  className={mode === m ? "active" : ""}
                  onClick={() => setMode(m)}
                >
                  {m}
                </button>
              ))}
              <button
                className={onlyFavorites ? "active" : ""}
                onClick={() => setOnlyFavorites(!onlyFavorites)}
              >
                <Heart size={16} /> 收藏
              </button>
              <button onClick={() => setFilters(!filters)}>
                <SlidersHorizontal size={16} /> 筛选
              </button>
            </div>
            <div className="source-tabs" aria-label="菜谱来源">{["全部", "KitchenMate", "在线菜谱", "我的菜谱"].map((source) => <button key={source} className={sourceFilter === source ? "active" : ""} onClick={() => { setSourceFilter(source); setVisibleRecipes(24); }}>{source}</button>)}</div>
            {filters && (
              <div className="filter-panel">
                {[
                  ["时间", maxTime, setMaxTime, ["15", "30", "60"]],
                  ["难度", difficulty, setDifficulty, ["简单", "普通", "进阶"]],
                  [
                    "菜系",
                    cuisine,
                    setCuisine,
                    [
                      "中餐",
                      "川菜",
                      "粤菜",
                      "江浙菜",
                      "东北菜",
                      "日料",
                      "韩餐",
                      "西餐",
                      "意大利菜",
                      "墨西哥菜",
                      "东南亚",
                    ],
                  ],
                  [
                    "偏好",
                    diet,
                    setDiet,
                    ["素食", "Vegan", "高蛋白", "低碳", "低脂"],
                  ],
                  [
                    "排除过敏原",
                    allergen,
                    setAllergen,
                    ["花生", "坚果", "牛奶", "鸡蛋", "海鲜", "麸质"],
                  ],
                  [
                    "厨具",
                    equipment,
                    setEquipment,
                    ["炒锅", "烤箱", "空气炸锅", "电饭煲", "高压锅", "微波炉"],
                  ],
                ].map(([label, value, set, options]) => (
                  <label key={label as string}>
                    {label as string}
                    <select
                      value={value as string}
                      onChange={(e) =>
                        (set as (v: string) => void)(e.target.value)
                      }
                    >
                      <option value="">不限</option>
                      {(options as string[]).map((o) => (
                        <option key={o} value={o}>
                          {label === "时间" ? `${o} 分钟以内` : o}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
                <button
                  className="text-link"
                  onClick={() => {
                    setMaxTime("");
                    setDifficulty("");
                    setCuisine("");
                    setDiet("");
                    setAllergen("");
                    setEquipment("");
                  }}
                >
                  重置筛选
                </button>
                {allergen && (
                  <small>
                    过敏原筛选仅显示已标注的本地菜谱；请同时核对包装及交叉污染风险。
                  </small>
                )}
              </div>
            )}
            {warning && (
              <p className="notice" role="status">
                {warning}
              </p>
            )}
            <div className="result-count">
              找到 {matches.length} 道灵感{" "}
              <span>基础调料对匹配度影响较小 · 已填写库存数量时会提示不足</span>
            </div>
            {matches.length ? (
              recipeCards()
            ) : (
              <div className="empty">
                <UtensilsCrossed size={36} />
                <h2>换个条件，找点新灵感</h2>
                <p>试着添加更多食材，或放宽筛选条件。</p>
              </div>
            )}
            {aiEnabled && <section className="ai-panel">
              <Sparkles />
              <div>
                <h3>还有一点想法？让 AI 帮你想一道菜。</h3>
                <p>根据现有食材和你的偏好，生成 3 个候选方案。</p>
                <input
                  aria-label="AI 烹饪要求"
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  maxLength={500}
                />
              </div>
              <button
                className="primary"
                disabled={loading}
                onClick={generateAI}
              >
                {loading ? "正在准备…" : "AI 帮我想一道菜"}
              </button>
            </section>}
          </>
        )}
        {selected && !cooking && <RecipeDetailView
          recipe={selected}
          pantry={pantry}
          servings={servings}
          setServings={setServings}
          loading={loading}
          onRefresh={() => refreshImportedRecipe(selected)}
          onAddMissing={() => addMissing(selected)}
          artwork={<FoodImage recipe={selected} big />}
          jsonLd={<RecipeJsonLd recipe={selected} />}
        />}        {selectedId && !selected && (
          <div className="empty">
            <h2>正在查找菜谱</h2>
            <p>
              如果未能载入，请返回发现页重新选择。导入和 AI 菜谱保存在当前设备。
            </p>
            <Link href="/discover" className="primary">
              返回发现菜谱
            </Link>
          </div>
        )}
        {path === "/shopping" && <ShoppingPageView shopping={shopping} onChange={setShopping} />}
        {path === "/import" && <ImportPageView
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
            setOnline((prev) => [...prev.filter((r) => r.id !== importPreview.id), importPreview]);
            router.push("/recipe/" + encodeURIComponent(importPreview.id));
          }}
        />}
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
      </div>
    </>
  );
}
function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="page-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
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
