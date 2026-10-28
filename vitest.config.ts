import { configDefaults, defineConfig } from 'vitest/config';

// Two projects: the jsdom unit tests (default 5s test timeout) and the pact
// contract tests (node, longer timeout because every interaction spawns a mock
// provider). `pnpm test:unit` and `pnpm test:contracts` pick one each; plain
// `pnpm test` runs both.
export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          exclude: [...configDefaults.exclude, 'tests/contracts/**'],
        },
      },
      {
        extends: true,
        test: {
          name: 'contracts',
          environment: 'node',
          include: ['tests/contracts/**/*.test.ts'],
          testTimeout: 30000,
        },
      },
    ],
  },
});
