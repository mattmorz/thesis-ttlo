# TTLO Portal Application Architecture

This document provides an overview of the TTLO (Technology Transfer and Licensing Office) Portal application architecture for new developers.

## Project Overview

The TTLO Portal is a web application built with Next.js to manage intellectual property applications, submissions, and tracking. The application helps users submit, track, and manage various types of intellectual property applications (patents, trademarks, copyrights, etc.).

## Architecture Diagram

```
┌─────────────────────┐     ┌─────────────────┐     ┌─────────────────────┐
│    Client (Browser) │     │  Next.js App    │     │     Database        │
│                     │     │                 │     │                     │
│  ┌───────────────┐  │     │ ┌─────────────┐ │     │ ┌─────────────────┐ │
│  │ React         │  │     │ │ API Routes  │ │     │ │ PostgreSQL      │ │
│  │ Components    │◄─┼─────┼─┤             │◄┼─────┼─┤                 │ │
│  └───────────────┘  │     │ └─────────────┘ │     │ └─────────────────┘ │
│                     │     │                 │     │                     │
│  ┌───────────────┐  │     │ ┌─────────────┐ │     │ ┌─────────────────┐ │
│  │ Zustand       │  │     │ │ tRPC API    │ │     │ │ Drizzle ORM     │ │
│  │ Stores        │◄─┼─────┼─┤             │◄┼─────┼─┤                 │ │
│  └───────────────┘  │     │ └─────────────┘ │     │ └─────────────────┘ │
└─────────────────────┘     └─────────────────┘     └─────────────────────┘
```

## Directory Structure Overview

The codebase follows a modular structure with clear separation of concerns:

### Key Directories

1. **`/src/app`**: Next.js application routes and pages

   - `/app/(client)`: Client-facing pages
   - `/app/(admin)`: Admin-facing pages
   - `/app/api`: API routes

2. **`/src/components`**: Reusable React components

   - `/components/ui`: Shadcn UI components
   - `/components/blocks`: Layout blocks (navbar, footer, etc.)
   - `/components/global`: Shared components (breadcrumbs, etc.)

3. **`/src/features`**: Feature-specific code

   - `/features/client`: Client-facing features
   - `/features/admin`: Admin-facing features

4. **`/src/lib`**: Utility libraries and helper functions

   - `/lib/store`: Zustand state stores
   - `/lib/utils`: Utility functions
   - `/lib/validations`: Zod validation schemas

5. **`/src/drizzle`**: Database schema and migrations

   - `/drizzle/schema.ts`: Database schema definition
   - `/drizzle/migrations`: Migration files

6. **`/src/trpc`**: tRPC API definitions
   - `/trpc/router.ts`: Main API router
   - `/trpc/client.tsx`: Client-side tRPC setup

## Key Technologies

- **Next.js**: React framework for server-rendered applications
- **tRPC**: End-to-end typesafe API
- **Drizzle ORM**: TypeScript ORM for SQL databases
- **Shadcn/UI**: UI component library
- **Zustand**: State management
- **NextAuth.js**: Authentication

## Detailed Directory Breakdown

### `/src/app` - Next.js Application Routes

Next.js uses a file-based routing system:

- `/(client)`: Public-facing routes for clients

  - `page.tsx`: Homepage
  - `dashboard`: Client dashboard
  - `forms`: IP application forms
  - `guidelines`: Documentation and help
  - `projects`: Project tracking
  - `about`, `contact`: Informational pages

- `/(admin)`: Admin portal routes

  - Restricted access for staff and administrators

- `/api`: Server API endpoints
  - RESTful endpoints for data access
  - Most endpoints are being migrated to tRPC

### `/src/components` - UI Components

- `/ui`: Shadcn UI components (buttons, forms, modals, etc.)
- `/blocks`: Larger layout components (navbar, footer, sidebar)
- `/global`: Shared utility components (breadcrumbs, loading spinners)
- `ApplicationCreationDialog.tsx`: Dialog for creating new applications
- `ApplicationSelector.tsx`: Component to select active applications

### `/src/features` - Feature Modules

Features are organized by domain:

- `/client/form-integration`: Form submission and tracking

  - `hooks`: React hooks for form operations
  - `services`: Business logic for forms
  - `trpc`: tRPC endpoints for forms

- `/client/ip-disclosure`: IP disclosure submission
  - `hooks`: React hooks for IP disclosure
  - `store`: State management for IP disclosure

### `/src/lib` - Utility Libraries

- `/auth`: Authentication utilities
- `/store`: Zustand state stores

  - `client-profile-store.ts`: Client profile state
  - `ip-disclosure-store.ts`: IP disclosure form state
  - `deed-assignment-store.ts`: Deed of assignment state

- `/validations`: Zod validation schemas
- `/utils`: General utility functions

### `/src/drizzle` - Database Layer

- `schema.ts`: Database schema definitions
- `relations.ts`: Table relationships
- `migrations`: SQL migration files

### `/src/trpc` - tRPC API

- `init.ts`: tRPC initialization
- `router.ts`: Main API router
- `client.tsx`: Client-side tRPC provider

## Data Flow

1. **User Interaction**: User interacts with React components
2. **State Management**: Zustand stores manage local state
3. **API Calls**: tRPC procedures communicate with backend
4. **Database Operations**: Drizzle ORM handles database queries
5. **Response**: Data flows back to components

## Authentication & Authorization

The application uses NextAuth.js for authentication with three user roles:

- Client
- TTLO Staff
- Admin

Access control is managed through permissions defined in `/src/lib/auth/permissions.ts`.

## Working with Forms

The application manages several IP-related forms:

- IP Disclosure
- Substantial Use
- Deed of Assignment
- Client Profile

Form data is stored in Zustand stores and synchronized with the database through tRPC procedures.

## Getting Started

To start working on the project:

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start the development server: `npm run dev`

For more detailed information, refer to component-specific documentation.

## Dev Migration Recovery (When History Is Missing)

If `drizzle:migrate` fails due to missing migration files or enum-already-exists errors, follow this dev-only workflow:
n
1. Add no-op migration files if missing:
   - `src/drizzle/migrations/0010_tired_madame_hydra.sql`
   - `src/drizzle/migrations/0011_puzzling_shen.sql`
   - `src/drizzle/migrations/0014_new_husk.sql`

2. Ensure the migrations table exists:
   - Create schema/table `drizzle.__drizzle_migrations` if needed.

3. If the table is empty, insert a bootstrap marker:
   - `INSERT INTO drizzle.__drizzle_migrations ("hash", "created_at") VALUES ('manual-bootstrap-0032', 1745243746332);`

4. Run `npm run drizzle:migrate` to apply the latest migration.
