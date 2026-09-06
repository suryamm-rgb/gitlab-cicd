import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettierConfig from 'eslint-config-prettier'

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',

      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-duplicate-imports': 'error',
      'no-unreachable': 'error',
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',

      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
    },
  },

  // Must stay LAST — disables formatting rules that conflict with Prettier
  prettierConfig,

  globalIgnores(['.next/**', 'out/**', 'build/**', 'node_modules/**', 'next-env.d.ts']),
])
