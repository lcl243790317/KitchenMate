import { LocalRecipeProvider, TheMealDBProvider } from "@/lib/providers";
import { recipeRepository } from "@/lib/db/repository";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let cached: Awaited<ReturnType<typeof recipeRepository.get>> = null;
  try {
    const local = await new LocalRecipeProvider().getRecipe(id);
    if (local) return Response.json({ recipe: local });
    cached = await recipeRepository.get(id);
    if (
      cached?.lastFetchedAt &&
      Date.now() - Date.parse(cached.lastFetchedAt) < 86400000
    )
      return Response.json({ recipe: cached });
    const recipe = id.startsWith("themealdb:")
      ? await new TheMealDBProvider().getRecipe(id)
      : null;
    if (recipe) {
      await recipeRepository.save(recipe);
      return Response.json({ recipe });
    }
    return Response.json({ error: "菜谱不存在" }, { status: 404 });
  } catch {
    if (cached)
      return Response.json({
        recipe: cached,
        warning: "在线来源暂不可用，显示缓存菜谱",
      });
    return Response.json({ error: "菜谱暂时不可用" }, { status: 503 });
  }
}
