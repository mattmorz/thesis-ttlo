# Database Change README

This project uses Drizzle ORM and a migration-based workflow.

## What to change

Make schema changes in:

- `src/drizzle/schema.ts`

If the app also uses mirrored schema files, update these too:

- `src/drizzle/migrations/schema.ts`
- `src/drizzle/models/schema.ts`

## Standard workflow

1. Edit the Drizzle schema file.
2. Generate a migration when needed.
3. Review the generated SQL.
4. Run the migration against the database.
5. Update the application code that reads or writes the new field.

## Commands

### Generate a migration

Use this when you changed the schema and want Drizzle to create a new SQL migration:

```powershell
npm run drizzle:generate
```

### Apply migrations

Use this to run pending migrations against the database:

```powershell
npm run drizzle:migrate
```

## Important project-specific note

This repository uses a custom bootstrap script before `drizzle-kit migrate`:

- `src/drizzle/bootstrap-migrations.ts`

That script exists because some databases already have tables, but not Drizzle's migration history table.

What it does:

- creates the `drizzle` schema if needed
- creates `drizzle.__drizzle_migrations` if needed
- seeds migration history for existing databases
- lets `drizzle-kit migrate` apply only the pending migrations

## When to edit the database schema

Add a new column when:

- the value needs to persist across sessions
- the value must be available in more than one form
- the frontend needs to restore the value later
- the value should be queryable from the database

Use a form-only field when:

- the value is only needed during a single UI step
- the value can be derived from existing data
- the value does not need to survive reloads

## Example

For the `Other` IP type work:

- `ipType` stays as `"other"`
- `otherIpType` stores the human-readable description
- the active application and disclosure flow can read that description later

## Good practices

- Prefer nullable columns for optional user input.
- Keep schema changes backwards compatible when possible.
- Do not rely on `drizzle-kit push` for this repo unless you know the database is disposable.
- Review generated SQL before applying it.
- Update TypeScript types and API payloads at the same time as the schema.

## Troubleshooting

### `relation "drizzle.__drizzle_migrations" does not exist`

Run `npm run drizzle:migrate` again after the bootstrap script has been fixed. The script should create the Drizzle migration table before migration history is queried.

### `relation "account" already exists`

That usually means `drizzle-kit migrate` is trying to replay the initial migrations on a database that already has schema objects.

The fix in this repo is the bootstrap script. Do not use `drizzle-kit push --force` as a shortcut.

### New column exists in schema but not in DB

Run:

```powershell
npm run drizzle:migrate
```

If the schema file changed but no migration was created, generate one first:

```powershell
npm run drizzle:generate
```

## Files to check after a schema change

- `src/drizzle/schema.ts`
- `src/drizzle/migrations/*.sql`
- `src/drizzle/migrations/meta/_journal.json`
- `src/features/client/form-integration/trpc.ts`
- `src/server/api/routers/form-integration.ts`
- any hooks or UI components that consume the changed field

## Recommended order for changes

1. Update the schema.
2. Add or regenerate the migration.
3. Apply the migration.
4. Update API and UI code.
5. Test the affected flow in `npm run dev`.
