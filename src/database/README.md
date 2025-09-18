# Database Directory

This directory contains all database-related files for the TTLO IP Management System.

## Directory Structure

- `/schemas`: Contains the database schema definitions
  - Current schema files
  - Historical schema versions for reference
- `/migrations`: Contains database migration files
  - SQL migration scripts
  - Migration history and tracking
- `/documentation`: Contains database documentation
  - Entity-Relationship Diagrams (ERD)
  - Schema documentation
  - Database design decisions

## Schema Files

The following schema files are available:

### Current Schema

- `DatabaseInitial3.2(modified clientform).sql` - Latest schema with updated client form structure

### Historical Schemas

- `DatabaseDraft1.sql` - Initial database schema draft
- `DatabaseDraft2.sql` - Second iteration of database schema
- `DatabaseDraft2(auth).sql` - Schema with authentication tables
- `DatabaseInitial3.1(modified auth).sql` - Schema with modified authentication
- `DatabaseInitial3.sql` - Third major iteration of the schema

## Documentation Files

- `DatabaseERD.dbml` - Database Entity-Relationship Diagram in DBML format

## Usage

### Viewing ERD Diagrams

You can visualize the DBML files using:

- [dbdiagram.io](https://dbdiagram.io) - Paste the contents of the DBML file
- [VS Code DBML extension](https://marketplace.visualstudio.com/items?itemName=duynvu.dbml-language) - For syntax highlighting

### Applying Migrations

Database migrations are managed through Drizzle ORM. The migration files in the `/migrations` directory are generated from the schema definitions in `/src/drizzle/models/schema.ts`.

To apply migrations:

```bash
npm run migrate
```

To generate new migrations:

```bash
npm run generate
```

## Relationship with Drizzle ORM

The SQL schema files in this directory are for reference and documentation. The actual database schema used by the application is defined in:

- `/src/drizzle/models/schema.ts` - TypeScript schema definitions
- `/src/drizzle/models/relations.ts` - Table relationships

When making changes to the database schema:

1. Update the TypeScript schema in `/src/drizzle/models/schema.ts`
2. Generate migrations using `npm run generate`
3. Apply migrations using `npm run migrate`
4. Update the reference SQL files in this directory for documentation
