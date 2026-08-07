import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Mirrors the `@/*` path alias in tsconfig.json so tests can import modules
  // that reach into the app (route handlers, queries) and not just leaf helpers.
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
