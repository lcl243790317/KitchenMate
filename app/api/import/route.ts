import { z } from "zod";
import { ExternalUrlImportProvider } from "@/lib/url-import-provider";
import { rateLimitRequest, sameOrigin } from "@/lib/rate-limit";
import { readJson } from "@/lib/http";
import { parseRecipeHtml } from "@/lib/recipe-parser";
import { exampleJsonLd } from "@/lib/example-recipe";
export const runtime = "nodejs";
function friendlyImportError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("HTTPS")) return "请使用公开的 HTTPS 菜谱网页地址。";
  if (message.includes("重定向"))
    return "这个网址跳转次数过多，请复制最终菜谱页的地址。";
  if (message.includes("超时")) return "网站响应超时，请稍后再试。";
  if (message.includes("2MB")) return "页面太大，超过可导入的大小限制。";
  if (message.includes("Recipe 结构化"))
    return "此页面没有找到 Recipe 结构化数据，请换一个公开菜谱页面。";
  if (message.includes("菜谱数据不完整"))
    return "这个网页的菜谱数据不完整，需要菜名、食材和做法步骤。";
  if (message.includes("HTML"))
    return "这个网址不是可读取的菜谱网页，或网站拒绝了访问。";
  if (
    message.includes("network") ||
    message.includes("ENOTFOUND") ||
    message.includes("ECONN")
  )
    return "暂时无法访问这个网站，请检查网址或稍后再试。";
  if (error instanceof z.ZodError)
    return "菜谱数据不完整，请确认网页包含菜名、食材和步骤。";
  return "暂时无法读取这个菜谱网页，请确认网址正确且网站允许公开访问。";
}
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: "无效来源" }, { status: 403 });
  if (!rateLimitRequest(request, "import", 10))
    return Response.json(
      { error: "导入频率过高，请一分钟后再试" },
      { status: 429 },
    );
  try {
    const { url } = z
      .object({ url: z.string().url().max(2000) })
      .parse(await readJson(request, 6000));
    const parsed = new URL(url);
    const publicOrigin =
      request.headers.get("origin") ?? new URL(request.url).origin;
    const demo =
      parsed.origin === publicOrigin &&
      parsed.pathname === "/examples/import/tomato-eggs";
    const recipe = demo
      ? parseRecipeHtml(
          `<script type="application/ld+json">${JSON.stringify(exampleJsonLd)}</script>`,
          parsed.href,
        )
      : await new ExternalUrlImportProvider().importUrl(url);
    return Response.json({ recipe });
  } catch (error) {
    return Response.json(
      { error: friendlyImportError(error) },
      { status: 400 },
    );
  }
}
