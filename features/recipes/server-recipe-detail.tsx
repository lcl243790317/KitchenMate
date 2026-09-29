import Link from "next/link";
import { Clock, Flame, UtensilsCrossed, ArrowLeft, ExternalLink } from "lucide-react";
import type { Recipe } from "@/lib/model";
import { RecipeActions } from "./recipe-actions";

export function ServerRecipeDetail({ recipe }: { recipe: Recipe }) {
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Recipe", name: recipe.title,
    description: recipe.description,
    recipeIngredient: recipe.ingredients.map((item) => item.originalText),
    recipeInstructions: recipe.instructions.map((step) => ({ "@type": "HowToStep", text: step.description })),
    recipeYield: `${recipe.servings} 人份`,
    ...(recipe.totalTime ? { totalTime: `PT${recipe.totalTime}M` } : {}),
    author: { "@type": "Organization", name: recipe.sourceAuthor ?? recipe.sourceName },
  };
  return <>
    <header className="site-header"><Link href="/" className="brand">🍳 今天吃什么<small>KITCHENMATE</small></Link><nav aria-label="主导航"><Link href="/">首页</Link><Link href="/pantry">我的厨房</Link><Link href="/discover">发现菜谱</Link><Link href="/shopping">购物清单</Link><Link href="/import">导入菜谱</Link></nav></header>
    <main><Link href="/discover" className="back"><ArrowLeft size={16} /> 返回发现菜谱</Link>
      <section className="detail-hero"><div className="food-art big"><div className="plate"><span>🥣</span><i>✦</i></div><span className="illustration-label">食材插画 · 非菜品实拍</span></div><div><span className="eyebrow">{recipe.cuisine} · {recipe.sourceName}</span><h1>{recipe.title}</h1><p>{recipe.description}</p><div className="detail-facts"><span><Clock /> {recipe.totalTime ?? "未知"} 分钟</span><span><Flame /> {recipe.difficulty}</span><span><UtensilsCrossed /> {recipe.servings} 人份</span></div><p className="source">来源：{recipe.sourceName}{recipe.sourceAuthor && ` · ${recipe.sourceAuthor}`}</p>{recipe.sourceUrl && <a className="text-link" href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer">查看原始菜谱 <ExternalLink size={14} /></a>}</div></section>
      <div className="detail-layout"><RecipeActions recipe={recipe} /><section className="instructions"><h2>一步一步，做顿好饭</h2>{recipe.instructions.map((step) => <article key={step.stepNumber}><span className="step-number">{String(step.stepNumber).padStart(2,"0")}</span><div><h3>{step.title}</h3><p>{step.description}</p>{step.durationSeconds !== null && <span className="step-time"><Clock size={14} /> 约 {Math.round(step.durationSeconds / 60)} 分钟</span>}</div></article>)}</section></div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g,"\\u003c") }} />
    </main><footer><Link href="/" className="footer-brand">KitchenMate</Link><p>用手边的食材，做喜欢的饭。</p></footer>
  </>;
}
