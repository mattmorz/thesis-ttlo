# TTLO IP Management System

## Project Overview
The Technology Transfer and Licensing Office (TTLO) IP Management System is a modern web application designed to digitize, streamline, and manage the submission, tracking, and processing of Intellectual Property (IP) applications (Patents, Copyrights, Trademarks, Utility Models, Industrial Designs, and Trade Secrets). It provides a secure portal for researchers and clients to submit their IP disclosures and a robust dashboard for TTLO administrators to track phases, tasks, and documentation.

## Main Features
- **Client Portal**: Users can submit complex IP disclosure forms, track the progress of their applications, and upload necessary documents.
- **Admin Dashboard**: TTLO staff can view all applications, manage projects, update phases, assign tasks, and track statistical metrics.
- **Dynamic Form Workflows**: Support for Deed of Assignment, Substantial Use, and specific IP Disclosure forms.
- **Role-Based Access Control**: Strict segregation between Clients, TTLO Staff, and Administrators.
- **Document Management**: Project-specific document uploads, tracking, and validation (currently in development).
- **Calendar & Task Management**: Built-in scheduling and task tracking for IP managers.

## Technology Stack
- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui components
- **Backend**: Next.js Server Actions & API Routes, tRPC
- **Database**: PostgreSQL (via Supabase), Drizzle ORM
- **Authentication**: NextAuth.js (v5) with Google OAuth integration
- **State Management**: Zustand (for complex form state persistence), React Query (via tRPC)
- **Validation**: Zod (Schema validation), React Hook Form

## Repository Structure
```
src/
├── app/                  # Next.js App Router (Pages & Layouts)
│   ├── (admin)/          # Admin & TTLO Staff routes
│   ├── (auth)/           # Authentication routes
│   ├── (client)/         # Client portal routes
│   └── api/              # REST API and tRPC endpoints
├── components/           # Reusable UI components (shadcn, blocks, layouts)
├── drizzle/              # Database schema, relations, and migrations
├── features/             # Feature-based domains (admin, client flows)
├── hooks/                # Global React hooks
├── lib/                  # Utilities, types, and third-party configs
├── server/               # TRPC routers and server-side utilities
└── trpc/                 # TRPC initialization and client configuration
```

## Prerequisites
- Node.js (v18 or higher recommended)
- PostgreSQL database (local or cloud like Supabase)
- Google Cloud Console account (for OAuth credentials)

## Installation Instructions

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```
   *(Note: The project uses Next.js 14 and requires React 18 compatible packages).*

2. **Environment Variable Setup:**
   Create a `.env` file in the root directory using `.env_example` as a template:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@host:port/db?schema=public"

   # Authentication (NextAuth)
   AUTH_SECRET="generate-a-strong-secret-key"
   AUTH_URL="http://localhost:3000"

   # Google OAuth
   AUTH_GOOGLE_ID="your-google-oauth-client-id"
   AUTH_GOOGLE_SECRET="your-google-oauth-client-secret"

   # Authorization Configuration
   ALLOWED_EMAIL_DOMAINS="your-institution.edu"
   ADMIN_EMAILS="admin@your-institution.edu"
   TTLO_STAFF_EMAILS="staff@your-institution.edu"
   ```

3. **Database Setup & Migrations:**
   Push the Drizzle schema to your PostgreSQL database:
   ```bash
   npm run db:push
   ```
   *(Note: For production, use `npm run db:generate` and `npm run db:migrate` instead).*

4. **Development Startup:**
   Start the development server:
   ```bash
   npm run dev
   ```
   Access the application at `http://localhost:3000`.

## Scripts and Commands
- `npm run dev`: Starts the Next.js development server.
- `npm run build`: Creates an optimized production build.
- `npm run start`: Starts the production server (requires build first).
- `npm run lint`: Runs ESLint to check for code issues.
- `npm run db:push`: Syncs the Drizzle schema with your connected database.
- `npm run db:studio`: Opens Drizzle Studio for visual database management.

## User Roles & Permissions
1. **Admin (`admin`)**: Full system access. Can assign staff roles, delete any records, access all administrative dashboards, and modify system settings.
2. **TTLO Staff (`ttlo_staff`)**: Operational access. Can view all IP applications, manage project phases, validate documents, and mark tasks as complete.
3. **Client (`client`)**: Default role for new users. Can only view and manage their own IP applications and profile information.

*(Note: Roles are determined on login by checking the `ADMIN_EMAILS` and `TTLO_STAFF_EMAILS` environment variables).*

## Current System Status
The application is currently in a **Mostly Working** state following significant security and stability fixes. The core IP Application submission workflows, TRPC authentication routing, database transactions, and user session management are functional.

### Known Issues & Unverified Functionality
- **Document Management**: The `useDocumentActions` hook currently returns "Not implemented in production environment". Full document upload and validation to secure storage (e.g., S3) is incomplete.
- **Admin Dashboard Mock Data**: The "Available Projects" list on the Admin Dashboard currently displays static placeholder data rather than querying the database.
- **PDF Generation Fallbacks**: Some PDF generation utilities (e.g., Deed of Assignment) may generate blank PDFs if backend data fetching fails, rather than surfacing proper UI errors.

## Troubleshooting
- **Missing Sharp Module Warning**: During `npm run build`, you may see a warning about the `sharp` package. Run `npm i sharp` if you intend to use Next.js Image Optimization in production.
- **Login Failures**: Ensure your email matches the `ALLOWED_EMAIL_DOMAINS` env var, and that your Google OAuth callback URLs are correctly configured in the Google Cloud Console.
- **Blank Dashboards**: Verify that the database migrations have been applied (`npm run db:push`) and that the database URL string is correct.
