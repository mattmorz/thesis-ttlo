# Database Schemas

This directory contains SQL schema files for the TTLO IP Management System database.

## Schema Files

### Current Schema

- `DatabaseInitial3.2(modified clientform).sql` - Latest schema with updated client form structure
  - Updated client profile table with new fields
  - Improved field naming conventions (snake_case)
  - Added support for IP experience data as JSON

### Historical Schemas

- `DatabaseDraft1.sql` - Initial database schema draft

  - Basic tables for users, client profiles, and IP disclosures
  - Initial project management tables

- `DatabaseDraft2.sql` - Second iteration of database schema

  - Added copyright and patent application tables
  - Improved document management system
  - Enhanced project tracking

- `DatabaseDraft2(auth).sql` - Schema with authentication tables

  - Added NextAuth.js compatible authentication tables
  - Integrated with existing schema

- `DatabaseInitial3.1(modified auth).sql` - Schema with modified authentication

  - Improved authentication system
  - Updated user roles and permissions
  - Enhanced security features

- `DatabaseInitial3.sql` - Third major iteration of the schema
  - Comprehensive IP management tables
  - Advanced workflow and phase tracking
  - Improved indexing for performance

## Usage

These schema files are primarily for reference and documentation. The actual database schema used by the application is defined in TypeScript using Drizzle ORM in:

- `/src/drizzle/models/schema.ts`

When making changes to the database schema:

1. Update the TypeScript schema in `/src/drizzle/models/schema.ts`
2. Generate migrations using `npm run generate`
3. Apply migrations using `npm run migrate`
4. Update the reference SQL files in this directory for documentation

## Schema Conventions

- Table names are in snake_case and singular form
- Primary keys are named `id` or `[table_name]_id`
- Foreign keys are named after the referenced table's primary key
- Timestamps are included for all tables (`created_at`, `updated_at`)
- Enums are used for status fields and other categorical data
- Indexes are created for frequently queried columns
- Check constraints are used to enforce data integrity
