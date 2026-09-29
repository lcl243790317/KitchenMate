import { KitchenApp } from "@/components/kitchen-app";
import { ServerRecipeDetail } from "@/features/recipes/server-recipe-detail";
import { localRecipeById } from "@/lib/seed";
import type { Metadata } from "next";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const recipe = localRecipeById.get(id);
  return recipe ? { title: `${recipe.title} · KitchenMate`, description: recipe.description, openGraph: { title: recipe.title, description: recipe.description } } : { title: "我的菜谱 · KitchenMate" };
}
export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = localRecipeById.get(id);
  return recipe ? <ServerRecipeDetail recipe={recipe} /> : <KitchenApp />;
}
