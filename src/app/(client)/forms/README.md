# Form Navigation System

This directory contains the forms system for the TTLO application. The forms are organized with a shared navigation system.

## Directory Structure

```
/forms
├── page.tsx              # Base page component for all forms
├── [formId]/             # Dynamic route for each form (for legacy support only)
│   ├── page.tsx          # Main page component (redirects to clean URL)
│   ├── layout.tsx        # Layout wrapper
│   └── _components/      # Shared components
│       ├── PageContent.tsx        # Main content component with navigation
│       ├── form-navigation.ts     # Navigation utilities
│       ├── clientProfile/         # Client profile form components
│       ├── ipdisclosure/          # IP disclosure form components
│       ├── substantialuse/        # Substantial use form components
│       └── deedofassignment/      # Deed of assignment form components
```

## Navigation System

The form navigation system allows users to navigate between different forms directly. Each form is accessible via a tab parameter in the URL.

### URL Structure

Forms are accessed using the following URL structure:

```
/forms?tab={tabId}
```

Where:

- `{tabId}` is the identifier for the specific form tab to display

Any URLs with a formId parameter (like `/forms/test?tab=client-profile`) will be automatically redirected to the clean URL format.

### Available Form Tabs

The following form tabs are available:

- `client-profile` - Client Profile Form
- `ip-disclosure` - IP Disclosure Form
- `substantial-use` - Certification of Substantial Use
- `deed-assignment` - Deed of Assignment

### Using the Navigation Utilities

The `form-navigation.ts` utility provides helper functions and constants for navigating between form tabs.

#### Example: Navigating to a specific form

```tsx
import { useRouter } from "next/navigation";
import {
  getFormUrl,
  FormTabs,
} from "@/app/(client)/forms/[formId]/_components/form-navigation";

function YourComponent() {
  const router = useRouter();

  const navigateToIPDisclosure = () => {
    router.push(getFormUrl(undefined, FormTabs.IP_DISCLOSURE));
  };

  return <button onClick={navigateToIPDisclosure}>Go to IP Disclosure</button>;
}
```

#### Example: Creating a link to a specific form

```tsx
import Link from "next/link";
import {
  getFormUrl,
  FormTabs,
} from "@/app/(client)/forms/[formId]/_components/form-navigation";

function FormLinks() {
  return (
    <div>
      <Link href={getFormUrl(undefined, FormTabs.CLIENT_PROFILE)}>
        Client Profile
      </Link>
      {/* More links... */}
    </div>
  );
}
```

## Adding a New Form

To add a new form:

1. Add a new form ID constant in `form-navigation.ts`
2. Create a new form component in an appropriate directory
3. Update the `PageContent.tsx` file to include the new form
4. Add the new form to the sidebar navigation



<!-- !! Note to change or alter table use npx drizzle-kit push and if have a custom one use drizzle:generate and drizzle:migrate-->