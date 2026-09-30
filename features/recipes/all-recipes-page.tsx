"use client";
import { useState } from "react";
import type { Recipe } from "@/lib/model";
import { ingredientName } from "@/lib/ingredients";
import { browseCategory, browseRecipes } from "@/lib/recipe-browse";
import { canDisplayRecipe } from "@/lib/recipe-trust";

export function AllRecipesPage({
  recipes,
  onOpen,
}: {
  recipes: Recipe[];
  onOpen: (recipe: Recipe) => void;
}) {
  const [query, setQuery] = useState(() =>
    typeof window === "undefined"
      ? ""
      : (new URLSearchParams(window.location.search).get("q") ?? ""),
  );
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [limit, setLimit] = useState(24);
  const catalog = recipes.filter(canDisplayRecipe);
  const results = browseRecipes(catalog, query, category, source);
  const categories = [...new Set(catalog.map(browseCategory))].sort((a, b) =>
    a.localeCompare(b, "zh-CN"),
  );
  const sources = [...new Set(catalog.map((r) => r.sourceName))].sort();
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
            setQuery(e.target.value);
            setLimit(24);
            const url = new URL(window.location.href);
            if (e.target.value) url.searchParams.set("q", e.target.value);
            else url.searchParams.delete("q");
            window.history.replaceState(null, "", url);
          }}
        />
      </div>
      <div className="filter-panel">
        <label>
          类别
          <select
            aria-label="教程类别"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setLimit(24);
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
              setSource(e.target.value);
              setLimit(24);
            }}
          >
            <option value="">全部来源</option>
            {sources.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <span className="subtle">按菜名排序 · 分类沿用原始来源</span>
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
                {recipe.sourceName} ·{" "}
                {recipe.instructionAvailability === "source-only"
                  ? "原站教程"
                  : "完整教程"}
              </small>
              <button className="recipe-title" onClick={() => onOpen(recipe)}>
                {recipe.title}
              </button>
              <div className="recipe-meta">
                {recipe.totalTime !== null && (
                  <span>{recipe.totalTime} 分钟</span>
                )}
                {recipe.difficulty !== "未知" && (
                  <span>{recipe.difficulty}</span>
                )}
              </div>
              <p className="browse-ingredients">
                {recipe.ingredients
                  .filter((i) => !i.optional)
                  .slice(0, 6)
                  .map((i) => ingredientName(i.ingredientId))
                  .join("、")}
              </p>
              <button className="text-link" onClick={() => onOpen(recipe)}>
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
          onClick={() => setLimit((n) => n + 24)}
        >
          加载更多
        </button>
      )}
    </>
  );
}
