# Project Inventory Module

This module manages the intellectual property project inventory system for the TTLO Portal. It provides functionality for viewing, adding, editing, and deleting IP projects with different categorizations.

## Directory Structure

```
src/features/admin/project-inventory/
├── components/                  # UI components for project inventory
│   ├── chem-inventory/          # Chemical inventory specific components
│   ├── client-project-inventory/ # Client project inventory components
│   ├── ip-category-displays/    # IP category display components
│   ├── mech-inventory/          # Mechanical inventory specific components
│   ├── custom-filter-panel.tsx  # Reusable filter panel component
│   └── inventory-stats.tsx      # Statistics display component
├── schemas/                     # Data models and validation schemas
│   └── inventory-base.ts        # Base schema for inventory data
├── services/                    # Backend service integrations
│   ├── db-adapter.ts            # Database adapter for inventory operations
│   ├── inventory-actions.ts     # Server actions for inventory operations
│   ├── category-adapter.ts      # Category-specific database adapter
│   ├── category-actions.ts      # Server actions for category operations
│   └── inventory-stats-service.ts # Service for fetching inventory statistics
└── README.md                    # This documentation file
```

## Key Components and Relationships

### Core Components

1. **Client Project Inventory (`components/client-project-inventory/`)**

   - `client-proj.tsx`: Main component for displaying and managing projects
   - `add-entry-form.tsx`: Form for adding/editing project entries
   - `inventory-actions.tsx`: Actions for each inventory item (edit, delete)
   - `schema.ts`: Zod schema for client project inventory data validation

2. **Chemical Inventory (`components/chem-inventory/`)**

   - `chemical-inventory.tsx`: Chemical-specific inventory display
   - `add-entry-form.tsx`: Form for adding/editing chemical entries
   - `inventory-actions.tsx`: Actions for chemical inventory items
   - `schema.ts`: Schema for chemical inventory validation

3. **Mechanical Inventory (`components/mech-inventory/`)**

   - `mechanical-inventory.tsx`: Mechanical-specific inventory display
   - `add-entry-form.tsx`: Form for adding/editing mechanical entries
   - `inventory-actions.tsx`: Actions for mechanical inventory items
   - `schema.ts`: Schema for mechanical inventory validation

4. **IP Category Displays (`components/ip-category-displays/`)**

   - `PatentDisplay.tsx`: Patent-specific inventory display

5. **Reusable Components**
   - `custom-filter-panel.tsx`: Component for filtering inventory items
   - `inventory-stats.tsx`: Display statistics about the inventory

### Data Models and Schemas

1. **Base Inventory Schema (`schemas/inventory-base.ts`)**
   - Defines the core structure for all inventory items
   - Includes schemas for filtering, form submission, and base inventory type
   - Used by all inventory components for data validation and typing

### Services and Data Access

1. **Database Adapters**

   - `db-adapter.ts`: Core adapter for database operations on inventory
   - `category-adapter.ts`: Specialized adapter for category-specific operations

2. **Server Actions**
   - `inventory-actions.ts`: Server actions that wrap database operations
   - `category-actions.ts`: Server actions for category-specific operations
   - `inventory-stats-service.ts`: Service for fetching inventory statistics

## Data Flow and Component Relationships

1. **Data Fetching Flow**:

   ```
   UI Components → Server Actions → Database Adapters → Database
   ```

2. **Form Submission Flow**:

   ```
   Form Components → Form Validation (Schema) → Server Actions → Database Adapters → Database
   ```

3. **Filtering Flow**:
   ```
   custom-filter-panel.tsx → Parent Component → Server Actions → Database Adapters (with filters) → Database
   ```

## Key Features

1. **Project Management**: Add, edit, delete, and view IP projects
2. **Categories**: Specialized views for different IP types (patents, copyrights, etc.)
3. **Filtering**: Advanced filtering options for finding specific projects
4. **Statistics**: Overview of project counts and statuses
5. **Inventor Management**: Track inventors associated with each project

## Related Files Outside This Directory

1. **Database Schema**:

   - `src/drizzle/migrations/schema.ts`: Contains database table definitions
   - `src/drizzle/db.ts`: Database connection configuration
   - `drizzle.config.ts`: Drizzle ORM configuration

