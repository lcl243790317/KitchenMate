import { RecipeAggregator } from "@/lib/providers";
import { rateLimitRequest } from "@/lib/rate-limit";
export async function GET(request: Request) {
  if (!rateLimitRequest(request, "search", 90))
    return Response.json({ error: "请求太频繁，请稍后再试" }, { status: 429 });
  const u = new URL(request.url);
  const q = (u.searchParams.get("q") ?? "").slice(0, 100);
  const ids = (u.searchParams.get("ingredients") ?? "")
    .split(",")
    .filter(Boolean)
    .slice(0, 30);
  return Response.json(await new RecipeAggregator().search(q, ids));
}
