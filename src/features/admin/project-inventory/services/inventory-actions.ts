"use server";

import { ProjectInventoryAdapter } from "./db-adapter";
import {
  type BaseInventoryType,
  InventoryFilterType,
} from "../schemas/inventory-base";
import { auth } from "@/auth";

// Server action wrapper for fetchInventory
export async function fetchInventoryItems(
  filters: InventoryFilterType,
  options?: {
    sortBy?: string;
    sortDirection?: "asc" | "desc";
    page?: number;
    limit?: number;
  }
): Promise<{ data: BaseInventoryType[]; total: number }> {
  return ProjectInventoryAdapter.fetchInventory(filters, options);
}

// Server action wrapper for createInventoryItem
export async function createInventoryItem(
  data: Omit<BaseInventoryType, "id" | "applicationId">
): Promise<string> {
  return ProjectInventoryAdapter.createInventoryItem(data);
}

// Server action wrapper for updateInventoryItem
export async function updateInventoryItem(
  id: string,
  data: Partial<BaseInventoryType>
): Promise<void> {
  return ProjectInventoryAdapter.updateInventoryItem(id, data);
}

// Server action wrapper for deleteInventoryItem
export async function deleteInventoryItem(id: string): Promise<void> {
  return ProjectInventoryAdapter.deleteInventoryItem(id);
}

// Server action wrapper for assignStaff
export async function assignStaffToProject(
  applicationId: string,
  userId: string,
  role: string = "project_manager"
): Promise<void> {
  // Get current user's session
  const session = await auth();
  const userRole = session?.user?.role;

  // Verify user has appropriate role
  if (!session || userRole !== "admin") {
    throw new Error(
      "Unauthorized: Only admin users can assign staff to projects"
    );
  }

  return ProjectInventoryAdapter.assignStaff(applicationId, userId, role);
}

// Server action wrapper for unassignStaff
export async function unassignStaffFromProject(
  applicationId: string,
  userId: string
): Promise<void> {
  // Get current user's session
  const session = await auth();
  const userRole = session?.user?.role;

  // Verify user has appropriate role
  if (!session || (userRole !== "admin" && userRole !== "ttlo_staff")) {
    throw new Error(
      "Unauthorized: Only admin and TTLO staff can remove staff from projects"
    );
  }

  return ProjectInventoryAdapter.unassignStaff(applicationId, userId);
}

// Server action wrapper for getAvailableStaff
export async function getAvailableStaff(): Promise<
  Array<{ id: string; name: string; role: string }>
> {
  // Get current user's session
  const session = await auth();
  const userRole = session?.user?.role;

  // Verify user has appropriate role
  if (!session || (userRole !== "admin" && userRole !== "ttlo_staff")) {
    throw new Error(
      "Unauthorized: Only admin and TTLO staff can view available staff"
    );
  }

  return ProjectInventoryAdapter.getAvailableStaff();
}

// Server action to get staff assigned to a project
export async function getAssignedStaff(projectId: string): Promise<
  Array<{
    id: string;
    name: string;
    role: string;
    assignmentRole: string;
    assignedAt: string;
  }>
> {
  try {
    // Get current user's session
    const session = await auth();

    // Verify user is authenticated
    if (!session) {
      throw new Error(
        "Unauthorized: You must be logged in to view staff assignments"
      );
    }

    return ProjectInventoryAdapter.getAssignedStaff(projectId);
  } catch (error) {
    console.error("Error fetching assigned staff:", error);
    throw error;
  }
}
