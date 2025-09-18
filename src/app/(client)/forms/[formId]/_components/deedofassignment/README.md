# Deed of Assignment Form Documentation

## Directory Structure

```
src/
├── app/
│   ├── (client)/
│   │   └── forms/
│   │       └── [formId]/
│   │           └── _components/
│   │               └── deedofassignment/
│   │                   ├── deed-assignment-form.tsx   # Main container component with tabs
│   │                   ├── deed-assignment.tsx        # Deed details form
│   │                   ├── royalty-agreement.tsx      # Royalty agreement form
│   │                   ├── signatory-section.tsx      # Signatory details form
│   │                   └── README.md                  # This documentation
│   └── api/
│       └── deed-of-assignment/
│           ├── route.ts                              # Main API endpoints
│           └── upload-document.ts                    # Document upload endpoint
└── drizzle/
    └── models/
        └── schema.ts                                 # Database schema definition
```

## Component Overview

### 1. Main Container Component (`deed-assignment-form.tsx`)

- Manages the multi-step form with tab navigation
- Features:
  - Tab-based navigation system
  - Form state management across tabs
  - Data persistence in localStorage
  - Role-based access control
  - Form status tracking
  - Loading state management

### 2. Form Sections

#### Deed Details (`deed-assignment.tsx`)

- Collects research and creator information
- Features:
  - Research title input
  - Dynamic creator fields (add/remove creators)
  - Creator address information
  - Form validation
  - Data persistence

#### Royalty Agreement (`royalty-agreement.tsx`)

- Displays the standard royalty agreement terms
- Features:
  - Agreement text display
  - Terms and conditions
  - Read-only content
  - Acknowledgment section

#### Signatory Section (`signatory-section.tsx`)

- Manages signatures and notarization details
- Features:
  - Date of execution
  - Assignee and assignor details
  - Identification details
  - Notarization information
  - Document upload functionality
  - Form submission handling

### 3. API Routes

#### Main API (`route.ts`)

- Endpoints:
  - `GET /api/deed-of-assignment`: Retrieves the deed for the current user
  - `POST /api/deed-of-assignment`: Creates a new deed
  - `PUT /api/deed-of-assignment`: Updates an existing deed
  - `PATCH /api/deed-of-assignment`: Updates deed status
- Features:
  - Authentication checks
  - Data validation
  - Error handling and logging
  - Transaction management

#### Document Upload (`upload-document.ts`)

- Endpoint for handling notarized document uploads
- Features:
  - File upload handling
  - Document path storage
  - Error handling
  - Security validation

### 4. Database Schema (`schema.ts`)

The deed of assignment table schema includes:

```typescript
export const deedOfAssignment = pgTable("deed_of_assignment", {
  deed_id: uuid("deed_id").defaultRandom().primaryKey(),
  user_id: uuid("user_id")
    .references(() => userAccount.id, { onDelete: "cascade" })
    .notNull(),
  research_title: varchar("research_title", { length: 255 }).notNull(),
  creators: jsonb("creators").notNull().default("[]"),
  creator_address: text("creator_address"),
  assignee_name: varchar("assignee_name", { length: 255 }).default(
    "CARAGA STATE UNIVERSITY"
  ),
  assignee_representative: varchar("assignee_representative", {
    length: 255,
  }).default("ROLYN C. DAGUIL, Ph.D."),
  day: varchar("day", { length: 50 }),
  month: varchar("month", { length: 50 }),
  year: varchar("year", { length: 50 }),
  assignee_id: varchar("assignee_id", { length: 50 }).default("M98 – 009"),
  assignee_date: varchar("assignee_date", { length: 50 }),
  assignee_place: varchar("assignee_place", { length: 255 }).default(
    "Butuan City"
  ),
  assignor_id: varchar("assignor_id", { length: 50 }),
  assignor_date: varchar("assignor_date", { length: 50 }),
  assignor_place: varchar("assignor_place", { length: 255 }).default(
    "Butuan City"
  ),
  doc_number: varchar("doc_number", { length: 50 }),
  page_number: varchar("page_number", { length: 50 }),
  book_number: varchar("book_number", { length: 50 }),
  series_year: varchar("series_year", { length: 50 }),
  notarized_document_path: text("notarized_document_path"),
  status: varchar("status", { length: 20 }).default("draft"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});
```

## Data Structures

### Creator Information

```typescript
interface Creator {
  firstName: string;
  middleInitial: string;
  lastName: string;
}
```

### Deed Details

```typescript
interface DeedData {
  researchTitle: string;
  creators: Creator[];
  creatorAddress: string;
  assigneeName: string;
  assigneeRepresentative: string;
}
```

### Signatory Information

```typescript
interface SignatoryData {
  day: string;
  month: string;
  year: string;
  assigneeId: string;
  assigneeDate: string;
  assigneePlace: string;
  assignorId: string;
  assignorDate: string;
  assignorPlace: string;
  docNumber: string;
  pageNumber: string;
  bookNumber: string;
  seriesYear: string;
  notarizedDocumentPath: string;
}
```

## Form Workflow

1. **Navigation Flow**:

   - User starts at the Deed Details tab (`?tab=deed`)
   - Clicks "Next" to proceed to Royalty Agreement (`?tab=royalty`)
   - Clicks "Next" to proceed to Signatory Section (`?tab=signatory`)
   - Submits the form from the Signatory Section

2. **Data Persistence**:

   - Each form section saves data to localStorage during navigation:
     - `deedAssignmentData`
     - `signatoryData`
   - On final submission, all data is saved to the database

3. **Form Status Workflow**:
   - **Draft**: Initial state, fully editable by the client
   - **Submitted**: Submitted by client, awaiting review
   - **Approved**: Approved by staff/admin, locked for editing
   - **Rejected**: Rejected by staff/admin, can be edited and resubmitted

## Document Management

1. **Form Download**:

   - Generated from form data
   - Includes all necessary sections
   - Ready for printing and notarization

2. **Document Upload**:
   - Supports notarized document upload
   - Validates file types and size
   - Stores document path in database
   - Tracks upload status

## Error Handling

The system implements comprehensive error handling:

- Form validation errors
- API request failures
- File upload errors
- Data validation errors
- Authentication errors

## Security

- Authentication required for all operations
- Data validation on both client and server
- Secure file upload handling
- Database transaction safety
- Role-based access control

## Recent Updates

1. **Form Improvements**:

   - Enhanced logging system
   - Improved error handling
   - Better data persistence
   - Streamlined navigation
   - Enhanced UI/UX
   - Added support for multiple assignor IDs in the Signatory Section

2. **API Enhancements**:
   - Added comprehensive logging
   - Improved error responses
   - Enhanced validation
   - Better file handling

## Multiple Assignor IDs Feature

The form now supports multiple assignor ID fields corresponding to each creator/inventor:

- Each creator/inventor listed in the Deed Details will have their own ID field in the Signatory Section
- The IDs are stored in an array in the form state (`assignorIds`) and as a comma-separated string in the database (`assignorId`)
- For backward compatibility, existing single assignor ID values are parsed into an array
- PDF generation shows the ID number for each individual creator/inventor
- The feature maintains a proper relationship between creators in the deed form and their corresponding IDs in the signatory section

## Future Improvements

1. **Planned Features**:

   - PDF generation
   - Email notifications
   - Digital signatures
   - Document versioning
   - Approval workflow
   - Full JSONB database field for assignor details

2. **Technical Enhancements**:
   - Optimize database queries
   - Implement caching
   - Add comprehensive testing
   - Enhance security measures
