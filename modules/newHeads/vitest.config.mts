import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: ["**/__tests__/**", "index.ts", "types.ts", "vitest.config.mts"],
      include: ["modules/newHeads/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json-summary", "html", "lcov"],
      reportsDirectory: "modules/newHeads/coverage",
      thresholds: { branches: 90, functions: 90, lines: 90, statements: 90 },
    },
    include: ["modules/newHeads/**/__tests__/*.test.ts"],
  },
});
