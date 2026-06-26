import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  webServer: [
    {
      command:
        process.env.PLAYWRIGHT_API_SERVER_COMMAND ??
        "python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --app-dir ../api",
      url: process.env.PLAYWRIGHT_API_HEALTH_URL ?? "http://127.0.0.1:8000/health",
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ?? "npm run dev",
      url: `${baseURL}/student`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
});
