import { defineConfig } from "tsdown";

export default defineConfig({
    entry: ["src/index.ts"],
    format: ["esm"],
    target: "es2022",
    outDir: "dist",
    clean: true,
    dts: true,
    sourcemap: true,
    minify: true,
    outputOptions: {
        keepNames: true,
    },
});
