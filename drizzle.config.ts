import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "turso",
  schema: "./lib/db/schema.ts",
  out: "./migrations",
  dbCredentials: {
    url:
      process.env.TURSO_DATABASE_URL ||
      process.env.DATABASE_URL ||
      "file:local.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
