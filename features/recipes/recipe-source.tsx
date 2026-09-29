import type { Recipe } from "@/lib/model";
export function RecipeSource({ recipe }: { recipe: Recipe }) {
  return (
    <section className="source-panel" aria-label="菜谱来源">
      <strong>
        {recipe.provenance.type === "USER_IMPORTED"
          ? "我的导入快照"
          : "来源已验证"}{" "}
        · {recipe.provenance.sourceName}
      </strong>
      <p>原始标题：{recipe.provenance.sourceRecipeTitle}</p>
      <p>
        验证日期：{recipe.provenance.verifiedAt?.slice(0, 10)} ·{" "}
        {recipe.provenance.type}
      </p>
      {recipe.sourceUrl && (
        <a
          className="text-link source-url"
          href={recipe.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {recipe.sourceUrl}
        </a>
      )}
      {recipe.verificationStatus === "temporarily-unavailable" && (
        <p>原站暂时无法访问，当前为已保存的授权快照。</p>
      )}
      {recipe.instructionAvailability === "source-only" && (
        <p>
          完整步骤在原网站。
          <a
            className="primary"
            href={recipe.sourceUrl!}
            target="_blank"
            rel="noopener noreferrer"
          >
            查看原始教程
          </a>
        </p>
      )}
      {recipe.servingsEstimated && (
        <p>来源份量未结构化标注；请按原文用量与公式制作。</p>
      )}
    </section>
  );
}
export function SourceNotes({ recipe }: { recipe: Recipe }) {
  if (!recipe.sourceNotes) return null;
  const calculation = recipe.sourceNotes
    .match(/^## 计算\n([\s\S]*?)(?=^## |$(?![\s\S]))/m)?.[1]
    ?.trim();
  return (
    <section className="panel source-notes">
      <h2>原文用量与说明</h2>
      {calculation && <p>{calculation}</p>}
      <details>
        <summary>查看全部原料、工具和补充说明</summary>
        <p>{recipe.sourceNotes}</p>
      </details>
    </section>
  );
}
