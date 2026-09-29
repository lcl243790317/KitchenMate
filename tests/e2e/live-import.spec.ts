import { test, expect } from "@playwright/test";
test.skip(process.env.LIVE_IMPORT_E2E !== "true", "Explicit live external verification only");
for (const [url,title] of [
  ["https://www.budgetbytes.com/garlic-noodles/","Quick & Easy Garlic Noodles"],
  ["https://www.bbcgoodfood.com/recipes/best-ever-chocolate-brownies-recipe","Best ever chocolate brownies recipe"],
  ["https://www.gimmesomeoven.com/fried-rice-recipe/","Fried Rice"],
]) test(`real browser imports ${title} and opens source cooking steps`, async({page})=>{
  await page.goto('/import');await page.getByLabel('菜谱网址').fill(url);await page.getByRole('button',{name:'分析并导入'}).click();
  await expect(page.getByRole('region',{name:'导入预览'})).toContainText(title,{timeout:25000});
  await page.getByRole('button',{name:'保存到我的菜谱'}).click();await page.reload();
  await page.getByRole('link',{name:'发现菜谱',exact:true}).first().click();await page.getByRole('button',{name:'我的导入',exact:true}).click();
  await page.getByRole('button',{name:title,exact:true}).click();await expect(page.getByRole('region',{name:'菜谱来源'})).toContainText('USER_IMPORTED');
  await page.getByRole('link',{name:'开始做菜'}).click();await expect(page.locator('.cooking-description')).not.toBeEmpty();
});
