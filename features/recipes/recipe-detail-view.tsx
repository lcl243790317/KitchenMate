"use client";
import type { ReactNode } from "react";
import { RecipeSource, SourceNotes } from "./recipe-source";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChefHat,
  Clock,
  ExternalLink,
  Flame,
  Minus,
  Plus,
  ShoppingBasket,
  UtensilsCrossed,
} from "lucide-react";
import { ingredientName } from "@/lib/ingredients";
import { selectedIngredientIds } from "@/lib/matching";
import type { PantryItem, Recipe } from "@/lib/model";
import { canCookRecipe } from "@/lib/recipe-trust";
import { scaleQuantity } from "@/lib/units";
import { RecipeBackLink } from "./recipe-back-link";

type Props = {
  recipe: Recipe;
  pantry: PantryItem[];
  servings: number;
  setServings: (value: number | ((previous: number) => number)) => void;
  loading: boolean;
  onRefresh: () => void;
  onAddMissing: () => void;
  artwork: ReactNode;
  jsonLd: ReactNode;
};

export function RecipeDetailView({
  recipe,
  pantry,
  servings,
  setServings,
  loading,
  onRefresh,
  onAddMissing,
  artwork,
  jsonLd,
}: Props) {
  return (
    <>
      <RecipeBackLink recipeId={recipe.id} />
      <section className="detail-hero">
        {artwork}
        <div>
          <span className="eyebrow">
            {recipe.cuisine} · {recipe.sourceName}
          </span>
          <h1>{recipe.title}</h1>
          <p>{recipe.description}</p>
          <div className="detail-facts">
            <span>
              <Clock /> {recipe.totalTime ?? "未知"} 分钟
            </span>
            <span>
              <Flame /> {recipe.difficulty}
            </span>
            <span>
              <UtensilsCrossed />{" "}
              {recipe.servingsEstimated ? "份量见原文" : `${servings} 人份`}
            </span>
          </div>
          <p className="subtle">
            准备 {recipe.prepTime ?? "未知"} 分钟 · 烹饪{" "}
            {recipe.cookTime ?? "未知"} 分钟
          </p>
          <p className="source">
            来源：{recipe.sourceName}
            {recipe.sourceAuthor && ` · ${recipe.sourceAuthor}`}
          </p>
          {recipe.sourceUrl && (
            <a
              className="text-link"
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              查看原始菜谱 <ExternalLink size={14} />
            </a>
          )}
          {recipe.sourceProvider === "url-import" && (
            <button
              className="secondary"
              disabled={loading}
              onClick={onRefresh}
            >
              {loading ? "正在检查…" : "检查原菜谱更新"}
            </button>
          )}
          {canCookRecipe(recipe) && (
            <Link
              href={`/recipe/${encodeURIComponent(recipe.id)}/cook`}
              className="primary"
            >
              <ChefHat size={19} /> 开始做菜 <ArrowRight size={17} />
            </Link>
          )}
        </div>
      </section>

      {recipe.sourceProvider !== "local" && (
        <p className="notice">
          食材用量、份量与来源说明以原文为准；未标注的字段不会由 KitchenMate
          补写。
        </p>
      )}
      <RecipeSource recipe={recipe} />
      <SourceNotes recipe={recipe} />
      <div className="detail-layout">
        <aside className="panel ingredient-list">
          <div className="section-heading">
            <h2>食材</h2>
            {!recipe.servingsEstimated && (
              <div className="servings">
                <button
                  aria-label="减少人数"
                  disabled={servings <= 1}
                  onClick={() => setServings((value) => Math.max(1, value - 1))}
                >
                  <Minus size={14} />
                </button>
                <select
                  aria-label="份量"
                  value={servings}
                  onChange={(event) => setServings(Number(event.target.value))}
                >
                  {[...new Set([1, 2, 3, 4, 6, 8, servings])]
                    .sort((a, b) => a - b)
                    .map((value) => (
                      <option key={value} value={value}>
                        {value} 人份
                      </option>
                    ))}
                </select>
                <button
                  aria-label="增加人数"
                  onClick={() => setServings((value) => value + 1)}
                >
                  <Plus size={14} />
                </button>
              </div>
            )}
          </div>
          {recipe.ingredients.map((item, index) => {
            const has = selectedIngredientIds(pantry).has(item.ingredientId);
            const scaled = scaleQuantity(
              item.quantity,
              recipe.servings,
              servings,
            );
            return (
              <div
                className="detail-ingredient"
                key={`${item.ingredientId}-${index}`}
              >
                <span className={has ? "has" : ""}>
                  {has ? <Check size={16} /> : <span className="circle" />}
                  {ingredientName(item.ingredientId)}
                  {item.optional && <small> 可选</small>}
                </span>
                <span>
                  {item.quantity === null
                    ? item.originalText
                    : `${scaled} ${item.unit}`}
                </span>
              </div>
            );
          })}
          <p className="tiny">✓ 你已经有　○ 还缺食材</p>
          <button className="secondary full" onClick={onAddMissing}>
            <ShoppingBasket size={16} /> 添加缺少食材到购物清单
          </button>
        </aside>
        <section className="instructions">
          <h2>一步一步，做顿好饭</h2>
          {recipe.instructions.map((step) => (
            <article key={step.stepNumber}>
              <span className="step-number">
                {String(step.stepNumber).padStart(2, "0")}
              </span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                {step.durationSeconds !== null && (
                  <span className="step-time">
                    <Clock size={14} /> 约{" "}
                    {Math.round(step.durationSeconds / 60)} 分钟
                  </span>
                )}
              </div>
            </article>
          ))}
        </section>
      </div>
      {jsonLd}
    </>
  );
}
