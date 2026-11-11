import { defineConfig, devices } from '@playwright/test';

/**
 * E2E runs against the production build served by `vite preview`.
 * `npm run test:e2e` builds first. M0 runs Chromium; set ALL_BROWSERS=1 for Firefox + WebKit
 * (needs `npx playwright install firefox webkit` and their system libraries).
 */
const all = process.env.ALL_BROWSERS === '1';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4173' },
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
    ...(all
      ? [
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit', use: { ...devices['Desktop Safari'] } },
        ]
      : []),
  ],
});
