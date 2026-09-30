import { test, expect } from "@playwright/test";
import { verifiedRecipes } from "../../lib/verified-recipes";
import { expectSavedCookingStep } from "./cooking-snapshot";
test.skip(
  process.env.OFFLINE_TESTS !== "true",
  "Requires a local production server on port 3001",
);

test("production build keeps the visited kitchen usable offline", async ({
  page,
  context,
}) => {
  await page.goto(
    `${process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3001"}/pantry`,
  );
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "我现在有什么？", exact: true }),
  ).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "我现在有什么？", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "番茄", exact: true }),
  ).toBeVisible();
  await context.setOffline(false);
  const recipe = verifiedRecipes.find((r) => r.title === "西红柿炒鸡蛋")!;
  await page.goto(
    `${process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3001"}/recipe/${encodeURIComponent(recipe.id)}/cook`,
  );
  await expect(page.locator(".cooking-description")).toHaveText(
    recipe.instructions[0].description,
  );
  await expectSavedCookingStep(page, recipe.id, 0);
  await page.getByRole("button", { name: "下一步" }).click();
  await expect(page.locator(".cooking-description")).toHaveText(
    recipe.instructions[1].description,
  );
  await expectSavedCookingStep(page, recipe.id, 1);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".cooking-description")).toHaveText(
    recipe.instructions[1].description,
  );
});
