"use client";
import { useEffect, useLayoutEffect, useState } from "react";
import type { Recipe } from "@/lib/model";
import { ingredientName } from "@/lib/ingredients";
import {
  browseCategory,
  browseRecipes,
  browseSource,
} from "@/lib/recipe-browse";
import { beginnerSignals } from "@/lib/beginner-recipes";
import { recipeEquipment } from "@/lib/recipe-equipment";
import { canDisplayRecipe } from "@/lib/recipe-trust";
import {
  takeBrowseState,
  saveBrowseState,
  restoreBrowsePosition,
  replaceBrowseQuery,
  type BrowsePosition,
} from "@/lib/recipe-navigation";
type BrowseState = {
  query: string;
  category: string;
  source: string;
  limit: number;
  beginner: boolean;
  quick: boolean;
};

export function AllRecipesPage({
  recipes,
  onOpen,
}: {
  recipes: Recipe[];
  onOpen: (recipe: Recipe) => void;
}) {
  const [{ query, category, source, limit, beginner, quick }, setBrowse] =
    useState<BrowseState>({
      query: "",
      category: "",
      source: "",
      limit: 24,
      beginner: false,
      quick: false,
    });
  const [position, setPosition] = useState<BrowsePosition | null>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const restored = takeBrowseState<BrowseState>("/recipes");
      const params = new URLSearchParams(window.location.search);
      setBrowse(
        restored ?? {
          query: params.get("q") ?? "",
          category: params.get("category") ?? "",
          source: params.get("source") ?? "",
          limit: 24,
          beginner: params.get("beginner") === "true",
          quick: params.get("quick") === "true",
        },
      );
      if (restored) setPosition(restored);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useLayoutEffect(
    () =>
      position
        ? restoreBrowsePosition(position, () => setPosition(null))
        : undefined,
    [position],
  );
  function changeFilters(update: Partial<BrowseState>) {
    const next = {
      query,
      category,
      source,
      beginner,
      quick,
      limit: 24,
      ...update,
    };
    setBrowse(next);
    replaceBrowseQuery({
      q: next.query,
      category: next.category,
      source: next.source,
      beginner: next.beginner ? "true" : "",
      quick: next.quick ? "true" : "",
    });
  }
  function open(recipe: Recipe) {
    saveBrowseState(
      "/recipes",
      { query, category, source, limit, beginner, quick },
      recipe.id,
    );
    onOpen(recipe);
  }
  const catalog = recipes.filter(canDisplayRecipe);
  const results = browseRecipes(
    catalog,
    query,
    category,
    source,
    beginner,
    quick,
  );
  const categories = [...new Set(catalog.map(browseCategory))].sort((a, b) =>
    a.localeCompare(b, "zh-CN"),
  );
  const sources = [...new Set(catalog.map(browseSource))].sort();
  return (
    <>
      <section className="page-heading">
        <span className="eyebrow">REAL RECIPES</span>
        <h1>全部教程</h1>
        <p>浏览 KitchenMate 当前收录的真实来源菜谱。</p>
        <p>共 {catalog.length} 道教程</p>
      </section>
      <div className="searchbox">
        <input
          aria-label="搜索全部教程"
          placeholder="搜索菜名、食材、标签或菜系"
          value={query}
          onChange={(e) => {
            changeFilters({ query: e.target.value });
          }}
        />
      </div>
      <div className="filter-panel">
        <label title="优先来源明确标注 Easy / Very Easy；其他教程根据步骤、用时和食材数量归类。">
          <input
            type="checkbox"
            checked={beginner}
            onChange={(e) => changeFilters({ beginner: e.target.checked })}
          />{" "}
          简单易做
        </label>
        <label>
          <input
            type="checkbox"
            checked={quick}
            onChange={(e) => changeFilters({ quick: e.target.checked })}
          />{" "}
          30分钟内
        </label>
        <label>
          类别
          <select
            aria-label="教程类别"
            value={category}
            onChange={(e) => {
              changeFilters({ category: e.target.value });
            }}
          >
            <option value="">全部</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          来源
          <select
            aria-label="教程来源"
            value={source}
            onChange={(e) => {
              changeFilters({ source: e.target.value });
            }}
          >
            <option value="">全部来源</option>
            {sources.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <span className="subtle">
          {beginner ? "按简单程度、用时和食材数量排序" : "按菜名排序"} ·
          分类沿用原始来源
        </span>
      </div>
      <p className="result-count">找到 {results.length} 道教程</p>
      <div className="recipe-grid">
        {results.slice(0, limit).map((recipe) => (
          <article
            className="recipe-card browse-card"
            key={recipe.id}
            data-recipe-id={recipe.id}
          >
            <div className="recipe-body">
              <small>
                {browseSource(recipe)} ·{" "}
                {recipe.instructionAvailability === "source-only"
                  ? "原站教程"
                  : recipe.provenance.type === "OPEN_LICENSE"
                    ? "开放授权 · 完整教程"
                    : "API 来源 · 完整教程"}
              </small>
              <button className="recipe-title" onClick={() => open(recipe)}>
                {recipe.title}
              </button>
              <div className="recipe-meta">
                {recipe.totalTime !== null && (
                  <span>{recipe.totalTime} 分钟</span>
                )}
                {recipe.difficulty !== "未知" && (
                  <span>{recipe.difficulty}</span>
                )}
                {beginnerSignals(recipe).beginnerFriendly && (
                  <span title={beginnerSignals(recipe).classificationBasis}>
                    简单易做
                  </span>
                )}
              </div>
              <p className="browse-ingredients">
                {recipe.ingredients
                  .filter((i) => !i.optional)
                  .slice(0, 6)
                  .map((i) => ingredientName(i.ingredientId))
                  .join("、")}
              </p>
              {beginner && (
                <p className="tiny">
                  {beginnerSignals(recipe).nonStapleIngredientCount} 种主要食材
                  · {beginnerSignals(recipe).instructionCount} 步
                </p>
              )}
              {recipeEquipment(recipe).length > 0 && (
                <p className="tiny">
                  来源提到：{recipeEquipment(recipe).join("、")}
                </p>
              )}
              <button className="text-link" onClick={() => open(recipe)}>
                {recipe.instructionAvailability === "source-only"
                  ? "查看来源与食材"
                  : "查看教程"}{" "}
                →
              </button>
            </div>
          </article>
        ))}
      </div>
      {!results.length && (
        <div className="empty">没有找到教程，试试其他关键词或类别。</div>
      )}
      {results.length > limit && (
        <button
          className="secondary load-more"
          onClick={() =>
            setBrowse((state) => ({ ...state, limit: state.limit + 24 }))
          }
        >
          加载更多
        </button>
      )}
    </>
  );
}
