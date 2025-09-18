# Client Profile Form Documentation

## Directory Structure

```
src/
├── app/
│   ├── (client)/
│   │   └── forms/
│   │       └── [formId]/
│   │           └── _components/
│   │               └── clientProfile/
│   │                   ├── client-profile-form.tsx    # Main container component with tabs
│   │                   ├── client-information.tsx     # Personal and contact information form
│   │                   ├── educational-background.tsx # Educational qualifications form
│   │                   ├── client-background-ip.tsx   # IP experience and background form
│   │                   └── README.md                  # This documentation
│   └── api/
│       └── client-profile/
│           └── route.ts                              # API endpoints
└── drizzle/
    └── models/
        └── schema.ts                                 # Database schema definition
```

## Component Overview

### 1. Main Container Component (`client-profile-form.tsx`)

- Manages the multi-step form with tab navigation
- Features:
  - Tab-based navigation system
  - Form state management across tabs
  - Data fetching from API
  - Role-based access control
  - Form status tracking
  - Loading state management

### 2. Form Sections

#### Personal Information (`client-information.tsx`)

- Collects user's personal and contact details
- Features:
  - Personal details (name, gender, age, citizenship)
  - Contact information (email, phone)
  - Mailing address
  - Company/Institution details
  - Form validation
  - Data persistence

#### Educational Background (`educational-background.tsx`)

- Collects user's educational qualifications
- Features:
  - Highest degree earned
  - Degree program details
  - Professional information
  - Conditional fields for "other" options
  - Form validation
  - Data persistence

#### Background IP (`client-background-ip.tsx`)

- Collects user's IP experience and background
- Features:
  - Research publication status
  - Instructional materials development
  - IP rights knowledge
  - IP protection experience with detailed type selection
  - Form submission handling
  - Approval/rejection functionality for staff

### 3. API Routes (`route.ts`)

- Endpoints:
  - `GET /api/client-profile`: Retrieves the client profile for the current user
  - `POST /api/client-profile`: Creates or updates a client profile
  - `PUT /api/client-profile`: Updates form status (approval/rejection)
- Features:
  - Authentication checks
  - Permission validation
  - Error handling and logging
  - Data validation and transformation
  - Transaction management

### 4. Database Schema (`schema.ts`)

The client profile table schema includes:

```typescript
export const clientProfile = pgTable("client_profile", {
  client_id: uuid("client_id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .references(() => userAccount.id, { onDelete: "cascade" })
    .notNull(),

  // Personal Information
  first_name: varchar("first_name", { length: 100 }).notNull(),
  middle_name: varchar("middle_name", { length: 100 }),
  last_name: varchar("last_name", { length: 100 }).notNull(),
  gender: jsonb("gender").default({ value: "male" }),
  age: integer("age"),
  citizenship: jsonb("citizenship").default({
    value: "filipino",
    otherValue: null,
  }),

  // Contact Information
  email: varchar("email", { length: 255 }).notNull(),
  contact_number: varchar("contact_number", { length: 20 }),
  mailing_address: text("mailing_address"),

  // Company Information
  company_name: varchar("company_name", { length: 255 }),
  company_street: text("company_street"),
  company_barangay: text("company_barangay"),
  company_city_municipality: text("company_city_municipality"),
  company_province: text("company_province"),
  company_email: varchar("company_email", { length: 255 }),
  occupation: varchar("occupation", { length: 255 }),

  // Educational Background
  highest_degree: jsonb("highest_degree").default({
    value: "bachelor",
    otherValue: null,
  }),
  degree: varchar("degree", { length: 255 }),
  profession: varchar("profession", { length: 255 }),

  // Background IP
  published_research: jsonb("published_research").default({ value: "no" }),
  developed_materials: jsonb("developed_materials").default({ value: "no" }),
  familiar_with_ip_rights: jsonb("familiar_with_ip_rights").default({
    value: "no",
  }),
  ip_experience: jsonb("ip_experience").default({
    hasExperience: "no",
    types: {
      patent: false,
      copyright: false,
      trademark: false,
      industrialDesign: false,
      utilityModel: false,
      other: false,
    },
    otherSpecify: "",
  }),

  // Status and Metadata
  status: varchar("status", { length: 20 }).default("draft"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});
```

## Data Structures

### Personal Information

```typescript
interface PersonalInfo {
  firstName: string;
  lastName: string;
  middleName?: string;
  gender: { value: "male" | "female" | "prefer_not_to_say" };
  age?: number;
  citizenship: { value: "filipino" | "other"; otherValue?: string | null };
  email: string;
  contactNumber: string;
  mailingAddress: string;
  hasCompany: boolean;
  companyName?: string;
  companyStreet?: string;
  companyBarangay?: string;
  companyCityMunicipality?: string;
  companyProvince?: string;
  companyEmail?: string;
  collegeName?: string;
  departmentName?: string;
  occupation?: string;
}
```

### Educational Background

```typescript
interface EducationalBackground {
  highestDegree: {
    value: "bachelor" | "master" | "doctorate" | "other";
    otherValue?: string | null;
  };
  degree: string;
  profession: string;
}
```

### Background IP

