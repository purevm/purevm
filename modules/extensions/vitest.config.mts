import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: ["**/__tests__/**", "**/index.ts", "scripts/**", "types.ts", "vitest.config.mts"],
      include: ["modules/extensions/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json-summary", "html", "lcov"],
      reportsDirectory: "modules/extensions/coverage",
      thresholds: { branches: 90, functions: 90, lines: 90, statements: 90 },
    },
    include: ["modules/extensions/**/__tests__/*.test.ts"],
  },
});
