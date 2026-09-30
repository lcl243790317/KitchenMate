import { test, expect } from "@playwright/test";
import { verifiedRecipes } from "../../lib/verified-recipes";
import { searchRecipe, matchRecipe } from "../../lib/matching";
const recipe = verifiedRecipes.find((r) => r.title === "西红柿炒鸡蛋")!;
const linked = verifiedRecipes.find(
  (r) => r.instructionAvailability === "source-only",
)!;
test("primary pantry toggles directly and searches uncommon vocabulary", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/pantry");
  await page.getByRole("button", { name: "清空厨房" }).click();
  await expect(page.locator("button.ingredient")).toHaveCount(86);
  const egg = page.getByRole("button", { name: "鸡蛋", exact: true });
  await egg.click();
  await expect(egg).toHaveAttribute("aria-pressed", "true");
  await egg.click();
  await expect(egg).toHaveAttribute("aria-pressed", "false");
  await expect(
    page.locator("input[type=number],input[type=date],[role=dialog]"),
  ).toHaveCount(0);
  for (const query of ["羊肚", "baby bok choy"]) {
    await page.getByLabel("搜索食材").fill(query);
    await expect(page.locator("button.ingredient")).not.toHaveCount(0);
  }
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 390);
});
test("all five recommendation modes remain related to selected ingredients", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/pantry");
  await page.getByRole("button", { name: "清空厨房" }).click();
  for (const name of ["番茄", "鸡蛋"])
    await page.getByRole("button", { name, exact: true }).click();
  await page.getByRole("link", { name: "看看我能做什么" }).click();
  expect(
    await page
      .locator(".recommend-tabs")
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  for (const mode of [
    "现在就能做",
    "只差一样",
    "只差两样",
    "最匹配",
    "快手菜",
  ]) {
    await page.getByRole("button", { name: mode, exact: true }).click();
    const ids = await page
      .locator(".recipe-card")
      .evaluateAll((nodes) =>
        nodes.map((n) => n.getAttribute("data-recipe-id")),
      );
    if (mode !== "快手菜") expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      const r = verifiedRecipes.find((r) => r.id === id)!;
      const m = matchRecipe(r, [
        { ingredientId: "tomato" },
        { ingredientId: "egg" },
      ]);
      expect(m.selectedIngredientUsage).toBeGreaterThan(0);
      if (mode === "现在就能做") expect(m.missingCore).toBe(0);
      if (mode === "只差一样") expect(m.missingCore).toBe(1);
      if (mode === "只差两样") expect(m.missingCore).toBe(2);
      if (mode === "快手菜") {
        expect(r.totalTime).not.toBeNull();
        expect(r.totalTime!).toBeLessThanOrEqual(30);
      }
    }
  }
});
test("empty pantry offers both paths; all recipes search, filters and pagination work on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/pantry");
  await page.getByRole("button", { name: "清空厨房" }).click();
  await page.goto("/discover");
  await expect(
    page.getByRole("heading", { name: "先选择一些你手头有的食材" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "去选择食材" })).toBeVisible();
  await page.getByRole("link", { name: "浏览全部教程", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "全部教程", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(`共 ${verifiedRecipes.length} 道教程`, { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".recipe-card")).toHaveCount(24);
  await page.getByRole("button", { name: "加载更多", exact: true }).click();
  await expect(page.locator(".recipe-card")).toHaveCount(48);
  await page.getByLabel("搜索全部教程").fill("鸡蛋");
  await expect(page.locator(".recipe-card")).toHaveCount(24);
  const ids = await page
    .locator(".recipe-card")
    .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("data-recipe-id")));
  for (const id of ids)
    expect(
      searchRecipe(
        verifiedRecipes.find((r) => r.id === id)!,
        "鸡蛋",
      ),
    ).toBe(true);
  await page.getByLabel("搜索全部教程").fill("番茄炒蛋");
  await expect(
    page.getByRole("button", { name: recipe.title, exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("搜索全部教程")).toHaveValue("番茄炒蛋");
  await page.getByLabel("搜索全部教程").fill("");
  await expect(page.locator(".recipe-card")).toHaveCount(24);
  await page.getByLabel("教程来源").selectOption("HowToCook");
  await expect(page.locator(".result-count")).toContainText("365");
  await page.getByLabel("教程类别").selectOption("主食");
  await expect(page.locator(".recipe-card")).not.toHaveCount(0);
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 390);
  await expect(
    page.locator(".mobile-nav").getByRole("link", { name: "全部教程" }),
  ).toBeVisible();
  await page.locator(".mobile-more summary").click();
  await expect(
    page.locator(".mobile-more").getByRole("link", { name: "导入菜谱" }),
  ).toBeVisible();
  await page.screenshot({
    path: ".cache/phase31-recipes-mobile.png",
    fullPage: true,
  });
});
test("catalog alias opens attributed full tutorial and source-only never cooks", async ({
  page,
}) => {
  await page.goto("/recipes?q=番茄炒蛋");
  await page.getByRole("button", { name: recipe.title, exact: true }).click();
  await expect(page.getByRole("region", { name: "菜谱来源" })).toContainText(
    "HowToCook",
  );
  await page.getByRole("link", { name: "开始做菜" }).click();
  await expect(page.locator(".cooking-description")).toHaveText(
    recipe.instructions[0].description,
  );
  await page.goto(`/recipe/${encodeURIComponent(linked.id)}`);
  await expect(page.getByRole("link", { name: "开始做菜" })).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "查看原始教程", exact: true }),
  ).toHaveAttribute("href", linked.sourceUrl!);
});
test("device-only imported recipe waits for hydration and never calls server fallback", async ({
  page,
}) => {
  const imported = {
    ...recipe,
    id: "import:smoke-device-only",
    sourceProvider: "url-import",
    provenance: { ...recipe.provenance, type: "USER_IMPORTED" },
  };
  await page.goto("/pantry");
  await page.getByLabel("选择 KitchenMate 备份").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "kitchenmate-backup",
        version: 3,
        exportedAt: new Date().toISOString(),
        data: {
          pantry: [],
          shopping: [],
          saved: [imported],
          favorites: [],
          recentRecipeIds: [],
          dark: false,
        },
      }),
    ),
  });
  await page.getByRole("button", { name: "确认恢复" }).click();
  const fallback: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/recipes/import"))
      fallback.push(request.url());
  });
  await page.goto("/recipe/import%3Asmoke-device-only");
  await expect(
    page.getByRole("heading", { name: recipe.title, exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "开始做菜" }).click();
  await expect(page.locator(".cooking-description")).toHaveText(
    recipe.instructions[0].description,
  );
  await page.reload();
  await expect(page.locator(".cooking-description")).toHaveText(
    recipe.instructions[0].description,
  );
  expect(fallback).toEqual([]);
  await page.goto("/recipe/import%3Amissing");
  await expect(
    page.getByRole("link", { name: "返回发现菜谱", exact: true }),
  ).toBeVisible();
  expect(fallback).toEqual([]);
});
