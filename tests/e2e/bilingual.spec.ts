import { test, expect } from "@playwright/test";
import { verifiedRecipes } from "../../lib/verified-recipes";
import { localizedInstructions } from "../../lib/recipe-localization";
import { expectNoHorizontalOverflow } from "./assert-layout";
import { expectSavedCookingStep } from "./cooking-snapshot";
const samples = [
  "煎鸡蛋",
  "鸡肉炒饭",
  "烤鸡胸肉",
  "烤土豆",
  "蔬菜汤",
  "芝士鸡肉意面",
  "微波炒鸡蛋",
  "微波燕麦粥",
  "芝士酿番茄",
  "煎香蕉",
];
test("unresolved source ingredient stays original and fits 390px before hydration", async ({
  browser,
}) => {
  const context = await browser.newContext({
    baseURL: test.info().project.use.baseURL,
    viewport: { width: 390, height: 844 },
    javaScriptEnabled: false,
  });
  try {
    const page = await context.newPage();
    await page.goto("/recipe/" + encodeURIComponent("commons:77826608"));
    await expect(
      page.getByRole("heading", { name: "讃岐乌冬面", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".ingredient-list")).toContainText(
      "Udon soup (soy sauce, sweet sake,  seaweed and bonito broth)",
    );
    await expectNoHorizontalOverflow(page);
  } finally {
    await context.close();
  }
});
test("ten actual Wikibooks recipes default to faithful Chinese with inline original at 390px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const title of samples) {
    const r = verifiedRecipes.find(
      (r) => r.title === title && r.sourceProvider === "wikibooks",
    )!;
    await page.goto("/recipe/" + encodeURIComponent(r.id));
    await expect(
      page.locator(".instructions article").first().locator("p"),
    ).toHaveText(localizedInstructions(r, "zh")[0].description);
    await expect(page.getByRole("region", { name: "菜谱来源" })).toContainText(
      "中文翻译：KitchenMate",
    );
    await expect(page.getByRole("region", { name: "菜谱来源" })).toContainText(
      "CC BY-SA 4.0",
    );
    const schema = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').textContent())!,
    );
    expect(
      schema.recipeInstructions.map((s: { text: string }) => s.text),
    ).toEqual(r.instructions.map((s) => s.description));
    await page
      .getByRole("button", { name: "英文原文步骤", exact: true })
      .click();
    await expect(
      page.locator(".instructions article").first().locator("p"),
    ).toHaveText(r.instructions[0].description);
    await page.getByRole("button", { name: "中文步骤", exact: true }).click();
    await expect(
      page.locator(".instructions article").first().locator("p"),
    ).toHaveText(localizedInstructions(r, "zh")[0].description);
    await expectNoHorizontalOverflow(page);
  }
});
test("language switch preserves cooking step, timer and durable original snapshot", async ({
  page,
}) => {
  const r = verifiedRecipes.find((r) => r.title === "鸡肉炒饭")!;
  await page.goto("/recipe/" + encodeURIComponent(r.id) + "/cook");
  await expect(page.locator(".cooking-description")).toHaveText(
    localizedInstructions(r, "zh")[0].description,
  );
  await expectSavedCookingStep(page, r.id, 0);
  await page.evaluate(async (recipe) => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("kitchenmate");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("cooking", "readwrite");
        tx.objectStore("cooking").put(
          {
            recipeId: recipe.id,
            recipe,
            step: 1,
            done: false,
            timers: [
              { id: 314, title: "保留计时器", end: Date.now() + 120000 },
            ],
            updatedAt: new Date().toISOString(),
          },
          recipe.id,
        );
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
    });
  }, r);
  await page.reload();
  await expect(page.locator(".cooking-description")).toHaveText(
    localizedInstructions(r, "zh")[1].description,
  );
  await expect(page.locator(".timer-list")).toContainText("保留计时器");
  const remaining = await page.locator(".timer-list b").textContent();
  await page.getByRole("button", { name: "英文原文步骤", exact: true }).click();
  await expect(page.locator(".cooking-description")).toHaveText(
    r.instructions[1].description,
  );
  await expect(page.locator(".timer-list")).toContainText("保留计时器");
  await page.getByRole("button", { name: "中文步骤", exact: true }).click();
  await expect(page.locator(".cooking-description")).toHaveText(
    localizedInstructions(r, "zh")[1].description,
  );
  await expectSavedCookingStep(page, r.id, 1);
  expect(await page.locator(".timer-list b").textContent()).not.toBe(
    "时间到！",
  );
  expect(remaining).toBeTruthy();
  await page.getByRole("button", { name: "下一步", exact: true }).click();
  await expectSavedCookingStep(page, r.id, 2);
  await page.reload();
  await expect(page.locator(".cooking-description")).toHaveText(
    localizedInstructions(r, "zh")[2].description,
  );
});
test("four previously empty exact ingredients now have full tutorials and keep back state", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [query, id] of [
    ["蛤蜊", "zh:蛤蜊"],
    ["甜玉米", "zh:甜玉米"],
    ["乌冬面", "zh:乌冬面"],
    ["杏鲍菇", "zh:杏鲍菇"],
  ]) {
    await page.goto("/recipes?q=" + encodeURIComponent(query));
    const r = verifiedRecipes.find(
      (r) =>
        r.instructionAvailability === "full" &&
        r.ingredients.some((i) => i.ingredientId === id),
    )!;
    const card = page.locator(`[data-recipe-id="${r.id}"]`);
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: "查看教程 →" }).click();
    await expect(page.locator("a.back")).toHaveText("返回全部教程");
    await expect(
      page.getByRole("link", { name: "开始做菜", exact: true }),
    ).toBeVisible();
    await page.locator("a.back").click();
    await expect(page.getByLabel("搜索全部教程")).toHaveValue(query);
    await expect(card).toBeInViewport();
    await expectNoHorizontalOverflow(page);
  }
});
test("new English open sources support Chinese cooking and source-only continues to prohibit it", async ({
  page,
}) => {
  for (const provider of ["based-cooking", "commons"]) {
    const r = verifiedRecipes.find((r) => r.sourceProvider === provider)!;
    await page.goto("/recipe/" + encodeURIComponent(r.id));
    await expect(page.getByRole("region", { name: "菜谱来源" })).toContainText(
      r.sourceName,
    );
    await expect(page.getByRole("region", { name: "菜谱来源" })).toContainText(
      "中文翻译：KitchenMate",
    );
    await page.getByRole("link", { name: "开始做菜", exact: true }).click();
    await expect(page.locator(".cooking-description")).toHaveText(
      localizedInstructions(r, "zh")[0].description,
    );
    await page
      .getByRole("button", { name: "英文原文步骤", exact: true })
      .click();
    await expect(page.locator(".cooking-description")).toHaveText(
      r.instructions[0].description,
    );
  }
  const linked = verifiedRecipes.find(
    (r) => r.instructionAvailability === "source-only",
  )!;
  await page.goto("/recipe/" + encodeURIComponent(linked.id));
  await expect(
    page.getByRole("link", { name: "开始做菜", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "查看原始教程", exact: true }),
  ).toBeVisible();
});
