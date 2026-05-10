import "dotenv/config";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

type JournalEntry = {
  idx: number;
  when: number;
  tag: string;
  breakpoints: boolean;
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

  const [{ migration_count }] = await sql<{ migration_count: number }[]>`
    select case
      when to_regclass('drizzle.__drizzle_migrations') is null then 0
      else (
        select count(*)::int
        from drizzle.__drizzle_migrations
      )
    end as migration_count
  `;

  if (migration_count > 0) {
    console.log("Drizzle migration history already exists, skipping bootstrap.");
    await sql.end({ timeout: 5 });
    return;
  }

  const drizzleKitBin = path.join(
    process.cwd(),
    "node_modules",
    ".bin",
    process.platform === "win32" ? "drizzle-kit.cmd" : "drizzle-kit"
  );

  const pushResult = spawnSync(drizzleKitBin, ["push", "--force"], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
  });

  if (pushResult.status !== 0) {
    throw new Error("drizzle-kit push failed");
  }

  const migrations = readMigrationFiles();

  await sql.begin(async (tx) => {
    await tx`CREATE SCHEMA IF NOT EXISTS drizzle`;
    await tx`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `;

    for (const migration of migrations) {
      await tx`
        INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
        VALUES (${migration.hash}, ${migration.createdAt})
      `;
    }
  });

  console.log(
    `Bootstrapped ${migrations.length} Drizzle migration records into drizzle.__drizzle_migrations.`
  );

  await sql.end({ timeout: 5 });
}

main().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
});
