import { test, expect } from "@playwright/test";
import { verifiedRecipes } from "../../lib/verified-recipes";
import { beginnerSignals } from "../../lib/beginner-recipes";
import { expectNoHorizontalOverflow } from "./assert-layout";
const wiki = verifiedRecipes.find((r) => r.title === "鸡肉炒饭")!;
test("beginner and quick browse filters retain URL and back position at 390px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/recipes?beginner=true");
  await expect(page.getByRole("checkbox", { name: "简单易做" })).toBeChecked();
  await expect(page.locator(".recipe-card")).toHaveCount(24);
  const ids = await page
    .locator(".recipe-card")
    .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("data-recipe-id")));
  for (const id of ids)
    expect(
      beginnerSignals(verifiedRecipes.find((r) => r.id === id)!)
        .beginnerFriendly,
    ).toBe(true);
  await page.getByLabel("教程来源").selectOption("Wikibooks Cookbook");
  const card = page.locator(".recipe-card").nth(18);
  const id = await card.getAttribute("data-recipe-id");
  await card.scrollIntoViewIfNeeded();
  const y = await page.evaluate(() => scrollY);
  await card.getByRole("button", { name: "查看教程 →" }).click();
  await expect(page.getByRole("link", { name: "返回全部教程" })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("checkbox", { name: "简单易做" })).toBeChecked();
  await expect(page.getByLabel("教程来源")).toHaveValue("Wikibooks Cookbook");
  await expect(page.locator(`[data-recipe-id="${id}"]`)).toBeInViewport();
  await expect
    .poll(() => page.evaluate(() => scrollY))
    .toBeGreaterThan(y - 200);
  await page.getByRole("checkbox", { name: "30分钟内" }).check();
  await expect(page).toHaveURL(/quick=true/);
  await expectNoHorizontalOverflow(page);
});
test("Wikibooks Chinese and English search opens licensed source and cooking mode", async ({
  page,
}) => {
  await page.goto("/recipes");
  await page.getByLabel("搜索全部教程").fill("鸡肉炒饭");
  await page.getByRole("button", { name: "鸡肉炒饭", exact: true }).click();
  await expect(page.getByText("CC BY-SA 4.0", { exact: true })).toBeVisible();
  await expect(
    page.getByText("中文菜名翻译：KitchenMate", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: wiki.provenance.sourceRevision!,
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: "开始做菜" }).click();
  await expect(page).toHaveURL(/\/cook$/);
  await expect(page.locator(".cooking-description")).toHaveText(
    wiki.instructions[0].description,
  );
});
test("new commercial source keeps original link and forbids cooking mode", async ({
  page,
}) => {
  const r = verifiedRecipes.find(
    (r) =>
      r.sourceName === "Love and Lemons" &&
      r.instructionAvailability === "source-only",
  )!;
  await page.goto("/recipe/" + encodeURIComponent(r.id));
  await expect(
    page.getByRole("link", { name: "查看原始教程", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "开始做菜" })).toHaveCount(0);
});
