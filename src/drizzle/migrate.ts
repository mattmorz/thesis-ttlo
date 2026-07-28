import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("❌ ERROR: DATABASE_URL environment variable is missing.");
    process.exit(1);
  }

  console.log("⏳ Connecting to PostgreSQL database for migrations...");
  
  // Use connection limit 1 for running migrations
  const sqlClient = postgres(connectionString, { max: 1 });
  const db = drizzle(sqlClient);

  console.log("⏳ Applying Drizzle ORM database migrations from ./src/drizzle/migrations ...");
  
  try {
    await migrate(db, { migrationsFolder: "./src/drizzle/migrations" });
    console.log("✅ Database migrations applied successfully!");
  } catch (error) {
    console.error("❌ Database migration error:", error);
    await sqlClient.end();
    process.exit(1);
  }

  await sqlClient.end();
  process.exit(0);
}

runMigrations();
