import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
// BASE_URL=https://… npm test runs the suite against a deployed site instead.
const BASE_URL = process.env.BASE_URL;

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: BASE_URL || `http://localhost:${PORT}` },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 375, height: 812 } } },
    { name: 'iphone-webkit', use: { ...devices['iPhone 13'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 1280, height: 800 } } },
  ],
  // Test the production build, which is what Cloudflare Pages serves.
  webServer: BASE_URL
    ? undefined
    : {
        command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
        port: PORT,
        reuseExistingServer: !process.env.CI,
      },
});
