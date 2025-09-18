# Library Directory

This directory contains reusable utilities, services, and business logic for the application.

## Directory Structure

```
/lib
├── api/                # API utilities and services
│   ├── client-profile/ # Client profile service layer
│   └── archives/      # Archive management services
├── services/          # Business logic services
├── store/            # State management (Zustand)
│   └── client-profile-store.ts  # Client profile state
├── validations/      # Form validation schemas
│   └── client-profile.ts       # Client profile validation
├── form-actions.ts   # Form submission handlers
├── db.ts            # Database connection setup
├── mock-db.ts       # Mock database for testing
├── sanitize-string.ts # String sanitization utility
└── utils.ts         # General utilities

```

## Key Components

### API Utilities (`/api`)

- Service layer for API operations
- Data transformation and processing
- Error handling and response formatting

### Services (`/services`)

- Business logic implementation
- Complex data operations
- Service-specific utilities

### State Management (`/store`)

- Zustand stores for global state
- Form state management
- Cross-component data sharing

### Validation (`/validations`)

- Zod validation schemas
- Type definitions
- Form field validation rules

### Utility Files

- `form-actions.ts`: Form submission and update handlers
- `db.ts`: PostgreSQL database connection
- `mock-db.ts`: Mock database for development/testing
- `sanitize-string.ts`: String sanitization functions
- `utils.ts`: General utility functions

## Usage

The library directory serves as a central location for:

1. Reusable business logic
2. Data processing utilities
3. State management
4. Form validation
5. Database operations

This organization helps maintain clean code and separation of concerns.
