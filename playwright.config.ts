import { defineConfig } from "@playwright/test";

/** Smoke tests against the app in mock mode. Uses the installed Chrome, so no browser download is needed. */
const PORT = Number(process.env.E2E_PORT ?? 3200);

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  retries: 0,
  use: { baseURL: `http://localhost:${PORT}`, channel: "chrome", headless: true, trace: "retain-on-failure" },
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: true,
    timeout: 180_000,
    env: { NEXT_PUBLIC_API_MODE: "mock" },
  },
});
