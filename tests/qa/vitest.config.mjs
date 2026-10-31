import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["integration/*.test.mjs"],
    fileParallelism: false,
    testTimeout: 45000,
    hookTimeout: 45000,
    environment: "node",
    reporters: ["default"]
  }
});
