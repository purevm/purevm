import { defineConfig, type ViteUserConfig } from "vitest/config";

/**
 * Two projects: `unit` (`*.test.ts`, no real external dependency) and `integ` (`*.integ.ts`,
 * real RPCs and services, with their requirements documented in each file).
 */
const config: ViteUserConfig = defineConfig({
  test: {
    projects: [
      { extends: true, test: { name: "unit", include: ["src/**/__tests__/**/*.test.ts"] } },
      { extends: true, test: { name: "integ", include: ["src/**/__tests__/**/*.integ.ts"] } },
    ],
  },
});

export default config;
