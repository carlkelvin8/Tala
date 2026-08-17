import { defineConfig } from "vitest/config"
import "dotenv/config"

// Integration tests may mutate data, so prefer a dedicated test database whenever supplied.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
}

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    sequence: { concurrent: false },
  },
})
