import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/e2e/**"],
    coverage: {
      provider: "v8",
      include: ["src/lib/scoring/**"],
      exclude: ["src/lib/scoring/index.ts"],
      thresholds: {
        "src/lib/scoring/accuracy.ts": { statements: 100, branches: 100, functions: 100 },
        "src/lib/scoring/risk-adjusted.ts": { statements: 90, branches: 90, functions: 100 },
        "src/lib/scoring/consistency.ts": { statements: 90, branches: 90, functions: 100 },
        "src/lib/scoring/volume-factor.ts": { statements: 100, branches: 100, functions: 100 },
        "src/lib/scoring/composite.ts": { statements: 90, branches: 90, functions: 100 },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
