import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
config();

export default defineConfig({
  out: "./src/drizzle/migrations",
  schema: "./src/drizzle/migrations/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
