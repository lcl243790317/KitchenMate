import { RecipeInstructions } from "./recipe-instructions";
import { RecipeSource, SourceNotes } from "./recipe-source";
import Link from "next/link";
import { Clock, Flame, UtensilsCrossed, ExternalLink } from "lucide-react";
import type { Recipe } from "@/lib/model";
import { recipeEquipment } from "@/lib/recipe-equipment";
import { RecipeActions } from "./recipe-actions";
import { RecipeBackLink } from "./recipe-back-link";

export function ServerRecipeDetail({ recipe }: { recipe: Recipe }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.description,
    recipeIngredient: recipe.ingredients.map((item) => item.originalText),
    recipeInstructions: recipe.instructions.map((step) => ({
      "@type": "HowToStep",
      text: step.description,
    })),
    ...(!recipe.servingsEstimated
      ? { recipeYield: `${recipe.servings} 人份` }
      : {}),
    ...(recipe.totalTime ? { totalTime: `PT${recipe.totalTime}M` } : {}),
    author: {
      "@type": "Organization",
      name: recipe.sourceAuthor ?? recipe.sourceName,
    },
  };
  return (
    <>
      <header className="site-header">
        <Link href="/" className="brand">
          🍳 今天吃什么<small>KITCHENMATE</small>
        </Link>
        <nav aria-label="主导航">
          <Link href="/">首页</Link>
          <Link href="/pantry">我的厨房</Link>
          <Link href="/discover">发现菜谱</Link>
          <Link href="/recipes">全部教程</Link>
          <Link href="/shopping">购物清单</Link>
          <Link href="/import">导入菜谱</Link>
        </nav>
      </header>
      <main>
        <RecipeBackLink recipeId={recipe.id} />
        <Link href="/recipes" className="text-link">
          浏览全部教程
        </Link>
        <section className="detail-hero">
          <div className="food-art big">
            <div className="plate">
              <span>🥣</span>
              <i>✦</i>
            </div>
            <span className="illustration-label">食材插画 · 非菜品实拍</span>
          </div>
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
                {recipe.servingsEstimated
                  ? "份量见原文"
                  : `${recipe.servings} 人份`}
              </span>
            </div>
            <p className="source">
              来源：{recipe.sourceName}
              {recipe.sourceAuthor && ` · ${recipe.sourceAuthor}`}
            </p>
            {recipeEquipment(recipe).length > 0 && (
              <p className="subtle">
                来源提到的工具：{recipeEquipment(recipe).join("、")}
              </p>
            )}
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
          </div>
        </section>
        <RecipeSource recipe={recipe} />
        <SourceNotes recipe={recipe} />
        <div className="detail-layout">
          <RecipeActions recipe={recipe} />
          <RecipeInstructions recipe={recipe} />
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </main>
      <footer>
        <Link href="/" className="footer-brand">
          KitchenMate
        </Link>
        <p>用手边的食材，做喜欢的饭。</p>
      </footer>
    </>
  );
}
