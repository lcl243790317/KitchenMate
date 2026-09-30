import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000",
    headless: true,
    channel:
      process.env.PLAYWRIGHT_CHANNEL ||
      (process.env.CI ? "chromium" : "chrome"),
  },
  workers: 1,
  reporter: "list",
  webServer: process.env.CI
    ? {
        command: "pnpm start --port 3000",
        url: "http://127.0.0.1:3000/api/health",
        reuseExistingServer: false,
        timeout: 120000,
      }
    : undefined,
});
