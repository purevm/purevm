import type { UserConfig } from "tsdown";

/**
 * ESM for Node 26 with `.d.ts` from oxc: fast, and exact because `pnpm typecheck` enforces
 * isolatedDeclarations. Dependencies stay external: consumers install them.
 */
const config: UserConfig = {
  entry: {
    index: "src/index.ts",
  },
  format: "esm",
  platform: "node",
  target: "node26",
  outDir: "dist",
  clean: true,
  dts: { generator: "oxc" },
};

export default config;