```typescript
interface BackgroundIP {
  publishedResearch: { value: "yes" | "no" | "submitted" };
  developedMaterials: { value: "yes" | "no" | "ongoing" };
  familiarWithIPRights: { value: "yes" | "no" };
  ipExperience: {
    hasExperience: "yes" | "no";
    types: {
      patent: boolean;
      copyright: boolean;
      trademark: boolean;
      industrialDesign: boolean;
      utilityModel: boolean;
      other: boolean;
    };
    otherSpecify?: string;
  };
}
```

## Form Workflow

1. **Navigation Flow**:

   - User starts at the Personal Information tab (`?tab=personal`)
   - Clicks "Next" to proceed to Educational Background (`?tab=education`)
   - Clicks "Next" to proceed to Background IP (`?tab=background`)
   - Submits the form from the Background IP tab

2. **Data Persistence**:

   - Each form section saves data to localStorage during navigation:
     - `clientInformationData`
     - `educationalBackgroundData`
     - `clientBackgroundIPData`
   - On final submission, all data is saved to the database

3. **Form Status Workflow**:
   - **Draft**: Initial state, fully editable by the client
   - **Submitted**: Submitted by client, awaiting review
   - **Approved**: Approved by staff/admin, locked for editing
   - **Rejected**: Rejected by staff/admin, can be edited and resubmitted

## User Notifications

The form implements comprehensive notification system:

1. **Form Submission**:

   - Success toast with confirmation message
   - Alert dialog for important submissions
   - Status indicator in the UI

2. **Form Updates**:

   - Success toast when form is saved as draft
   - Error notifications for failed operations

3. **Approval/Rejection**:
   - Color-coded notifications (green for approval, red for rejection)
   - Status updates in the UI

## Role-Based Access Control

The form implements role-based access control:

1. **Client Users**:

   - Can create and edit their own profile
   - Can submit their profile for approval
   - Cannot edit after submission unless given permission

2. **TTLO Staff**:

   - Can view all client profiles
   - Can approve or reject submitted profiles
   - Can grant edit permissions to clients

3. **Admin Users**:
   - Have full access to all profiles
   - Can bypass all restrictions in development mode
   - Can perform any action on any profile

## Recent Changes and Improvements

### 1. Data Structure Enhancements

- Converted string fields to JSONB for better data handling:
  - `gender`: Now uses JSONB structure with `value` property
  - `citizenship`: Now uses JSONB with `value` and `otherValue` properties
  - `highest_degree`: Now uses JSONB with `value` and `otherValue` properties
  - `published_research` and `developed_materials`: Now use JSONB with `value` property
  - `familiar_with_ip_rights`: Converted from boolean to JSONB with `value` property
  - Enhanced `ip_experience` with better default structure
- Added conditional organization fields:
  - `hasCompany`: Boolean toggle to control which fields are displayed
  - Added `collegeName` and `departmentName` fields for academic affiliations
  - Existing company fields now only shown when hasCompany is true
  - Academic fields only shown when hasCompany is false

### 2. UI Improvements

- Standardized button layout across all tabs:
  - Personal Information: "Update Form" and "Next" buttons
  - Educational Background: "Previous", "Update Form", and "Next" buttons
  - Background IP: "Previous", "Update Form", and "Submit Form" buttons
- Enhanced form styling with consistent card headers
- Improved checkbox styling with theme colors
- Added better form status indicators
- Added organization type toggle:
  - Intuitive toggle switch between company and academic institution types
  - Conditional form fields based on selection
  - Smooth transitions between form sections

### 3. User Experience Enhancements

- Added comprehensive toast notifications for all operations
- Improved error handling and user feedback
- Enhanced form validation with better error messages
- Added loading states during form operations

### 4. API and Backend Improvements

- Updated API routes to handle JSONB data types
- Improved error handling and logging
- Enhanced data validation and transformation
- Fixed database constraints for JSONB fields

## Error Handling

The system implements comprehensive error handling:

- Form validation errors with specific messages
- API request failures with detailed error reporting
- Database connection issues with fallback to localStorage
- Authentication and permission errors
- Data transformation errors

## Troubleshooting

### Common Issues

1. **Form Not Loading**

   - Check if the API is returning data
   - Verify localStorage data is valid
   - Ensure user is authenticated

2. **Select Fields Not Showing Values**

   - Ensure the data is in the correct JSONB format
   - Check that the field is using the correct path (e.g., `gender.value`)
   - Verify that the default values match the expected format

3. **Form Status Not Updating**

   - Ensure API route is handling status updates correctly
   - Check if user has permission to change status
   - Verify database schema includes status field

4. **Data Not Saving**
   - Check browser console for API errors
   - Verify data format matches schema expectations
   - Ensure all required fields are provided

## Future Improvements

1. **Planned Enhancements**:

   - Add form progress indicator
   - Implement autosave functionality
   - Add ability to upload supporting documents
   - Enhance validation with more specific error messages
   - Add confirmation modal before final submission

2. **Technical Debt**:
   - Optimize database queries
   - Implement caching for better performance
   - Add comprehensive testing
   - Enhance logging system
   - Improve error recovery mechanisms
