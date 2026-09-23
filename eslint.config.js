import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** Packages the inner layers (domain, application) must not import. */
const FRAMEWORKS = ['fastify', '@fastify/*', 'zod', 'resend', 'pino', '@sentry/*', '@logtail/*'];
const OUTER_LAYERS_FROM_APPLICATION = [
  '**/infrastructure/**',
  '**/interface/**',
  '**/platform/**',
  '**/app.ts',
];
const OUTER_LAYERS_FROM_DOMAIN = ['**/application/**', ...OUTER_LAYERS_FROM_APPLICATION];

export default defineConfig(
  { ignores: ['**/node_modules/'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: { globals: globals.node },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  // DDD layering: dependencies point inward only (see CONTEXT.md).
  {
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: OUTER_LAYERS_FROM_DOMAIN, message: 'domain must not depend on outer layers.' },
            { group: FRAMEWORKS, message: 'domain must stay framework-free.' },
          ],
        },
      ],
    },
  },
  {
    files: ['src/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: OUTER_LAYERS_FROM_APPLICATION,
              message: 'application may depend on domain only; adapters live in infrastructure.',
            },
            { group: FRAMEWORKS, message: 'application must stay framework-free.' },
          ],
        },
      ],
    },
  },
  {
    // Config is loaded and validated once in main.ts; everything else receives it.
    files: ['src/**/*.ts'],
    ignores: ['src/main.ts', 'src/platform/config.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        { object: 'process', property: 'env', message: 'Read env in main.ts and inject it.' },
      ],
    },
  },
);
