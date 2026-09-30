import { test, expect, type Page } from "@playwright/test";

async function openAndReturn(
  page: Page,
  index: number,
  label: string,
  viaButton: boolean,
  reloadDetail = false,
) {
  const cards = page.locator(".recipe-card");
  const count = await cards.count();
  const card = cards.nth(index);
  const id = await card.getAttribute("data-recipe-id");
  await card.locator(".recipe-title").scrollIntoViewIfNeeded();
  const scrollY = await page.evaluate(() => window.scrollY);
  await card.locator(".recipe-title").click();
  await expect(page.locator("a.back")).toHaveText(label);
  if (reloadDetail) {
    await page.reload();
    await expect(page.locator("a.back")).toHaveText(label);
  }
  if (viaButton) await page.locator("a.back").click();
  else await page.goBack();
  await expect(cards).toHaveCount(count);
  const restored = page.locator(`[data-recipe-id="${id}"]`);
  await expect(restored).toBeInViewport();
  await expect
    .poll(async () =>
      Math.abs((await page.evaluate(() => window.scrollY)) - scrollY),
    )
    .toBeLessThan(120);
  return id;
}

for (const mobile of [false, true]) {
  test(`all tutorials restore 72 cards and scroll with browser and detail Back (${mobile ? "390px" : "desktop"})`, async ({
    page,
  }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/recipes");
    await expect(page.locator(".recipe-card")).toHaveCount(24);
    for (let i = 0; i < 2; i++)
      await page.getByRole("button", { name: "加载更多", exact: true }).click();
    await expect(page.locator(".recipe-card")).toHaveCount(72);
    const firstId = await openAndReturn(page, 55, "返回全部教程", false);
    const secondId = await openAndReturn(page, 55, "返回全部教程", true, true);
    expect(secondId).toBe(firstId);
    if (mobile)
      await page.screenshot({
        path: ".cache/phase312-recipes-return-mobile.png",
      });
    if (mobile)
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(390);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.reload();
    await expect(page.locator(".recipe-card")).toHaveCount(24);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeLessThan(120);
  });
}

test("tutorial query, category, source, loaded batches and position survive detail return; URL shares filters", async ({
  page,
}) => {
  await page.goto("/recipes");
  await page.getByLabel("搜索全部教程").fill("肉");
  await page.getByLabel("教程类别").selectOption("肉类");
  await page.getByLabel("教程来源").selectOption("HowToCook");
  await expect(page).toHaveURL(/q=.*&category=.*&source=HowToCook/);
  await page.getByRole("button", { name: "加载更多", exact: true }).click();
  const ids = await page
    .locator(".recipe-card")
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("data-recipe-id")),
    );
  await openAndReturn(page, 30, "返回全部教程", true);
  await expect(page.getByLabel("搜索全部教程")).toHaveValue("肉");
  await expect(page.getByLabel("教程类别")).toHaveValue("肉类");
  await expect(page.getByLabel("教程来源")).toHaveValue("HowToCook");
  expect(
    await page
      .locator(".recipe-card")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("data-recipe-id")),
      ),
  ).toEqual(ids);
  await page.reload();
  await expect(page.getByLabel("搜索全部教程")).toHaveValue("肉");
  await expect(page.getByLabel("教程类别")).toHaveValue("肉类");
  await expect(page.getByLabel("教程来源")).toHaveValue("HowToCook");
});

test("discover restores query, mode, filters, loaded count and scroll with both return controls on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/pantry");
  await page.getByRole("button", { name: "清空厨房" }).click();
  for (const name of ["番茄", "鸡蛋"])
    await page.getByRole("button", { name, exact: true }).click();
  await page.getByRole("link", { name: "看看我能做什么" }).click();
  await page.getByRole("button", { name: "最匹配", exact: true }).click();
  await page.getByLabel("搜索菜谱").fill("蛋");
  await page.getByRole("button", { name: "筛选", exact: true }).click();
  await page.getByRole("button", { name: "加载更多菜谱", exact: true }).click();
  await openAndReturn(page, 30, "返回发现菜谱", false);
  await expect(
    page.getByRole("button", { name: "最匹配", exact: true }),
  ).toHaveClass("active");
  await expect(
    page.getByRole("button", { name: "为我推荐", exact: true }),
  ).toHaveClass("active");
  await expect(page.getByLabel("搜索菜谱")).toHaveValue("蛋");
  await expect(page.getByLabel("菜系", { exact: true })).toHaveValue("");
  await openAndReturn(page, 30, "返回发现菜谱", true);
  await page.screenshot({ path: ".cache/phase312-discover-return-mobile.png" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
});

test("direct recipe URL has safe catalog fallback; home recipe remembers home", async ({
  page,
}) => {
  await page.goto("/recipe/howtocook%3A4f1a2679eb840431");
  await expect(page.locator("a.back")).toHaveText("返回全部教程");
  await page.locator("a.back").click();
  await expect(page).toHaveURL(/\/recipes$/);
  await page.goto("/pantry");
  await page.getByRole("button", { name: "清空厨房" }).click();
  await page.getByRole("button", { name: "鸡蛋", exact: true }).click();
  await page.goto("/");
  await page.locator(".recipe-card .recipe-title").first().click();
  await expect(page.locator("a.back")).toHaveText("返回首页");
  await page.locator("a.back").click();
  await expect(
    page.getByRole("link", { name: "看看我能做什么", exact: true }).first(),
  ).toBeVisible();
});

test("mushroom chicken includes calculation amounts and owns only selected actual ingredients", async ({
  page,
}) => {
  const url = "/recipe/howtocook%3A4f1a2679eb840431";
  await page.goto("/pantry");
  await page.getByRole("button", { name: "清空厨房" }).click();
  for (const name of ["鸡腿", "姜", "葱", "蒜"])
    await page.getByRole("button", { name, exact: true }).click();
  await page.getByLabel("搜索食材").fill("干香菇");
  await page.getByRole("button", { name: "干香菇", exact: true }).click();
  await page.goto(url);
  const rows = page.locator(".detail-ingredient");
  const available = rows.filter({ has: page.locator(".has") });
  const missing = rows.filter({ hasNot: page.locator(".has") });
  await expect(rows).toHaveCount(12);
  await expect(available).toHaveCount(5);
  for (const name of ["水", "料酒", "生抽", "盐", "老抽", "糖", "香油"])
    await expect(missing.filter({ hasText: name })).toHaveCount(1);
  for (const [name, amount] of [
    ["料酒", "15 ml"],
    ["生抽", "30 ml"],
    ["盐", "1.5 g"],
    ["香油", "5 ml"],
  ]) {
    const row = rows.filter({ hasText: name });
    await expect(row.locator("span").last()).toHaveText(amount);
  }
  await page.goto("/pantry");
  await page.getByRole("button", { name: "生抽", exact: true }).click();
  await page.goto(url);
  await expect(available).toHaveCount(6);
  await page
    .locator(".ingredient-list")
    .screenshot({ path: ".cache/phase312-mushroom-ingredients.png" });
  await expect(available.filter({ hasText: "生抽" })).toHaveCount(1);
  for (const name of ["老抽", "料酒", "香油"])
    await expect(missing.filter({ hasText: name })).toHaveCount(1);
});
