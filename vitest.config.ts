import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    server: { deps: { inline: ["next-auth"] } },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
      // Next.js resolves this marker itself; Node-side tests need an inert module.
      "server-only": resolve(__dirname, "test/server-only.ts"),
    },
  },
});
