"use client";
import type { FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink, Link2 } from "lucide-react";
import { verifiedImportExamples } from "@/lib/import-examples";
import type { Recipe } from "@/lib/model";

type Props = {
  importUrl: string;
  setImportUrl: (value: string) => void;
  preview: Recipe | null;
  clearPreview: () => void;
  loading: boolean;
  savedCount: number;
  onImport: (event: FormEvent) => void;
  onSave: () => void;
  onView: () => void;
};

export function ImportPageView({
  importUrl,
  setImportUrl,
  preview,
  clearPreview,
  loading,
  savedCount,
  onImport,
  onSave,
  onView,
}: Props) {
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">SAVE A GOOD RECIPE</span>
        <h1>导入网上的菜谱</h1>
        <p>将支持结构化 Recipe 数据的公开菜谱网页保存到 KitchenMate。</p>
      </div>
      <div className="import-layout">
        <form className="panel import-form" onSubmit={onImport}>
          <div className="import-icon">
            <Link2 size={32} />
          </div>
          <h2>粘贴菜谱网页网址</h2>
          <label htmlFor="recipe-url">菜谱网址</label>
          <input
            id="recipe-url"
            type="url"
            required
            placeholder="https://example.com/recipe/..."
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            maxLength={2000}
          />
          <p>
            请输入完整的公开 HTTPS 菜谱网页地址。分析时只会显示真实读取结果。
          </p>
          <button className="primary" disabled={loading} type="submit">
            {loading ? "正在读取菜谱数据…" : "分析并导入"}{" "}
            <ArrowRight size={17} />
          </button>
        </form>
        <aside className="import-info">
          <h3>怎么导入？</h3>
          <ol>
            <li>打开一个公开的菜谱网页。</li>
            <li>复制浏览器地址栏中的完整网址。</li>
            <li>粘贴到左侧，再点击「分析并导入」。</li>
          </ol>
          <p>
            请使用网页地址，不要粘贴短链接、App 分享口令、截图或搜索结果链接。
          </p>
          <div className="subtle">已在本机保存 {savedCount} 道菜谱</div>
        </aside>
      </div>
      {preview && (
        <section className="panel import-preview" aria-label="导入预览">
          <h2>找到了这个菜谱</h2>
          <h3>{preview.title}</h3>
          {preview.provenance.type === "FIRST_PARTY_TEST" && (
            <p className="notice">
              本站导入测试夹具（FIRST_PARTY_TEST），仅验证导入流程，不进入正式推荐。
            </p>
          )}
          {preview.image && (
            <img
              src={preview.image}
              alt={preview.title}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          )}
          <p>
            来源：{preview.sourceName}
            {preview.sourceAuthor && ` · ${preview.sourceAuthor}`}
          </p>
          <p>
            {preview.servings} 人份 · {preview.ingredients.length} 种食材 ·{" "}
            {preview.instructions.length} 个步骤
          </p>
          <div className="import-preview-actions">
            <button className="primary" onClick={onSave}>
              保存到我的菜谱
            </button>
            <button
              className="secondary"
              onClick={onView}
              disabled={preview.provenance.type === "FIRST_PARTY_TEST"}
            >
              直接查看
            </button>
            <button className="secondary" onClick={clearPreview}>
              取消
            </button>
          </div>
        </section>
      )}
      <section className="import-guide-grid">
        <article className="panel">
          <h2>本站导入测试示例</h2>
          <p>
            本站测试夹具包含 Schema.org Recipe
            数据，仅用于检查导入流程，不代表外站真实来源。
          </p>
          <button
            className="secondary"
            onClick={() =>
              setImportUrl(
                `${window.location.origin}/examples/import/tomato-eggs`,
              )
            }
          >
            试试导入这个示例
          </button>
          <p>
            <Link href="/examples/import/tomato-eggs" className="text-link">
              先查看示例网页 <ExternalLink size={14} />
            </Link>
          </p>
        </article>
        <article className="panel">
          <h2>什么网页通常可以导入？</h2>
          <p>
            公开 HTTPS 菜谱网页，包含 Schema.org Recipe 的 JSON-LD 或
            Microdata。可读取的字段取决于原网站，通常有菜名、食材、步骤，也可能包含图片、时间、份量和作者。
          </p>
        </article>
        <article className="panel">
          <h2>哪些通常不能导入？</h2>
          <p>
            登录页、付费墙、只有视频或图片的页面、普通社交笔记、PDF、聊天截图、App
            内部链接、搜索结果页、首页和没有 Recipe
            数据的文章。网站也可能禁止自动读取。
          </p>
          <p>KitchenMate 不绕过登录、验证码、付费墙或访问限制。</p>
        </article>
      </section>
      <section className="verified-examples">
        <div className="section-heading">
          <div>
            <span className="eyebrow">LIVE VERIFIED</span>
            <h2>真实网站示例</h2>
            <p>
              以下网址曾用 KitchenMate
              导入器实际解析成功。点击只会填入网址，由你决定何时导入。
            </p>
          </div>
        </div>
        <div className="verified-grid">
          {verifiedImportExamples.map((example) => (
            <article className="panel" key={example.url}>
              <span className="eyebrow">{example.siteName}</span>
              <h3>{example.recipeTitle}</h3>
              {example.status === "temporarily-unavailable" && (
                <p>最近检查暂时无法读取；可在原网站查看，稍后重试导入。</p>
              )}
              <p>
                {example.fieldsAvailable
                  .map((field) => `✓ ${field}`)
                  .join("　")}
              </p>
              <button
                className="secondary"
                onClick={() => {
                  setImportUrl(example.url);
                  clearPreview();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                填入这个示例
              </button>
              <small>
                最近验证：{example.verifiedAt} · 外部网页可能随时变化
              </small>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
