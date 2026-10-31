/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}', 'api/**/*.ts'],
      exclude: ['src/test/**', 'src/main.tsx'],
      reporter: ['text', 'json', 'json-summary', 'lcov', 'html'],
      thresholds: {
        lines: 90, statements: 90, branches: 75, functions: 65,
        'src/services/**/*.ts': { lines: 95, statements: 95, branches: 75, functions: 95 },
        'src/store/**/*.ts': { lines: 95, statements: 95, branches: 75, functions: 90 },
      },
    },
  },
});
