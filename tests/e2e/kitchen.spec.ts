import { test, expect } from "@playwright/test";
test("mobile recommendation and cooking flow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("link", { name: "看看我能做什么" }).click();
  await page.getByRole("button", { name: "番茄炒蛋", exact: true }).click();
  await page.getByLabel("份量", { exact: true }).selectOption("4");
  await expect(page.getByText("6 个", { exact: true })).toBeVisible();
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 390);
  await page.screenshot({
    path: "docs/screenshots/mobile-detail.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "开始做菜" }).click();
  await page.getByRole("button", { name: /开始计时/ }).click();
  await page.getByRole("button", { name: "下一步" }).click();
  await expect(
    page.getByRole("heading", { name: "炒出蓬松的鸡蛋" }),
  ).toBeVisible();
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 390);
  await page.screenshot({
    path: "docs/screenshots/mobile-cooking.png",
    fullPage: true,
  });
});
test("pantry → recommendation → servings → shopping → cooking", async ({
  page,
}) => {
  await page.goto("/pantry");
  await page.getByRole("button", { name: "清空厨房", exact: true }).click();
  for (const name of ["番茄", "鸡蛋", "鸡胸肉", "土豆", "洋葱"])
    await page.getByRole("button", { name, exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "番茄", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("link", { name: "看看我能做什么" }).click();
  await page.getByRole("button", { name: "番茄炒蛋", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "番茄炒蛋", exact: true }),
  ).toBeVisible();
  await page.getByLabel("份量", { exact: true }).selectOption("4");
  await expect(page.getByText("6 个", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "添加缺少食材到购物清单" }).click();
  await page
    .getByRole("link", { name: /购物清单/ })
    .first()
    .click();
  await expect(page.getByText("食用油", { exact: true })).toBeVisible();
  await page.getByRole("checkbox").first().check();
  await page.goBack();
  await page.getByRole("link", { name: "开始做菜" }).click();
  await expect(
    page.getByRole("heading", { name: "切好番茄，打散鸡蛋" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /开始计时/ }).click();
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByRole("button", { name: /开始计时/ }).click();
  await expect(page.locator(".timer-list>div")).toHaveCount(2);
  await page.getByRole("button", { name: "上一步" }).click();
  await expect(
    page.getByRole("heading", { name: "切好番茄，打散鸡蛋" }),
  ).toBeVisible();
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "下一步" }).click();
  await page.getByRole("button", { name: "完成这道菜" }).click();
  await expect(
    page.getByRole("heading", { name: "做好了，趁热吃吧！" }),
  ).toBeVisible();
});
test("mobile home and dark mode have no horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "你厨房里现在有什么？" }),
  ).toBeVisible();
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 390);
  await page.screenshot({
    path: "docs/screenshots/mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "切换深色模式" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({
    path: "docs/screenshots/mobile-dark.png",
    fullPage: true,
  });
});
test("desktop screenshot and local fallback", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "番茄炒蛋", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "发现菜谱", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "查找在线菜谱" }).click();
  await expect(
    page.getByRole("button", { name: "番茄炒蛋", exact: true }),
  ).toBeVisible();
});
test("Chinese ingredient alias and first-party import survive refresh", async ({
  page,
}) => {
  await page.setViewportSize({ width: 430, height: 900 });
  await page.goto("/pantry");
  await page.getByLabel("搜索食材").fill("西红柿");
  await expect(
    page.getByRole("button", { name: "番茄", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "番茄", exact: true }).click();
  await page.goto("/import");
  await page.getByRole("button", { name: "试试导入这个示例" }).click();
  await expect(page.getByLabel("菜谱网址")).toHaveValue(
    /examples\/import\/tomato-eggs/,
  );
  await page.getByRole("button", { name: "分析并导入" }).click();
  await expect(
    page.getByRole("heading", { name: "找到了这个菜谱" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "保存到我的菜谱" }).click();
  await page.reload();
  await page
    .getByRole("link", { name: "发现菜谱", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "我的菜谱", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "番茄炒蛋", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "番茄炒蛋", exact: true }).click();
  await page.getByRole("link", { name: "开始做菜" }).click();
  await expect(page.getByRole("heading", { name: "步骤 1" })).toBeVisible();
});

test("v1 kitchen migrates and JSON backup restores it", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "kitchenmate-v1",
      JSON.stringify({
        pantry: [
          {
            ingredientId: "tomato",
            canonicalName: "tomato",
            displayName: "番茄",
            category: "蔬菜",
            quantity: 2,
            unit: "个",
            expiryDate: null,
            storageLocation: "冰箱",
            createdAt: "2026-09-29",
            updatedAt: "2026-09-29",
          },
        ],
        shopping: [],
        saved: [],
        favorites: ["tomato-eggs"],
        dark: true,
      }),
    );
  });
  await page.goto("/pantry");
  await expect(
    page.getByRole("button", { name: "番茄", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出我的数据" }).click();
  const stream = await (await downloadPromise).createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const backup = Buffer.concat(chunks);
  await page.getByRole("button", { name: "清空厨房" }).click();
  await expect(
    page.getByRole("button", { name: "番茄", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await page
    .getByLabel("选择 KitchenMate 备份")
    .setInputFiles({
      name: "backup.json",
      mimeType: "application/json",
      buffer: backup,
    });
  await expect(page.getByText("将恢复：", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "确认恢复" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "番茄", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});
