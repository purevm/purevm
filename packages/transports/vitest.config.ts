import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["tests/e2e/**"],
    projects: [
      {
        test: {
          name: "unit",
          include: ["src/**/__tests__/*.test.ts"],
          exclude: ["**/*.integration.test.ts"],
        },
      },
      {
        test: {
          name: "integration",
          include: ["src/**/__tests__/*.integration.test.ts"],
        },
      },
    ],
  },
});
