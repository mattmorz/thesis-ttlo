import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/drizzle/schema";
import * as relations from "@/drizzle/relations";

// Create a PostgreSQL client for Edge Runtime
const client = postgres(process.env.DATABASE_URL!, {
  max: 1,
  ssl: {
    rejectUnauthorized: false,
  },
  prepare: false,
});

// Create a Drizzle instance
export const edge = drizzle(client, {
  schema: { ...schema, ...relations },
});

// Export the client for use in Edge Runtime
export const queryClient = client;
