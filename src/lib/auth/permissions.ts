import { Session } from "next-auth";

export type UserRole = "admin" | "ttlo_staff" | "client";

export interface FormPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canSubmit: boolean;
}

export const getFormPermissions = (
  session: Session | null,
  formStatus: string = "draft"
): FormPermissions => {
  // Default permissions - no access
  const defaultPermissions: FormPermissions = {
    canView: false,
    canEdit: false,
    canDelete: false,
    canApprove: false,
    canSubmit: false,
  };

  // If no session, return no permissions
  if (!session?.user) return defaultPermissions;

  const userRole = session.user.role as UserRole;

  // Admin has full access
  if (userRole === "admin") {
    return {
      canView: true,
      canEdit: true,
      canDelete: true,
      canApprove: true,
      canSubmit: true,
    };
  }

  // TTLO Staff permissions
  if (userRole === "ttlo_staff") {
    return {
      canView: true,
      canEdit: formStatus !== "approved",
      canDelete: false,
      canApprove: true,
      canSubmit: true,
    };
  }

  // Client permissions
  if (userRole === "client") {
    return {
      canView: true,
      canEdit: formStatus === "draft",
      canDelete: false,
      canApprove: false,
      canSubmit: true,
    };
  }

  return defaultPermissions;
};

// Helper function to check if user can perform specific action
export const checkPermission = (
  session: Session | null,
  action: keyof FormPermissions,
  formStatus: string = "draft"
): boolean => {
  const permissions = getFormPermissions(session, formStatus);
  return permissions[action];
};

// Development bypass for testing (remove in production)
export const bypassPermissions = (session: Session | null): boolean => {
  return (
    process.env.NODE_ENV === "development" && session?.user?.role === "admin"
  );
};
