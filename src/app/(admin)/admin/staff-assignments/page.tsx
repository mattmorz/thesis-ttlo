import { Metadata } from "next";
import { StaffAssignmentInventory } from "@/features/admin/project-inventory/components/staff-assignment";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Staff Assignment Inventory | TTLO Admin",
  description: "Staff assignment management for TTLO projects",
};

export default async function StaffAssignmentPage() {
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
        <h1 className="text-2xl font-bold tracking-tight">Staff Assignments</h1>
        <p className="text-muted-foreground">
          Manage staff assignments to projects, view workload distribution, and
          track assignment details.
        </p>
      </div>

      <StaffAssignmentInventory />
    </div>
  );
}
