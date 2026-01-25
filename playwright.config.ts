/**
 * Playwright Configuration for Visual Regression Testing
 *
 * Used for visual verification of Expo web builds.
 * Run: npx playwright test
 * Update baselines: npx playwright test --update-snapshots
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:8081',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // iPhone 15 Pro dimensions for iOS app simulation
        viewport: { width: 393, height: 852 },
      },
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 15 Pro'],
      },
    },
  ],

  // Expo web server
  webServer: {
    command: 'npx expo start --web --port 8081',
    url: 'http://localhost:8081',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
