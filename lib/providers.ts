import { Recipe, recipeSchema } from "./model";
import { localRecipes } from "./seed";
import { ingredientFromText, ingredients } from "./ingredients";
import { searchRecipe } from "./matching";
import { parseAmount } from "./units";
export interface RecipeProvider {
  id: string;
  name: string;
  enabled: boolean;
  search(query: string): Promise<Recipe[]>;
  getRecipe(id: string): Promise<Recipe | null>;
  searchByIngredients(ids: string[]): Promise<Recipe[]>;
  normalizeRecipe(raw: unknown): Recipe;
}
export class LocalRecipeProvider implements RecipeProvider {
  id = "local";
  name = "本地菜谱";
  enabled = true;
  async search(q: string) {
    return localRecipes.filter((r) => searchRecipe(r, q));
  }
  async getRecipe(id: string) {
    return localRecipes.find((r) => r.id === id) ?? null;
  }
  async searchByIngredients() {
    return localRecipes;
  }
  normalizeRecipe(raw: unknown) {
    return recipeSchema.parse(raw);
  }
}
export abstract class ExternalRecipeProvider implements RecipeProvider {
  abstract id: string;
  abstract name: string;
  abstract enabled: boolean;
  abstract search(q: string): Promise<Recipe[]>;
  abstract getRecipe(id: string): Promise<Recipe | null>;
  abstract searchByIngredients(ids: string[]): Promise<Recipe[]>;
  abstract normalizeRecipe(raw: unknown): Recipe;
}
type Meal = Record<string, string | null>;
export class TheMealDBProvider extends ExternalRecipeProvider {
  id = "themealdb";
  name = "TheMealDB";
  key =
    process.env.THEMEALDB_API_KEY ||
    (process.env.NODE_ENV === "development" &&
    process.env.THEMEALDB_USE_TEST_KEY === "true"
      ? "1"
      : "");
  enabled = Boolean(this.key);
  async request(path: string) {
    if (!this.enabled) return [];
    const res = await fetch(
      `https://www.themealdb.com/api/json/v1/${encodeURIComponent(this.key)}/${path}`,
      { signal: AbortSignal.timeout(7000), next: { revalidate: 1800 } },
    );
    if (!res.ok) throw new Error("TheMealDB unavailable");
    const body = await res.json();
    return (body.meals ?? []) as Meal[];
  }
  async search(q: string) {
    return (await this.request(`search.php?s=${encodeURIComponent(q)}`)).map(
      (r) => this.normalizeRecipe(r),
    );
  }
  async getRecipe(id: string) {
    const raw = (
      await this.request(
        `lookup.php?i=${encodeURIComponent(id.replace("themealdb:", ""))}`,
      )
    )[0];
    return raw ? this.normalizeRecipe(raw) : null;
  }
  async searchByIngredients(ids: string[]) {
    const names = ids
      .slice(0, 3)
      .map((id) =>
        ingredients
          .find((i) => i.id === id)
          ?.displayNameEn.toLowerCase()
          .replace(/ /g, "_"),
      )
      .filter(Boolean);
    const hits = (
      await Promise.all(
        names.map((n) =>
          this.request(`filter.php?i=${encodeURIComponent(n!)}`),
        ),
      )
    ).flat();
    const unique = [...new Set(hits.map((m) => m.idMeal!))].slice(0, 12);
    return (await Promise.all(unique.map((id) => this.getRecipe(id)))).filter(
      (r): r is Recipe => !!r,
    );
  }
  normalizeRecipe(raw: unknown) {
    const m = raw as Meal;
    const now = new Date().toISOString();
    const items = Array.from({ length: 20 }, (_, i) => i + 1)
      .filter((i) => m[`strIngredient${i}`]?.trim())
      .map((i) => {
        const text = m[`strIngredient${i}`]!.trim();
        const measure = m[`strMeasure${i}`]?.trim() ?? "";
        return {
          ingredientId: ingredientFromText(text)?.id ?? `unknown:${text}`,
          originalText: `${measure} ${text}`,
          ...parseAmount(measure),
          optional: false,
          group: "食材",
        };
      });
    return recipeSchema.parse({
      id: `themealdb:${m.idMeal}`,
      slug: `themealdb:${m.idMeal}`,
      title: m.strMeal,
      description: m.strCategory ?? "",
      image: safePublicImage(m.strMealThumb),
      sourceProvider: this.id,
      sourceName: this.name,
      sourceUrl: `https://www.themealdb.com/meal/${m.idMeal}`,
      sourceAuthor: null,
      externalId: m.idMeal,
      cuisine: m.strArea ?? "未知",
      category: m.strCategory ?? "",
      difficulty: "未知",
      prepTime: null,
      cookTime: null,
      totalTime: null,
      servings: 2,
      servingsEstimated: true,
      ingredients: items,
      instructions: (m.strInstructions ?? "")
        .split(/\r?\n/)
        .map((x) => x.trim())
        .filter(Boolean)
        .map((description, i) => ({
          stepNumber: i + 1,
          title: `步骤 ${i + 1}`,
          description,
          durationSeconds: null,
        })),
      equipment: [],
      tags: m.strTags?.split(",") ?? [],
      allergens: [
        ...new Set(
          items.flatMap(
            (i) =>
              ingredients.find((x) => x.id === i.ingredientId)?.allergens ?? [],
          ),
        ),
      ],
      nutrition: null,
      rating: null,
      createdAt: now,
      updatedAt: now,
      sourceUpdatedAt: m.dateModified ?? null,
      lastFetchedAt: now,
    });
  }
}
export function safePublicImage(s: unknown) {
  if (typeof s !== "string") return null;
  try {
    const u = new URL(s);
    return u.protocol === "https:" && !u.username && !u.password ? s : null;
  } catch {
    return null;
  }
}
export class XiachufangProvider extends LocalRecipeProvider {
  id = "xiachufang";
  name = "下厨房（待授权）";
  enabled = false;
  async search() {
    return [];
  }
  async getRecipe() {
    return null;
  }
  async searchByIngredients() {
    return [];
  }
}
export class RecipeAggregator {
  constructor(
    public providers: RecipeProvider[] = [
      new LocalRecipeProvider(),
      new TheMealDBProvider(),
      new XiachufangProvider(),
    ],
  ) {}
  async search(q: string, ids: string[] = []) {
    const providers = this.providers.filter((p) => p.enabled);
    const settled = await Promise.allSettled(
      providers.map((p) =>
        !q && ids.length ? p.searchByIngredients(ids) : p.search(q),
      ),
    );
    const warnings: string[] = [];
    const all: Recipe[] = [];
    settled.forEach((r, i) => {
      if (r.status === "fulfilled") all.push(...r.value);
      else {
        warnings.push(`${providers[i].name} 暂时不可用，已保留其他菜谱`);
        console.warn("Provider failed:", providers[i].id);
      }
    });
    return {
      recipes: [
        ...new Map(
          all.map((r) => [`${r.sourceProvider}:${r.externalId ?? r.id}`, r]),
        ).values(),
      ],
      warnings,
    };
  }
}
