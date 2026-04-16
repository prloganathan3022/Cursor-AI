import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const sharedTestConfig = {
  environment: 'jsdom' as const,
  globals: false as const,
  setupFiles: ['./src/test/setupTests.ts'] as string[],
  exclude: ['e2e/**', 'node_modules/**'] as string[],
}

/**
 * Frontend automated tests (Vitest + jsdom).
 *
 * - project `unit` — fast, isolated checks (pure logic, single module).
 * - project `integration` — multiple modules / browser-ish APIs (fetch, Router, context).
 *
 * E2E lives under e2e/ and runs via Playwright (real browser + dev server).
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    coverage: {
      provider: 'v8' as const,
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.unit.test.{ts,tsx}',
        'src/**/*.integration.test.{ts,tsx}',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 80,
      },
    },
    projects: [
      {
        extends: true,
        test: {
          ...sharedTestConfig,
          name: 'unit',
          include: ['src/**/*.unit.test.{ts,tsx}'],
        },
      },
      {
        extends: true,
        test: {
          ...sharedTestConfig,
          name: 'integration',
          include: ['src/**/*.integration.test.{ts,tsx}'],
        },
      },
    ],
  },
})
