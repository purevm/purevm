import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: ["src/**/__tests__/**", "src/**/index.ts", "src/types/**"],
      include: [
        "src/actions/**/*.ts",
        "src/clients/base-client.ts",
        "src/clients/http-client.ts",
        "src/clients/websocket-client.ts",
        "src/utils/**/*.ts",
      ],
      provider: "v8",
      reporter: ["text", "json-summary", "html", "lcov"],
      reportsDirectory: "coverage",
      thresholds: { branches: 80, functions: 90, lines: 90, statements: 90 },
    },
    projects: [
      {
        test: {
          name: "unit",
          include: ["src/**/__tests__/*.test.ts"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
      {
        test: {
          name: "integration",
          include: ["src/**/__tests__/*.integ.ts"],
          setupFiles: ["./vitest.integ.setup.ts"],
          testTimeout: 180_000,
        },
      },
    ],
  },
});
