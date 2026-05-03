# TTLO Portal Admin Configuration

This document provides a comprehensive overview of the Technology Transfer and Licensing Office (TTLO) Portal's admin architecture, components, and APIs for developers.

## Project Overview

The admin side of the TTLO Portal is built on Next.js and provides powerful interfaces for managing intellectual property applications, monitoring projects, accessing archives, and configuring system settings. It enables TTLO staff to review, approve, and track IP applications throughout their lifecycle.

## Architecture Diagram

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   Admin Interface   │     │    Next.js App      │     │     Database        │
│                     │     │                     │     │                     │
│  ┌───────────────┐  │     │ ┌─────────────────┐ │     │ ┌─────────────────┐ │
│  │ Admin Dashboard│◄─┼─────┼─┤ Admin API Routes│◄┼─────┼─┤ PostgreSQL DB   │ │
│  │ Projects       │  │     │ │ (NextAuth)      │ │     │ │ (Drizzle ORM)   │ │
│  │ Archives       │  │     │ └─────────────────┘ │     │ └─────────────────┘ │
│  │ Settings       │  │     │                     │     │                     │
│  └───────────────┘  │     │ ┌─────────────────┐ │     │ ┌─────────────────┐ │
│                     │     │ │ tRPC API        │ │     │ │ Schema:         │ │
│  ┌───────────────┐  │     │ │ - archives      │◄┼─────┼─┤ - userAccount   │ │
│  │ Component     │  │     │ │ - projects      │ │     │ │ - ipApplication │ │
│  │ Library       │◄─┼─────┼─┤ - clientProjects│ │     │ │ - archives      │ │
│  │ (ShadcnUI)    │  │     │ └─────────────────┘ │     │ └─────────────────┘ │
│  └───────────────┘  │     │                     │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

## Key Directories Overview

### Admin-Specific Directories

1. **`/src/app/(admin)`**: Admin route group and pages

   - `/admin/dashboard`: Admin dashboard
   - `/admin/projects`: Project management
   - `/admin/archives`: Archived applications
   - `/admin/settings`: System settings

2. **`/src/features/admin`**: Admin feature modules
   - `/archives`: Archive management
   - `/projects`: Project administration
   - `/client-project-dashboard`: Client project viewing
   - `/dashboard`: Admin dashboard functionality
   - `/settings`: Admin settings

### Database Configuration

1. **`/src/drizzle/migrations`**: Database schema and migrations

   - `schema.ts`: Database table definitions
   - `relations.ts`: Table relationships

2. **`drizzle.config.ts`**: Drizzle ORM configuration

### UI Components

1. **`/src/components`**: Shared UI components
   - `/ui`: Shadcn UI components
   - `/blocks`: Layout blocks
   - `/global`: Global components
   - `ApplicationCreationDialog.tsx`: New application dialog
   - `ApplicationSelector.tsx`: Application selection

## Database Schema

The admin interface interacts with these primary tables:

```
┌───────────────────┐       ┌───────────────────┐       ┌───────────────────┐
│   userAccount     │       │   ipApplication   │       │   archives        │
├───────────────────┤       ├───────────────────┤       ├───────────────────┤
│ id                │       │ id                │       │ id                │
│ name              │       │ userId            │┼──────┤ applicationId     │
│ email             │       │ title             │       │ archivedBy        │
│ role              │◄──────┤ ipType            │       │ archiveReason     │
│ isActive          │       │ status            │       │ archivedAt        │
│ emailVerified     │       │ progress          │       └───────────────────┘
└───────────────────┘       │ createdAt         │               ▲
        ▲                   │ updatedAt         │               │
        │                   └───────────────────┘               │
        │                           ▲                           │
        │                           │                           │
┌───────────────────┐       ┌───────────────────┐       ┌───────────────────┐
│ applicationPhase  │       │ documents         │       │ contactMessage    │
├───────────────────┤       ├───────────────────┤       ├───────────────────┤
│ phaseId           │◄──────┤ documentId        │       │ messageId         │
│ applicationId     │       │ applicationId     │       │ name              │
│ title             │       │ title             │       │ email             │
│ status            │       │ fileName          │       │ subject           │
│ startDate         │       │ fileType          │       │ message           │
│ endDate           │       │ uploadedBy        │       │ status            │
└───────────────────┘       │ requiresValidation│       │ assignedTo        │
                            └───────────────────┘       └───────────────────┘
```

## Admin Features

### 1. Dashboard (`/admin/dashboard`)

The admin dashboard provides an overview of:

- Active projects and their statuses
- Recent activities
- Pending tasks and reviews
- Statistical insights

```typescript
// Key data structure in dashboard
interface DashboardStats {
  myTasks: number;
  myCompletedTasks: number;
  myPendingReviews: number;
  upcomingDeadlines: number;
  myActiveProjects: number;
}
```

### 2. Projects Management (`/admin/projects`)

Manage all intellectual property applications:

- View all active projects
- Filter by status, type, and department
- Assign projects to staff members
- Track project progress

### 3. Archives (`/admin/archives`)

Access archived applications:

- View archived projects
- Search and filter archives
- Restore projects from archive
- Download archived documents

