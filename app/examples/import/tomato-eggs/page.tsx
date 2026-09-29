import type { Metadata } from "next";
import Link from "next/link";
import { localRecipeById } from "@/lib/seed";
import { exampleJsonLd } from "@/lib/example-recipe";

const recipe = localRecipeById.get("tomato-eggs")!;
export const metadata: Metadata = {
  title: "番茄炒蛋 · KitchenMate 导入示例",
  description: "供 KitchenMate 菜谱导入功能使用的公开示例网页。",
};
export default function ExampleRecipePage() {
  return (
    <article className="example-recipe">
      <Link href="/import">← 返回导入菜谱</Link>
      <p className="eyebrow">KITCHENMATE IMPORT EXAMPLE</p>
      <h1>{recipe.title}</h1>
      <p>{recipe.description}</p>
      <p>这是本站的公开菜谱示例，包含 Schema.org Recipe 数据。</p>
      <h2>食材</h2>
      <ul>{recipe.ingredients.map((item) => <li key={item.ingredientId}>{item.originalText}</li>)}</ul>
      <h2>做法</h2>
      <ol>{recipe.instructions.map((step) => <li key={step.stepNumber}>{step.description}</li>)}</ol>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(exampleJsonLd).replace(/</g, "\\u003c") }} />
    </article>
  );
}
