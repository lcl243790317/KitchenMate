import type { Recipe } from "../model";
import { recipeSchema } from "../model";
export interface RecipeRepository {
  get(id: string): Promise<Recipe | null>;
  save(recipe: Recipe): Promise<void>;
}
export class MemoryRecipeRepository implements RecipeRepository {
  private data = new Map<string, Recipe>();
  async get(id: string) {
    return this.data.get(id) ?? null;
  }
  async save(recipe: Recipe) {
    if (this.data.size >= 500 && !this.data.has(recipe.id))
      this.data.delete(this.data.keys().next().value!);
    this.data.set(recipe.id, recipeSchema.parse(recipe));
  }
}
export class PostgresRecipeRepository implements RecipeRepository {
  private database?: ReturnType<PostgresRecipeRepository["createConnection"]>;
  private async createConnection() {
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const { default: postgres } = await import("postgres");
    return drizzle(
      postgres(process.env.DATABASE_URL!, { max: 1, prepare: false }),
    );
  }
  connection() {
    return (this.database ??= this.createConnection());
  }
  async get(id: string) {
    const db = await this.connection();
    const { recipes } = await import("./schema");
    const { eq } = await import("drizzle-orm");
    const [row] = await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, id))
      .limit(1);
    return row ? recipeSchema.parse(row.document) : null;
  }
  async save(recipe: Recipe) {
    const db = await this.connection();
    const { recipes } = await import("./schema");
    await db
      .insert(recipes)
      .values({
        id: recipe.id,
        sourceProvider: recipe.sourceProvider,
        externalId: recipe.externalId,
        sourceUrl: recipe.sourceUrl,
        document: recipeSchema.parse(recipe),
      })
      .onConflictDoUpdate({
        target: recipes.id,
        set: { document: recipe, lastFetchedAt: new Date() },
      });
  }
}
const memory = new MemoryRecipeRepository();
export const recipeRepository: RecipeRepository = process.env.DATABASE_URL
  ? new PostgresRecipeRepository()
  : memory;
