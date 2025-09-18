import { sql } from "drizzle-orm";
import { pgTable } from "drizzle-orm/pg-core";
import fs from "fs";
import path from "path";

export async function up(db: any) {
  // First create the tables defined in schema.ts
  console.log("Creating form integration tables...");

  // Apply schema changes from schema.ts (these are already defined there)
  // The migration system will detect and create:
  // - formSourceTypeEnum
  // - formSubmissionStatusEnum
  // - formSubmissionRegistry table
  // - formDataMapping table
  // - ipApplicationNotification table

  // Now apply the trigger function from our SQL file
  console.log("Creating form submission trigger function...");
  const triggerSqlPath = path.join(
    __dirname,
    "scripts",
    "create_form_submission_triggers.sql"
  );
  const triggerSql = fs.readFileSync(triggerSqlPath, "utf8");

  // Execute the SQL script
  await db.execute(sql.raw(triggerSql));

  console.log("Form integration setup complete.");
}

export async function down(db: any) {
  console.log("Removing form integration...");

  // Drop triggers first
  await db.execute(
    sql`DROP TRIGGER IF EXISTS after_form_submission_update ON form_submission_registry`
  );
  await db.execute(
    sql`DROP TRIGGER IF EXISTS after_form_submission_insert ON form_submission_registry`
  );

  // Drop the trigger function
  await db.execute(sql`DROP FUNCTION IF EXISTS process_form_submission()`);

  // Drop tables (will be handled by the migration system based on schema.ts changes)
  // The migration system will drop:
  // - ipApplicationNotification table
  // - formDataMapping table
  // - formSubmissionRegistry table
  // - formSubmissionStatusEnum
  // - formSourceTypeEnum

  console.log("Form integration removal complete.");
}
