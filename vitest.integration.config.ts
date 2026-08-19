import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Database-backed integration tests. These need a real Postgres (DATABASE_URL)
// with the schema already pushed. Run via `npm run test:integration`.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    fileParallelism: false, // share one database sequentially
    hookTimeout: 30_000,
    testTimeout: 30_000,
  },
});
