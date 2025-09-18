# IP Disclosure Form

## Permission Control Requirements

### Current Implementation

The current implementation focuses on the basic system flow and form structure. The following features are planned for future implementation:

1. Staff/Admin Permission Control

   - For Patent/UM Application:
     - Users can only submit basic information (applicant's info and disclosure confirmation)
     - Access to subforms (Patent/UM Application, Matrix Sample, Patent Search Report) requires staff/admin approval
     - This will be implemented in a future update

2. Form Navigation

   - Copyright Flow:

     1. Copyright Application
     2. Transaction Form Part 1
     3. Transaction Form Part 2 (with sub-tabs):
        - Details
        - Applicant
        - Author
        - Work
        - Documents
        - Signature
        - References
     4. Disclosure and Confirmation

   - Patent/UM Flow:

     1. Patent/UM Application
     2. Matrix Sample
     3. Patent Search Report
     4. Disclosure and Confirmation

   - Trademark Flow:

     1. Trademark Application
     2. Disclosure and Confirmation

   - Trade Secret Flow:

     1. Trade Secret
     2. Disclosure and Confirmation

   - Industrial Design Flow:

     - Currently only shows Disclosure and Confirmation
     - Additional forms will be added in future updates

   - Not Sure/Other Flow:
     - Currently only shows Disclosure and Confirmation
     - Additional forms will be added based on requirements

### Data Persistence

- All form data is persisted using Zustand store
- Data is maintained across tab navigation
- Form state is preserved until submission

### Future Updates

1. Implement staff/admin permission system
2. Add validation for staff-approved access
3. Implement proper routing based on permissions
4. Add audit logging for permission changes
5. Implement email notifications for permission requests
