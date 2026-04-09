import { defineConfig } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5174'
const apiURL = process.env.PLAYWRIGHT_API_URL || '/api/v1'

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  workers: 1,
  use: {
    baseURL,
    headless: true,
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `VITE_API_URL=${apiURL} npm run dev -- --host 127.0.0.1 --port 5174`,
        port: 5174,
        reuseExistingServer: true,
      },
})
