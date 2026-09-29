import { describe, it, expect } from "vitest";
import { TheMealDBProvider } from "../lib/providers";
import { safeFetchHtml } from "../lib/safe-fetch";
describe.skipIf(process.env.LIVE_PROVIDER_TESTS !== "true")(
  "live public provider smoke checks",
  () => {
    it("fetches and normalizes official TheMealDB test response", async () => {
      const provider = new TheMealDBProvider();
      provider.key = "1";
      provider.enabled = true;
      const recipes = await provider.search("Arrabiata");
      expect(recipes[0].id).toBe("themealdb:52771");
      expect(recipes[0].ingredients.length).toBeGreaterThan(0);
      expect(recipes[0].instructions.length).toBeGreaterThan(0);
    }, 15000);
    it("uses pinned public DNS for HTTPS HTML", async () => {
      const result = await safeFetchHtml("https://example.com");
      expect(result.html).toContain("Example Domain");
    }, 15000);
  },
);