2. **Admin Pages**:

   - `src/app/(admin)/admin/proj-inventory/page.tsx`: Main page that uses these components
     - Imports and integrates various inventory components
     - Uses tabs to switch between different inventory views
     - Implements layout and navigation for the inventory system
   - `src/app/(admin)/admin/client-proj-dash/`: Client project dashboard pages

3. **UI Components**:

   - Uses components from `@/components/ui/` (Shadcn UI components)
   - Notable components:
     - `Table`: For displaying inventory data
     - `Dialog`: For add/edit forms
     - `Card`: For stats display
     - `Badge`: For status indicators
     - `Dropdown`: For action menus

4. **Authentication and Authorization**:
   - The project inventory system interacts with the authentication system
   - User roles determine access to different inventory features
   - User IDs are stored with inventory entries for tracking ownership

## Database Schema Details

The inventory system is built around these key tables in the database:

1. **ipApplication**: The central table for all IP applications

   - Contains fields like `title`, `description`, `status`, `ipType`
   - Stores `inventors` data as a JSON array
   - Contains metadata like `createdAt`, `updatedAt` timestamps
   - Includes fields for tracking progress and commercialization status

2. **ipDisclosure**: Stores disclosure information for IP applications

   - Links to `ipApplication` via foreign key
   - Contains details about the intellectual property being disclosed

3. **ipContributors**: Records contributors/inventors for applications

   - Stores details like `firstName`, `lastName`, and `role`
   - Links to `ipApplication` via foreign key

4. **ipApplicationEnrollment**: Tracks staff assignments to applications

   - Creates relationships between users and IP applications
   - Used to determine assignment status and track who's working on what

5. **Category-specific tables**: Various tables for different IP types
   - Patent-specific tables (`patentApplication`, `patentSearchReport`)
   - Copyright-specific tables
   - Trademark-specific tables
   - Etc.

## Integration with Other Modules

The Project Inventory module integrates with other parts of the TTLO system:

1. **Dashboard Module**: Statistics from the inventory display on the admin dashboard

2. **User Management**: User accounts are linked to inventory items for ownership and assignment

3. **Notification System**: Actions in the inventory can trigger notifications

4. **Document Management**: IP applications often have associated documents and files

## Deployment and Performance Considerations

1. **Server Components vs. Client Components**:

   - Most inventory components are client-side for interactive features
   - Data fetching uses server actions for security and performance

2. **Pagination and Filtering**:

   - All data tables implement pagination to handle large datasets
   - Filtering is performed at the database level for efficiency

3. **Error Handling**:
   - Toast notifications for user feedback
   - Graceful error handling for database operations

## Usage Examples

### Loading Inventory Data

```tsx
// In a component
import { fetchInventoryItems } from "@/features/admin/project-inventory/services/inventory-actions";

// ...
const fetchData = async () => {
  const result = await fetchInventoryItems(
    { ipType: "patent" },
    { page: 1, limit: 10 }
  );
  setInventoryData(result.data);
};
```

### Adding a New Inventory Item

```tsx
// In a component
import { createInventoryItem } from "@/features/admin/project-inventory/services/inventory-actions";

// ...
const handleAddEntry = async (data: InventoryFormData) => {
  try {
    // Map form data to BaseInventoryType
    await createInventoryItem({
      title: data.projectTitle,
      inventors: data.inventors,
      // ... other fields
    });
    // Success handling
  } catch (error) {
    // Error handling
  }
};
```

## Database Models

The inventory system primarily uses these database tables:

1. **ipApplication**: Main table for IP applications
2. **ipDisclosure**: Disclosure information related to applications
3. **ipContributors**: Contributors/inventors for applications
4. **ipApplicationEnrollment**: Staff assignments to applications
5. **various category tables**: Patent, copyright, trademark specific tables

## Inventors Processing

Inventors data can come from multiple sources and is processed in different ways:

1. **Database Storage**: Can be stored as:

   - String array in `ipApplication.inventors`
   - Related records in `ipDisclosureInventor` table
   - Related records in `ipContributors` table

2. **Display Format**: Displayed as a list of names with roles when available
