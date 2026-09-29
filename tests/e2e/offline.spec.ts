import { test, expect } from "@playwright/test";
test.skip(process.env.OFFLINE_TESTS !== "true", "Requires a local production server on port 3001");

test("production build keeps the visited kitchen usable offline", async ({ page, context }) => {
  await page.goto("http://127.0.0.1:3001/pantry");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.getByRole("heading", { name: "我的厨房", exact: true })).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "我的厨房", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "番茄", exact: true })).toBeVisible();
});
