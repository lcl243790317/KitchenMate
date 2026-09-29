import { VerifiedRecipeCatalogProvider, TheMealDBProvider } from "@/lib/providers";
import { recipeRepository } from "@/lib/db/repository";
import { canDisplayRecipe } from "@/lib/recipe-trust";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: encodedId } = await params;
  const id = decodeURIComponent(encodedId);
  let cached: Awaited<ReturnType<typeof recipeRepository.get>> = null;
  try {
    const local = await new VerifiedRecipeCatalogProvider().getRecipe(id);
    if (local) return Response.json({ recipe: local });
    cached = await recipeRepository.get(id);
    if (cached && !canDisplayRecipe(cached)) cached = null;
    if (
      cached?.lastFetchedAt &&
      Date.now() - Date.parse(cached.lastFetchedAt) < 86400000
    )
      return Response.json({ recipe: cached });
    const recipe = id.startsWith("themealdb:")
      ? await new TheMealDBProvider().getRecipe(id)
      : null;
    if (recipe && canDisplayRecipe(recipe)) {
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
