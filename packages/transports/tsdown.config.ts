import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  clean: true,
  dts: true,
  fixedExtension: true,
  format: "esm",
  hash: false,
  minify: false,
  outDir: "dist",
  platform: "neutral",
  publint: true,
  attw: {
    level: "error",
    profile: "esm-only",
  },
  report: {
    brotli: true,
    gzip: true,
  },
  sourcemap: true,
  target: "es2022",
  treeshake: true,
});
