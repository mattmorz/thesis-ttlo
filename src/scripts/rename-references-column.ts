import { db } from "../drizzle/db";
import { sql } from "drizzle-orm";

async function renameReferencesColumn() {
  console.log("Starting migration to rename 'references' column...");

  try {
    // Rename the column
    await db.execute(
      sql`ALTER TABLE "patent_utility_model_application" RENAME COLUMN "references" TO "literature_references"`
    );

    console.log("Column renamed successfully");

    // Add a comment to document the change
    await db.execute(
      sql`COMMENT ON COLUMN "patent_utility_model_application"."literature_references" IS 'Literature references including patent applications, key scientific literature and/or public oral communications. Renamed from "references" to avoid SQL keyword conflict.'`
    );

    console.log("Column comment added successfully");

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    process.exit(0);
  }
}

// Run the migration
renameReferencesColumn();
