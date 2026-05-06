import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
    env: {
      JWT_SECRET: 'test-secret-must-be-at-least-32-chars-long',
      DATABASE_URL: 'file:./dev.db',
    },
  },
})
