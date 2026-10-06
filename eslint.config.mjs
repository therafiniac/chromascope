import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import jsxA11yX from 'eslint-plugin-jsx-a11y-x';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      'dist/',
      '.astro/',
      'node_modules/',
      'playwright-report/',
      'test-results/',
      '.lighthouseci/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  ...astro.configs['jsx-a11y-recommended'],
  {
    files: ['commitlint.config.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { module: 'writable' },
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: { URL: 'readonly', console: 'readonly', process: 'readonly' },
    },
  },
  {
    files: ['public/sw.js'],
    languageOptions: {
      globals: {
        self: 'readonly',
        caches: 'readonly',
        fetch: 'readonly',
        Request: 'readonly',
        URL: 'readonly',
      },
    },
  },
  {
    files: ['**/*.{jsx,tsx}'],
    ...jsxA11yX.configs.recommended,
  },
];
