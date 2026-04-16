import js from '@eslint/js'
import vitest from '@vitest/eslint-plugin'
import globals from 'globals'
import playwright from 'eslint-plugin-playwright'
import pluginSecurity from 'eslint-plugin-security'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['vite.config.ts', 'vitest.config.ts'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      pluginSecurity.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.node.json',
        tsconfigRootDir: import.meta.dirname,
      },
      globals: globals.node,
    },
  },
  {
    files: ['scripts/**/*.{mjs,cjs,js}'],
    extends: [js.configs.recommended, pluginSecurity.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.node,
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    files: ['e2e/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './e2e/tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: [
      'src/**/*.unit.test.{ts,tsx}',
      'src/**/*.integration.test.{ts,tsx}',
      'src/test/**/*.ts',
    ],
    plugins: { vitest },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.app.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...vitest.configs.recommended.rules,
    },
  },
  {
    files: ['src/context/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
