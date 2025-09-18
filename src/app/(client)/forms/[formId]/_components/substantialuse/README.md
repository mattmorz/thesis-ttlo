# Substantial Use Form Documentation

## Directory Structure

```
src/
├── app/
│   ├── (client)/
│   │   └── forms/
│   │       └── [formId]/
│   │           └── _components/
│   │               └── substantialuse/
│   │                   ├── substantial-use-form.tsx   # Main form component
│   │                   └── README.md                  # This documentation
│   └── api/
│       └── substantial-use/
│           └── route.ts                              # API endpoints
└── drizzle/
    └── models/
        └── schema.ts                                 # Database schema definition
```

## Component Overview

### 1. Form Component (`substantial-use-form.tsx`)

- Main form component for handling substantial use applications
- Features:
  - Dynamic form fields for research information
  - Applicant information with signature support
  - Laboratory facilities selection
  - Funding resources documentation
  - Form state management
  - Auto-save functionality
  - Form submission handling

### 2. API Routes (`route.ts`)

- Endpoints:
  - `GET`: Retrieve existing form data
  - `POST`: Submit new form data
  - `PUT`: Update draft form data
- Features:
  - Authentication checks
  - Database connection testing
  - Error handling and logging
  - Data validation
  - Transaction management

### 3. Database Schema (`schema.ts`)

The substantial use table schema includes:

```typescript
export const substantialUse = pgTable("substantial_use", {
  substantial_use_id: uuid("substantial_use_id").defaultRandom().primaryKey(),
  user_id: uuid("user_id").references(() => userAccount.id, {
    onDelete: "cascade",
  }),
  research_title: varchar("research_title", { length: 255 }).notNull(),
  applicants: jsonb("applicants")
    .notNull()
    .default(sql`'[]'`),
  laboratory_facilities: jsonb("laboratory_facilities")
    .notNull()
    .default(sql`'{}'`),
  funding_resources: jsonb("funding_resources")
    .notNull()
    .default(sql`'{}'`),
  remarks: text("remarks"),
  status: varchar("status", { length: 20 }).default("draft"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});
```

## Recent Changes and Modifications

### 1. Schema Updates

- Removed `signatures` field from substantial use table
- Integrated signature information into `applicants` array
- Added proper indexing for user and status fields
- Implemented cascade deletion for user references

### 2. API Endpoint Improvements

- Enhanced error handling and logging
- Added database connection testing
- Implemented proper transaction management
- Added data validation for required fields
- Improved response formatting

### 3. Form Component Updates

- Added form state persistence
- Implemented auto-save functionality
- Enhanced error handling and user feedback
- Added loading states and progress indicators
- Improved form validation

## Data Structure

### Applicant Information

```typescript
interface Applicant {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  signatureDate?: Date;
  signature?: string;
}
```

### Laboratory Facilities

```typescript
interface LaboratoryFacilities {
  [facilityName: string]: {
    selected: boolean;
    details?: string;
  };
}
```

### Funding Resources

```typescript
interface FundingResources {
  [resourceType: string]: {
    amount: number;
    details: string;
  };
}
```

## Usage

1. Form Access:

   - Navigate to the substantial use form page
   - Form will load existing data if available
   - Auto-saves as draft while editing

2. Form Submission:

   - Fill in all required fields
   - Add applicant information and signatures
   - Select laboratory facilities
   - Document funding resources
   - Submit form

3. Form Updates:
   - Edit existing form data
   - Update applicant information
   - Modify facility selections
   - Update funding details
   - Save changes

## Error Handling

The system implements comprehensive error handling:

- Form validation errors
- API request failures
- Database connection issues
- Authentication errors
- Data validation errors

## Security

- Authentication required for all operations
- Data validation on both client and server
- Proper error message sanitization
- Secure signature handling
- Database transaction safety

## Future Improvements

1. Planned Enhancements:

   - PDF generation for submitted forms
   - Email notifications
   - Approval workflow
   - Document attachments
   - Version history

2. Technical Debt:
   - Optimize database queries
   - Implement caching
   - Add comprehensive testing
   - Enhance logging system
