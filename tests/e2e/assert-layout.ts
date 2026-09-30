import { expect, type Page } from "@playwright/test";

export async function expectNoHorizontalOverflow(page: Page) {
  // Native vertical scrollbars reduce clientWidth in headed Windows Chrome.
  // Test the actual scrollable viewport, rather than assuming a 390px content area.
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    )
    .toBe(true);
}
