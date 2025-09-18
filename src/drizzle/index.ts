import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./migrations/schema";
import * as customRelations from "./relations";

// Import all relations from the schema
import * as schemaRelations from "./migrations/relations";

// Combine all relations, with custom relations taking precedence
const relations = { ...schemaRelations, ...customRelations };

// Create a PostgreSQL client
const client = postgres(process.env.DATABASE_URL || "");

// Create your database instance with both schema and relations
export const db = drizzle(client, { schema: { ...schema, ...relations } });

// Export the schema and relations for reference
export { schema, relations };
