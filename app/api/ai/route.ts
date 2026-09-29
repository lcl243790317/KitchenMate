import { z } from "zod";
import { AIRecipeProvider } from "@/lib/ai-provider";
import { rateLimit, sameOrigin } from "@/lib/rate-limit";
import { readJson } from "@/lib/http";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: "无效来源" }, { status: 403 });
  const provider = new AIRecipeProvider();
  if (!provider.enabled)
    return Response.json(
      { error: "尚未配置 AI。普通食材推荐仍可正常使用。" },
      { status: 503 },
    );
  if (!rateLimit("ai", 5))
    return Response.json({ error: "请稍后再试" }, { status: 429 });
  try {
    const input = z
      .object({
        ingredients: z.array(z.string().max(80)).max(50),
        constraints: z.string().max(500),
      })
      .parse(await readJson(request, 16000));
    return Response.json({ recipes: await provider.generate(input) });
  } catch {
    return Response.json(
      { error: "AI 暂时无法生成可靠的结构化菜谱，请使用普通推荐或稍后重试。" },
      { status: 502 },
    );
  }
}
