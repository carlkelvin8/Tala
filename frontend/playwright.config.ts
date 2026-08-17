import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    { command: "npm run dev -- --host 127.0.0.1", url: "http://127.0.0.1:5173/login", reuseExistingServer: !process.env.CI, timeout: 120_000, env: { VITE_API_URL: "http://127.0.0.1:4000" } },
    { command: "npm run dev", cwd: "../backend", url: "http://127.0.0.1:4000/", reuseExistingServer: !process.env.CI, timeout: 120_000, env: { CORS_ORIGIN: "http://127.0.0.1:5173,http://localhost:5173" } },
  ],
})
