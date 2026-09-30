import { test, expect } from "@playwright/test";
import { verifiedRecipes } from "../../lib/verified-recipes";
import { expectNoHorizontalOverflow } from "./assert-layout";
const recipe = verifiedRecipes.find((r) => r.title === "西红柿炒鸡蛋")!;
const linked = verifiedRecipes.find(
  (r) => r.provenance.type === "SOURCE_LINKED",
)!;
const detail = `/recipe/${encodeURIComponent(recipe.id)}`;

test("mobile ingredient selection finds a real source and source steps", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/pantry");
  await page.getByRole("button", { name: "清空厨房", exact: true }).click();
  for (const name of ["番茄", "鸡蛋", "洋葱"])
    await page.getByRole("button", { name, exact: true }).click();
  await page.getByRole("link", { name: "看看我能做什么" }).click();
  await expect(
    page.getByRole("button", { name: "现在就能做", exact: true }),
  ).toHaveClass("active");
  await page.getByRole("button", { name: recipe.title, exact: true }).click();
  await expect(page.getByRole("region", { name: "菜谱来源" })).toContainText(
    "HowToCook",
  );
  await expect(
    page.getByRole("link", { name: "查看原始菜谱", exact: true }),
  ).toHaveAttribute("href", recipe.sourceUrl!);
  await expectNoHorizontalOverflow(page);
  await page.getByRole("link", { name: "开始做菜" }).click();
  await expect(page.locator(".cooking-description")).toHaveText(
    recipe.instructions[0].description,
  );
  await page.getByRole("button", { name: "下一步" }).click();
  await expect(page.locator(".cooking-description")).toHaveText(
    recipe.instructions[1].description,
  );
  await page.reload();
  await expect(page.locator(".cooking-description")).toHaveText(
    recipe.instructions[1].description,
  );
  await page.screenshot({
    path: ".cache/phase31-mobile-cooking.png",
    fullPage: true,
  });
});

test("pantry is selection only and persists without an editor", async ({
  page,
}) => {
  await page.goto("/pantry");
  await page.getByRole("button", { name: "清空厨房" }).click();
  await page.getByRole("button", { name: "鸡胸肉", exact: true }).click();
  await expect(
    page.locator("input[type=number],input[type=date],.stock-row select"),
  ).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "鸡胸肉", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "鸡胸肉", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "鸡胸肉", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
});

