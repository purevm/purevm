import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: ["**/__tests__/**", "index.ts", "types.ts", "vitest.config.mts"],
      include: ["modules/fetchBlocks/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json-summary", "html", "lcov"],
      reportsDirectory: "modules/fetchBlocks/coverage",
      thresholds: { branches: 90, functions: 90, lines: 90, statements: 90 },
    },
    include: ["modules/fetchBlocks/**/__tests__/*.test.ts"],
  },
});
