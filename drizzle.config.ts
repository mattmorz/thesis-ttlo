export default {
  out: "./src/drizzle/migrations",
  schema: "./src/drizzle/migrations/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
};
