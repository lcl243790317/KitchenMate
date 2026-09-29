import { z } from "zod";
import { ExternalUrlImportProvider } from "@/lib/url-import-provider";
import { rateLimit, sameOrigin } from "@/lib/rate-limit";
import { readJson } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: "无效来源" }, { status: 403 });
  if (!rateLimit("import", 10))
    return Response.json(
      { error: "导入频率过高，请一分钟后再试" },
      { status: 429 },
    );
  try {
    const { url } = z
      .object({ url: z.string().url().max(2000) })
      .parse(await readJson(request, 6000));
    return Response.json({
      recipe: await new ExternalUrlImportProvider().importUrl(url),
    });
  } catch {
    return Response.json(
      {
        error:
          "无法导入：请确认是公开 HTTPS 菜谱页面，包含 Recipe 结构化数据，且你有权导入。",
      },
      { status: 400 },
    );
  }
}
