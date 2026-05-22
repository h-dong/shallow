import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./setupTest.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts", "src/types.ts", "src/vitest/index.ts"],
      thresholds: {
        lines: 95,
        functions: 95,
        statements: 95,
        branches: 90,
      },
    },
  },
});
