import { ExternalRecipeProvider } from "./providers";
import { Recipe, recipeSchema } from "./model";
import { safeFetchHtml } from "./safe-fetch";
import { parseRecipeHtml } from "./recipe-parser";
/** Imports are explicit user actions, never a background crawler. */
export class ExternalUrlImportProvider extends ExternalRecipeProvider {
  id = "url-import";
  name = "URL 菜谱导入";
  enabled = true;
  async search(): Promise<Recipe[]> {
    return [];
  }
  async searchByIngredients(): Promise<Recipe[]> {
    return [];
  }
  async getRecipe(): Promise<Recipe | null> {
    return null;
  }
  normalizeRecipe(raw: unknown) {
    return recipeSchema.parse(raw);
  }
  async importUrl(url: string) {
    const page = await safeFetchHtml(url);
    return this.normalizeRecipe(parseRecipeHtml(page.html, page.url));
  }
}
