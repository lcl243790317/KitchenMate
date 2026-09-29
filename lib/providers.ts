import { dedupeRecipes } from "./recipe-trust";
import { Recipe, recipeSchema } from "./model";
import { verifiedRecipes, recipesById } from "./verified-recipes";
import { ingredientFromText, ingredientById } from "./ingredients";
import { searchRecipe } from "./matching";
import { parseAmount } from "./units";
export type ProviderCapabilities = {
  searchByName: boolean;
  searchByIngredients: boolean;
  getRecipe: boolean;
  fullInstructions: boolean;
  structuredIngredients: boolean;
  sourceLinks: boolean;
  images: boolean;
  language: string[];
  requiresApiKey: boolean;
};
const catalogCapabilities: ProviderCapabilities = {
  searchByName: true,
  searchByIngredients: true,
  getRecipe: true,
  fullInstructions: true,
  structuredIngredients: true,
  sourceLinks: true,
  images: false,
  language: ["zh"],
  requiresApiKey: false,
};
export interface RecipeProvider {
  capabilities: ProviderCapabilities;
  id: string;
  name: string;
  enabled: boolean;
  search(query: string): Promise<Recipe[]>;
  getRecipe(id: string): Promise<Recipe | null>;
  searchByIngredients(ids: string[]): Promise<Recipe[]>;
  normalizeRecipe(raw: unknown): Recipe;
}
export class VerifiedRecipeCatalogProvider implements RecipeProvider {
  capabilities = catalogCapabilities;
  id = "local";
  name = "已验证菜谱";
  enabled = true;
  async search(q: string) {
    return verifiedRecipes.filter((r) => searchRecipe(r, q));
  }
  async getRecipe(id: string) {
    return recipesById.get(id) ?? null;
  }
  async searchByIngredients() {
    return verifiedRecipes;
  }
  normalizeRecipe(raw: unknown) {
    return recipeSchema.parse(raw);
  }
}
export abstract class ExternalRecipeProvider implements RecipeProvider {
  capabilities: ProviderCapabilities = {
    ...catalogCapabilities,
    language: ["en"],
    requiresApiKey: true,
  };
  abstract id: string;
  abstract name: string;
  abstract enabled: boolean;
  abstract search(q: string): Promise<Recipe[]>;
  abstract getRecipe(id: string): Promise<Recipe | null>;
  abstract searchByIngredients(ids: string[]): Promise<Recipe[]>;
  abstract normalizeRecipe(raw: unknown): Recipe;
}
type Meal = Record<string, string | null>;
const pendingMealRequests = new Map<string, Promise<Meal[]>>();
export class TheMealDBProvider extends ExternalRecipeProvider {
  id = "themealdb";
  name = "TheMealDB";
  key =
    process.env.THEMEALDB_API_KEY ||
    (process.env.NODE_ENV === "development" &&
    process.env.THEMEALDB_USE_TEST_KEY === "true"
      ? "1"
      : "");
  enabled =
    Boolean(this.key) &&
    !(process.env.NODE_ENV === "production" && this.key === "1");
  async request(path: string) {
    if (!this.enabled) return [];
    const requestKey = `${this.key}:${path}`;
    const existing = pendingMealRequests.get(requestKey);
    if (existing) return existing;
    const pending = (async () => {
      const res = await fetch(
        `https://www.themealdb.com/api/json/v1/${encodeURIComponent(this.key)}/${path}`,
        { signal: AbortSignal.timeout(7000), next: { revalidate: 1800 } },
      );
      if (!res.ok) throw new Error("TheMealDB unavailable");
      const body = await res.json();
      return (body.meals ?? []) as Meal[];
    })();
    pendingMealRequests.set(requestKey, pending);
    try {
      return await pending;
    } finally {
      pendingMealRequests.delete(requestKey);
    }
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
        ingredientById.get(id)?.displayNameEn.toLowerCase().replace(/ /g, "_"),
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
    const recipes: Recipe[] = [];
    for (let index = 0; index < unique.length; index += 3) {
      const batch = await Promise.allSettled(
        unique.slice(index, index + 3).map((id) => this.getRecipe(id)),
      );
      recipes.push(
        ...batch
          .filter(
            (result): result is PromiseFulfilledResult<Recipe | null> =>
              result.status === "fulfilled",
          )
          .map((result) => result.value)
          .filter((recipe): recipe is Recipe => recipe !== null),
      );
    }
    return recipes;
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
      provenance: {
        type: "LICENSED_API",
        sourceName: this.name,
        sourceUrl: `https://www.themealdb.com/meal/${m.idMeal}`,
        sourceRecipeTitle: m.strMeal,
        sourceAuthor: null,
        sourceExternalId: m.idMeal,
        verifiedAt: now,
        verificationMethod: "api",
        instructionSource: "provider-api",
        imageSource: safePublicImage(m.strMealThumb),
        licenseOrUsageBasis:
          "Official API response; TheMealDB Terms of Use; attribution retained. Production requires supporter key.",
      },
      verificationStatus: "verified",
      instructionAvailability: "full",
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
            (i) => ingredientById.get(i.ingredientId)?.allergens ?? [],
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
export class XiachufangProvider extends VerifiedRecipeCatalogProvider {
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
      new VerifiedRecipeCatalogProvider(),
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
    if (this.providers.some((p) => p.id === "themealdb" && !p.enabled))
      warnings.push("TheMealDB 未配置生产授权密钥；已验证目录可直接使用。");
    const all: Recipe[] = [];
    settled.forEach((r, i) => {
      if (r.status === "fulfilled") all.push(...r.value);
      else {
        warnings.push(`${providers[i].name} 暂时不可用，已保留其他菜谱`);
        console.warn("Provider failed:", providers[i].id);
      }
    });
    return {
      recipes: dedupeRecipes(all),
      warnings,
    };
  }
}
