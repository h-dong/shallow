import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "vitest/index": "src/vitest/index.ts",
  },
  clean: true,
  dts: {
    compilerOptions: {
      ignoreDeprecations: "6.0",
    },
  },
  external: ["react", "vitest"],
  format: ["esm"],
  sourcemap: true,
  splitting: false,
  target: "es2022",
});
