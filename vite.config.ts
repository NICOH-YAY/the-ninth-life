import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "./",
  build: { chunkSizeWarningLimit: 2000 },
  test: {
    include: ["tests/**/*.test.ts", "worker/test/**/*.test.ts"],
    environment: "node",
  },
});
