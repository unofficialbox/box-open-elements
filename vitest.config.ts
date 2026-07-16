import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "http://localhost/",
      },
    },
    include: ["test/**/*.test.ts", "packages/*/test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      // Floors justified by docs/coverage-baseline.md (measured 2026-07-16).
      // Raise only after a fresh measurement — do not treat these as the
      // per-change quality target (see AGENTS.md: 85%+ on new logic).
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 85,
        branches: 65,
      },
    },
  },
});