test("shopping completion never changes selected ingredients", async ({
  page,
}) => {
  await page.goto("/pantry");
  await page.getByRole("button", { name: "清空厨房" }).click();
  await page.goto(detail);
  await page.getByRole("button", { name: "添加缺少食材到购物清单" }).click();
  await page.goto("/shopping");
  await expect(page.getByText("番茄", { exact: true })).toBeVisible();
  await page.getByRole("checkbox").first().check();
  await page.goto("/pantry");
  await expect(
    page.getByRole("button", { name: "番茄", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
});

test("source-only recipe links to original and cannot cook", async ({
  page,
}) => {
  const path = `/recipe/${encodeURIComponent(linked.id)}`;
  await page.goto(path);
  await expect(
    page.getByRole("link", { name: "查看原始教程", exact: true }),
  ).toHaveAttribute("href", linked.sourceUrl!);
  await expect(page.getByRole("link", { name: "开始做菜" })).toHaveCount(0);
  await page.goto(path + "/cook");
  await expect(
    page.getByRole("heading", { name: "完整步骤在原网站" }),
  ).toBeVisible();
  await expect(page.locator(".cooking-description")).toHaveCount(0);
});

test("first-party import remains a labeled test fixture after saving", async ({
  page,
}) => {
  await page.goto("/import");
  await page.getByRole("button", { name: "试试导入这个示例" }).click();
  await page.getByRole("button", { name: "分析并导入" }).click();
  await expect(page.getByRole("region", { name: "导入预览" })).toContainText(
    "FIRST_PARTY_TEST",
  );
  await page.getByRole("button", { name: "保存到我的菜谱" }).click();
  await page.reload();
  await expect(page.getByText("已在本机保存 1 道菜谱")).toBeVisible();
  await page.goto("/discover");
  await page.getByRole("button", { name: "我的导入", exact: true }).click();
  await expect(page.locator(".recipe-card")).toHaveCount(0);
});

test("v2 backup migrates fields, preserves recents and exports v3", async ({
  page,
}) => {
  await page.goto("/pantry");
  const backup = {
    format: "kitchenmate-backup",
    version: 2,
    exportedAt: new Date().toISOString(),
    data: {
      pantry: [
        {
          ingredientId: "tomato",
          quantity: 6,
          unit: "个",
          expiryDate: "2026-10-02",
          storageLocation: "冰箱",
        },
      ],
      saved: [],
      shopping: [],
      favorites: [recipe.id],
      recentRecipeIds: [recipe.id],
      dark: true,
    },
  };
  await page.getByLabel("选择 KitchenMate 备份").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page.getByRole("button", { name: "确认恢复" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "番茄", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出我的数据" }).click();
  const stream = await (await download).createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const exported = JSON.parse(Buffer.concat(chunks).toString());
  expect(exported.version).toBe(3);
  expect(exported.data.pantry).toEqual([{ ingredientId: "tomato" }]);
  expect(exported.data.favorites).toEqual([recipe.id]);
  expect(exported.data.recentRecipeIds).toEqual([recipe.id]);
});

test("old IndexedDB data upgrades without losing selections", async ({
  page,
}) => {
  await page.goto("/api/health");
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("kitchenmate", 3);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("state");
        request.result.createObjectStore("cooking");
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("state", "readwrite");
        tx.objectStore("state").put(
          {
            pantry: [
              {
                ingredientId: "egg",
                quantity: 6,
                unit: "个",
                expiryDate: "2026-10-02",
                storageLocation: "冰箱",
              },
            ],
            shopping: [],
            saved: [],
            favorites: ["old-id"],
            recentRecipeIds: ["old-id"],
            dark: false,
          },
          "current",
        );
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
      };
    });
  });
  await page.goto("/pantry");
  await expect(
    page.getByRole("button", { name: "鸡蛋", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(() =>
      page.evaluate(
        async () =>
          new Promise((resolve) => {
            const r = indexedDB.open("kitchenmate");
            r.onsuccess = () => {
              const db = r.result;
              const q = db
                .transaction("state")
                .objectStore("state")
                .get("current");
              q.onsuccess = () => {
                resolve({
                  version: db.version,
                  pantry: q.result.pantry,
                  favorites: q.result.favorites,
                });
                db.close();
              };
            };
          }),
      ),
    )
    .toEqual({
      version: 4,
      pantry: [{ ingredientId: "egg" }],
      favorites: ["old-id"],
    });
});

test("mobile home dark mode and all source cards fit the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "你厨房里现在有什么？" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "切换深色模式" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    path: ".cache/phase31-mobile.png",
    fullPage: true,
  });
});

test("recent recipes and verified catalog remain after refresh", async ({
  page,
}) => {
  await page.goto("/pantry");
  await page.getByRole("button", { name: "清空厨房" }).click();
  await page.getByRole("button", { name: "番茄", exact: true }).click();
  await page.goto(detail);
  await expect(
    page.getByRole("button", { name: "收藏菜谱", exact: true }),
  ).toBeVisible();
  await page.goto("/discover");
  await expect(
    page
      .getByRole("region", { name: "最近看过的菜谱" })
      .getByRole("link", { name: recipe.title }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("region", { name: "最近看过的菜谱" }),
  ).toContainText(recipe.title);
  await page.goto("/recipes");
  await expect(page.locator(".recipe-card")).toHaveCount(24);
  await page.goto("/discover");
  await page.getByRole("button", { name: "查找在线菜谱" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "TheMealDB" }),
  ).toBeVisible();
});

test("unverified legacy URLs cannot reopen fabricated tutorials", async ({
  page,
}) => {
  await page.goto("/recipe/tomato-eggs/cook");
  await expect(
    page.getByRole("link", { name: "返回发现菜谱", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".cooking-description")).toHaveCount(0);
});
