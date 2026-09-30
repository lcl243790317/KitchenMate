import { expect, type Page } from "@playwright/test";

export async function expectSavedCookingStep(
  page: Page,
  recipeId: string,
  step: number,
) {
  // UI rendering precedes the IndexedDB transaction; offline reload must exercise
  // a durable snapshot rather than race the existing async restore/save lifecycle.
  await expect
    .poll(() =>
      page.evaluate(
        (id) =>
          new Promise<number | null>((resolve, reject) => {
            const request = indexedDB.open("kitchenmate");
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
              const database = request.result;
              const transaction = database.transaction("cooking", "readonly");
              const result = transaction.objectStore("cooking").get(id);
              result.onsuccess = () => resolve(result.result?.step ?? null);
              result.onerror = () => reject(result.error);
              transaction.oncomplete = () => database.close();
              transaction.onabort = () => database.close();
            };
          }),
        recipeId,
      ),
    )
    .toBe(step);
}