### 4. Client Project Dashboard (`/admin/client-proj-dash`)

Detailed view of specific client projects:

- Project phases and tasks
- Document management
- Status updates
- Communication with clients

### 5. Settings (`/admin/settings`)

Administrative settings:

- User management
- System configuration
- Email templates
- Notification preferences

## API Routes and tRPC Endpoints

### Key tRPC Routers

The admin interface uses typesafe tRPC endpoints:

1. **`archivesRouter`**: Archive operations

   ```typescript
   // Example endpoint
   get: publicProcedure.input(filterSchema).query(async ({ input }) => {
     // Returns archived applications
   });
   ```

2. **`projectsRouter`**: Project management

   ```typescript
   // Example endpoint
   enrollProject: protectedProcedure
     .input(z.string().uuid())
     .mutation(async ({ ctx, input }) => {
       // Enroll staff member to project
     });
   ```

3. **`clientProjectDashboardRouter`**: Client project details
   ```typescript
   // Example endpoint
   updatePhase: publicProcedure
     .input(updatePhaseSchema)
     .mutation(async ({ input }) => {
       // Update project phase
     });
   ```

### NextAuth Authentication

The admin interface uses NextAuth for authentication and role-based access:

```typescript
// User roles in the system
export type UserRole = "admin" | "ttlo_staff" | "client";

// Permission checking
export const checkPermission = (
  session: Session | null,
  action: keyof FormPermissions,
  formStatus: string = "draft"
): boolean => {
  const permissions = getFormPermissions(session, formStatus);
  return permissions[action];
};
```

## State Management

### Zustand Stores

The admin interface uses Zustand for state management:

1. **Archive Filters Store**: Manages archive filtering state
2. **Projects Store**: Manages project list state
3. **Settings Store**: Manages admin settings

## UI Components

### Admin-specific Components

```
/components
  ├── ApplicationCreationDialog.tsx   # Dialog for creating applications
  ├── ApplicationSelector.tsx        # Component for selecting applications
  ├── blocks/                        # Layout blocks
  │   ├── barside.tsx                # Admin sidebar
  │   └── navbar.tsx                 # Admin navigation
  ├── global/                        # Shared components
  └── ui/                            # Shadcn UI components
```

### Component Usage Pattern

```typescript
// Example component pattern in admin pages
export default function ProjectsPage() {
  return (
    <main className="space-y-4 p-8 pt-6">
      <div className="flex justify-between">
        <TypographyH2>Projects</TypographyH2>
        <SearchWithNuqs />
      </div>
      <ProjectList />
    </main>
  );
}
```

## Utility Libraries

### Admin Utilities

```
/lib
  ├── auth/                         # Authentication utilities
  │   └── permissions.ts            # Role-based permissions
  ├── utils/                        # General utilities
  │   └── localStorage-utils.ts     # LocalStorage management
  └── services/                     # Business logic
```

## Database Schema Details

The admin interface primarily interacts with:

1. **`userAccount`**: User management

   - Role-based access control
   - Staff profiles

2. **`ipApplication`**: IP application management

   - Status tracking
   - Progress monitoring
   - Metadata storage

3. **`applicationPhase`**: Project phase tracking

   - Phase status
   - Timeline management
   - Task organization

4. **`archives`**: Archived applications
   - Archive reason tracking
   - Archive metadata
   - Restoration capability

## Getting Started

To work on the admin interface:

1. Start the development server: `npm run dev`
2. Access the admin interface at: `http://localhost:3000/admin`
3. Use the following credentials for testing:
   - Email: `admin@example.com`
   - Password: `password123`

## Development Workflow

1. Create or modify admin features in `/src/features/admin`
2. Define API endpoints in tRPC routers
3. Add UI components in `/src/components`
4. Update database schema as needed in `/src/drizzle/migrations`

## Environment Variables

```
DATABASE_URL=postgres://user:password@localhost:5432/ttlo_db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret
GOOGLE_DRIVE_STORAGE_EMAIL=balanghigdave@gmail.com
GOOGLE_DRIVE_ROOT_FOLDER_ID=optional_root_folder_id
GOOGLE_DRIVE_SHARED_DRIVE_ID=optional_shared_drive_id
```

## Google Drive Upload Setup

Use the following flow for the current personal Drive setup:

1. Set `GOOGLE_DRIVE_STORAGE_EMAIL` to the Google account that should own all uploaded files.
2. Leave `GOOGLE_DRIVE_SHARED_DRIVE_ID` empty for now since the Shared Drive is not available yet.
3. Optionally set `GOOGLE_DRIVE_ROOT_FOLDER_ID` if you want uploads to start inside an existing top-level folder instead of the Drive root.
4. Sign in once to the app using `balanghigdave@gmail.com` so its Google refresh token is stored in the database.
5. Enable the Google Drive API in the Google Cloud project connected to `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.

The app will still require the uploaded files to be authenticated through the portal, but the Drive files themselves are set to `reader` access for anyone with the link.

## Related Documentation

- [Client Side README](./Client%20Side%20README.md)
- [Shadcn UI Documentation](https://ui.shadcn.com/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [tRPC Documentation](https://trpc.io/)
- [NextAuth Documentation](https://next-auth.js.org/)
