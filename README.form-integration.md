# Form Integration System

## Overview

The form integration system automates the creation of IP application records from various form submissions. It leverages a registry-based approach to track form submissions, map additional data, and notify administrators when new forms require review.

## Database Schema

### Core Tables

1. **formSubmissionRegistry**

   - Acts as a central hub tracking all form submissions
   - Links form submissions to IP applications
   - Stores metadata about the submission status
   - Primary fields: `id`, `userId`, `sourceType`, `sourceId`, `status`, `title`, `description`

2. **formDataMapping**

   - Stores additional form data in a flexible key-value format
   - Links to registry entries
   - Primary fields: `id`, `formRegistryId`, `key`, `value`

3. **ipApplicationNotification**

   - Manages notifications for administrators about form submissions
   - Tracks when notifications are read
   - Primary fields: `id`, `ipApplicationId`, `formRegistryId`, `adminId`, `isRead`

4. **ipApplication** (existing table)
   - Remains the central table for IP applications
   - Gets automatically populated when forms are submitted

### Enums

1. **formSourceTypeEnum**

   - Defines possible form source types: `client_profile`, `ip_disclosure`, `substantial_use`, `deed_of_assignment`, `other_document`
   - Used to identify which form type submitted the data

2. **formSubmissionStatusEnum**
   - Defines processing states: `draft`, `submitted`, `processed`, `pending_review`, `failed`
   - Tracks the form's progress through the workflow

## Relationships

```
┌────────────────────┐      ┌──────────────────────┐      ┌───────────────────┐
│                    │      │                      │      │                   │
│ userAccount        │      │ formSubmissionRegistry     │ ipApplication     │
│                    │      │                      │      │                   │
└────────────────────┘      └──────────────────────┘      └───────────────────┘
       │                         │       │                       │
       │                         │       │                       │
       ▼                         │       │                       ▼
┌───────────────────┐            │       │             ┌───────────────────────┐
│                   │            │       │             │                       │
│ Original Forms    │────────────┘       └───────────►│ ipApplicationNotification
│ (various tables)  │                                  │                       │
└───────────────────┘                                  └───────────────────────┘
                                                               │
                                                               │
┌───────────────────┐                                          │
│                   │                                          │
│ formDataMapping   │◄─────────────────────────────────────────┘
│                   │
└───────────────────┘
```

- **User submissions**: Users submit forms that get registered in `formSubmissionRegistry`
- **Form tracking**: Each form is identified by its source type and ID
- **Automated creation**: When a form is submitted, a trigger automatically creates an IP application record
- **Notification system**: Administrators are notified about new submissions via `ipApplicationNotification`
- **Additional data**: Extra form data is stored in `formDataMapping` for flexibility

## Implementation

1. **Database Trigger**: Automatically creates IP application records when forms are submitted
2. **Service Layer**: Manages form submissions, processing, and related operations
3. **API Routes**: Provides endpoints for registering and submitting forms
4. **Client Hooks**: Offers React hooks for easy integration with frontend components

## Client Integration

The `useFormSubmission` hook provides a simple interface for:

- Registering form submissions
- Submitting forms for processing
- Checking form submission status
- Retrieving form submission data

## Usage Flow

1. User completes a form
2. Form is registered in the registry with `draft` status
3. Form is submitted for processing, status changes to `submitted`
4. Database trigger creates an IP application record
5. Notification is created for administrators
6. Administrator reviews the submission
7. Status is updated to `processed` when complete

## Benefits

- Centralized tracking of all form submissions
- Automatic creation of IP application records
- Standardized notification system
- Flexible data mapping for extended information
- Preserves existing IP application workflows
