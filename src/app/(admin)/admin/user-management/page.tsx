import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import dynamic from "next/dynamic";

// Import the component dynamically to avoid naming conflicts
const UserManagementUI = dynamic(
  () =>
    import(
      "@/features/admin/user-management/components/user-management-interface"
    ),
  { ssr: false, loading: () => <p>Loading user management interface...</p> }
);

export const metadata: Metadata = {
  title: "User Management | TTLO Admin",
  description: "User management and role assignment for TTLO system",
};

export default async function UserManagementPage() {
  // Get session from auth
  const session = await auth();

  // Check if user is authenticated and has admin or ttlo_staff role
  const userRole = session?.user?.role;

  // Redirect unauthorized users (not admin or ttlo_staff)
  if (!session || (userRole !== "admin" && userRole !== "ttlo_staff")) {
    redirect("/dashboard?error=permission_denied");
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          {userRole === "admin"
            ? "Manage user accounts, view account details, and assign user roles."
            : "View user accounts and account details. Only administrators can modify user roles."}
        </p>
      </div>

      <UserManagementUI />
    </div>
  );
}
