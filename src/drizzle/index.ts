import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import * as relations from "./relations";
import "dotenv/config";

// Create a PostgreSQL client
const client = postgres(process.env.DATABASE_URL || "");

// Create your database instance with both schema and relations
export const db = drizzle(client, { schema: { ...schema, ...relations } });

// Export the schema and relations for reference
export { schema, relations };
