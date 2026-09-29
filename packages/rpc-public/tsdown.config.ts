import { defineConfig } from "tsdown";

export default defineConfig({
  entry: { index: "src/index.ts", utils: "src/utils/index.ts" },
  clean: true,
  dts: true,
  fixedExtension: true,
  format: "esm",
  hash: false,
  minify: false,
  outDir: "dist",
  platform: "neutral",
  publint: true,
  report: { brotli: true, gzip: true },
  sourcemap: true,
  target: "es2022",
  treeshake: true,
});
