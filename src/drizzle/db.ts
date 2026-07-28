import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/drizzle/migrations/schema";
import * as relations from "@/drizzle/migrations/relations";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";

// Define the full DB type for better type safety
export type DB = PostgresJsDatabase<typeof schema & typeof relations>;

// Check if we're running on the server
const isServer = typeof window === "undefined";

// Only create a client and connect to the database on the server side
let client: postgres.Sql | undefined;
// Type annotation makes TypeScript understand db is DB type or a mock with similar shape
let db: DB;

if (isServer) {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgres://postgres:postgres@localhost:5432/build_db_placeholder";

  if (!process.env.DATABASE_URL) {
    console.warn(
      "⚠️ DATABASE_URL is not set. Using build placeholder connection string for static analysis."
    );
  }

  // Create a PostgreSQL client with connection pooling
  client = postgres(connectionString, {
    max: 10, // Increased pool size
    ssl:
      process.env.DATABASE_URL?.includes("localhost") ||
      process.env.DATABASE_URL?.includes("127.0.0.1")
        ? false
        : {
            rejectUnauthorized: false,
          },
    idle_timeout: 20,
    connect_timeout: 10,
    max_lifetime: 60 * 30, // 30 minutes
    prepare: false, // Disable prepared statements for better compatibility
    debug: process.env.NODE_ENV === "development",
  });

  // Create a Drizzle instance
  db = drizzle(client, {
    schema: { ...schema, ...relations },
    logger: process.env.NODE_ENV === "development" ? true : false,
  });
} else {
  // For client-side, create a mock or stub implementation
  // This prevents the 'net' module import error in the browser
  db = {
    query: {
      // Add stub methods for common queries to prevent runtime errors
      ipApplication: {
        findMany: async () => [],
        findFirst: async () => null,
      },
      formSubmissionRegistry: {
        findFirst: async () => null,
      },
    },
    insert: () => ({
      values: () => ({
        returning: async () => [{}],
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: async () => [{}],
        }),
      }),
    }),
    delete: () => ({
      where: async () => ({}),
    }),
    select: () => ({
      from: () => ({
        where: () => [{} as any],
        orderBy: () => [{} as any],
      }),
    }),
  } as unknown as DB;
}

// Export the Drizzle instance with schema
export { db };

// Export the client for use in migrations or direct queries if needed
export const queryClient = client;
