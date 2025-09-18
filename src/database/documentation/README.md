# Database Documentation

This directory contains documentation for the TTLO IP Management System database.

## Documentation Files

- `DatabaseERD.dbml` - Entity-Relationship Diagram in DBML format
  - Visual representation of database tables and their relationships
  - Includes entity attributes, data types, and constraints
  - Can be visualized using [dbdiagram.io](https://dbdiagram.io)

## Viewing ERD Diagrams

You can visualize the DBML files using:

1. **Online Tools**:

   - [dbdiagram.io](https://dbdiagram.io) - Paste the contents of the DBML file
   - [QuickDBD](https://quickdatabasediagrams.com/) - Convert DBML to their format

2. **VS Code Extensions**:
   - [DBML Language](https://marketplace.visualstudio.com/items?itemName=duynvu.dbml-language) - For syntax highlighting
   - [ERD Editor](https://marketplace.visualstudio.com/items?itemName=dineug.vuerd-vscode) - For visual editing

## Database Design Principles

The database design follows these principles:

1. **Normalization** - Tables are normalized to reduce redundancy
2. **Referential Integrity** - Foreign key constraints ensure data consistency
3. **Indexing Strategy** - Indexes on frequently queried columns for performance
4. **Audit Trails** - Timestamps and activity logging for data changes
5. **Type Safety** - Use of enums and check constraints for data validation

## Schema Evolution

The database schema has evolved through several iterations:

1. **Initial Draft** - Basic structure with core entities
2. **Authentication Integration** - Added NextAuth.js compatible tables
3. **Workflow Enhancement** - Added phase and task management
4. **Document Management** - Improved file storage and organization
5. **Current Version** - Optimized for performance and usability

## Relationship with Application Code

The database schema is reflected in the application code through:

- TypeScript interfaces in `/src/types`
- Drizzle ORM schema in `/src/drizzle/models/schema.ts`
- API routes in `/src/app/api`

When making changes to the database schema, ensure all these components are updated accordingly.
