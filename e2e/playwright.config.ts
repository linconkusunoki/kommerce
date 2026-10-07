import { defineConfig, devices } from "@playwright/test";
import { baseURL, isLocalTarget, localPort } from "./fixtures/env.ts";

const isLocal = isLocalTarget;

export default defineConfig({
  testDir: "./specs",
  // A remote target may be a cold instance that boots during the run.
  globalSetup: "./global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // A remote target on a free tier can drop a connection or stall, which fails
  // tests with no code defect behind them. Specs are idempotent — unique
  // fixtures, cleaned up in afterEach — so one retry absorbs that blip. Local
  // runs stay unretried so real bugs are not masked.
  retries: isLocal ? (process.env.CI ? 1 : 0) : 1,
  // A remote target shares one database, so keep those runs serial and avoid
  // destructive fixtures racing each other.
  workers: isLocal ? undefined : 1,
  reporter: process.env.CI ? [["github"], ["html", { outputFolder: "reports/e2e", open: "never" }]] : [["list"]],
  timeout: isLocal ? 60_000 : 120_000,
  expect: { timeout: isLocal ? 10_000 : 20_000 },

  use: {
    baseURL,
    // Traces are recorded for every test with `retain-on-failure` and then
    // thrown away, which races across parallel workers and fails tests in
    // teardown. Recording only on retry keeps failures debuggable
    // (`--retries=1`) without the churn. Screenshots are cheap and always kept.
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
    actionTimeout: isLocal ? 15_000 : 30_000,
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 720 } },
      testIgnore: /responsive\.spec\.ts/,
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
      testMatch: /responsive\.spec\.ts/,
    },
  ],

  // Only boot a server for local runs; a remote target is already listening.
  webServer: isLocal
    ? {
        command: `PORT=${localPort} bun run dev`,
        url: `${baseURL}/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
        stdout: "pipe",
      }
    : undefined,
});
