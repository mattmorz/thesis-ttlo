import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

type JournalEntry = {
  when: number;
  tag: string;
};

type MigrationFile = {
  hash: string;
  createdAt: number;
};

function readMigrationFiles(): MigrationFile[] {
  const migrationsFolder = path.join(process.cwd(), "src/drizzle/migrations");
  const journalPath = path.join(migrationsFolder, "meta/_journal.json");

  if (!fs.existsSync(journalPath)) {
    throw new Error(`Can't find ${journalPath}`);
  }

  const journal = JSON.parse(fs.readFileSync(journalPath, "utf8")) as {
    entries: JournalEntry[];
  };

  return journal.entries.map((entry) => {
    const migrationPath = path.join(migrationsFolder, `${entry.tag}.sql`);

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Missing migration file: ${migrationPath}`);
    }

    const query = fs.readFileSync(migrationPath, "utf8");

    return {
      createdAt: entry.when,
      hash: crypto.createHash("sha256").update(query).digest("hex"),
    };
  });
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = postgres(databaseUrl, {
    max: 1,
    ssl:
      databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1")
        ? false
        : { rejectUnauthorized: false },
    prepare: false,
  });

  await sql.begin(async (tx) => {
    await tx`CREATE SCHEMA IF NOT EXISTS drizzle`;
    await tx`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `;
  });

  const [{ migration_count }] = await sql<{ migration_count: number }[]>`
    select count(*)::int as migration_count
    from drizzle.__drizzle_migrations
  `;

  if (migration_count > 0) {
    console.log("Drizzle migration history already exists, skipping bootstrap.");
    await sql.end({ timeout: 5 });
    return;
  }

  const [{ has_existing_schema }] = await sql<{ has_existing_schema: boolean }[]>`
    select to_regclass('public.account') is not null as has_existing_schema
  `;

  if (has_existing_schema) {
    const migrations = readMigrationFiles();
    const appliedMigrations = migrations.slice(0, Math.max(0, migrations.length - 1));

    await sql.begin(async (tx) => {
      for (const migration of appliedMigrations) {
        await tx`
          INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
          VALUES (${migration.hash}, ${migration.createdAt})
        `;
      }
    });

    console.log(
      `Bootstrapped ${appliedMigrations.length} existing Drizzle migration records into drizzle.__drizzle_migrations.`
    );
  } else {
    console.log(
      "Created drizzle.__drizzle_migrations bootstrap table for a fresh database."
    );
  }

  await sql.end({ timeout: 5 });
}

main().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
});
