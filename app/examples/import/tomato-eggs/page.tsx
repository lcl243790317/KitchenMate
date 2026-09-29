import type { Metadata } from "next";
import Link from "next/link";
import recipe from "@/tests/fixtures/first-party-recipe.json";
import { exampleJsonLd } from "@/lib/example-recipe";

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
      <p>
        FIRST_PARTY_TEST：这是本站导入测试夹具，不是经过外站验证的正式教程，不进入推荐。
      </p>
      <h2>食材</h2>
      <ul>
        {recipe.ingredients.map((item) => (
          <li key={item.ingredientId}>{item.originalText}</li>
        ))}
      </ul>
      <h2>做法</h2>
      <ol>
        {recipe.instructions.map((step) => (
          <li key={step.stepNumber}>{step.description}</li>
        ))}
      </ol>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(exampleJsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </article>
  );
}
