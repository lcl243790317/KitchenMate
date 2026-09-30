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
        {recipe.provenance.type === "OPEN_LICENSE"
          ? "开放授权"
          : recipe.provenance.type === "LICENSED_API"
            ? "API 来源"
            : recipe.provenance.type === "SOURCE_LINKED"
              ? "原站教程"
              : recipe.provenance.type === "USER_IMPORTED"
                ? "本机导入"
                : "真实来源"}
      </p>
      {recipe.provenance.licenseName && (
        <p>
          许可：
          <a
            href={recipe.provenance.licenseUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {recipe.provenance.licenseName}
          </a>
        </p>
      )}
      {recipe.provenance.sourceRevision && (
        <p>
          来源修订：
          <a
            href={`https://en.wikibooks.org/w/index.php?oldid=${encodeURIComponent(recipe.provenance.sourceRevision)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {recipe.provenance.sourceRevision}
          </a>
        </p>
      )}
      {recipe.provenance.attributionText && (
        <p>{recipe.provenance.attributionText}</p>
      )}
      {recipe.titleTranslation && (
        <p>
          中文菜名翻译：KitchenMate，基于 Wikibooks
          原文。教程步骤保留英文原文；译名及内容依 CC BY-SA 4.0 提供。
        </p>
      )}
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
