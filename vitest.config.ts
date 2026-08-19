import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Unit tests run in a plain Node environment and need no database. They live
// next to the code as `*.test.ts`. Database-backed integration tests live in
// `tests/integration/` and are excluded here — run them with
// `npm run test:integration` (needs a DATABASE_URL and a pushed schema).
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["node_modules", ".next", "tests/integration/**"],
  },
});
