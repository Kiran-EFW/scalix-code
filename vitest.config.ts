import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.spec.ts',
        '**/*.test.ts',
      ],
    },
    include: ['**/*.spec.ts', '**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@scalix/core': path.resolve(__dirname, './core/src'),
      '@scalix/sdk': path.resolve(__dirname, './packages/sdk/src'),
      '@scalix/schemas': path.resolve(__dirname, './packages/schemas/src'),
      '@scalix/utils': path.resolve(__dirname, './packages/utils/src'),
      '@scalix/types': path.resolve(__dirname, './packages/types/src'),
    },
  },
});
