"use server";

import {
  fetchDeedOfAssignment as fetchDeedOfAssignmentAdapter,
  getDeedOfAssignmentById as getDeedOfAssignmentByIdAdapter,
  createDeedOfAssignment as createDeedOfAssignmentAdapter,
  updateDeedOfAssignment as updateDeedOfAssignmentAdapter,
  deleteDeedOfAssignment as deleteDeedOfAssignmentAdapter,
} from "./deed-of-assignment-adapter";
import {
  DeedOfAssignmentType,
  DeedOfAssignmentFilterType,
} from "../schemas/deed-of-assignment";

// Enhanced error handling for server actions
const withErrorHandling = async <T>(
  actionName: string,
  fn: () => Promise<T>
): Promise<T> => {
  try {
    console.log(`Server action ${actionName} started`);
    const result = await fn();
    console.log(`Server action ${actionName} completed successfully`);
    return result;
  } catch (error) {
    console.error(`Server action ${actionName} failed:`, error);
    throw error;
  }
};

// Fetch deed of assignment records with filtering and pagination
export async function fetchDeedOfAssignment(
  filters: DeedOfAssignmentFilterType,
  options?: {
    sortBy?: string;
    sortDirection?: "asc" | "desc";
    page?: number;
    limit?: number;
  }
): Promise<{ data: DeedOfAssignmentType[]; total: number }> {
  return withErrorHandling("fetchDeedOfAssignment", async () => {
    console.log("Server action - fetchDeedOfAssignment - Request params:", {
      filters,
      options,
    });

    try {
      const startTime = Date.now(); // Add timing measurement
      const result = await fetchDeedOfAssignmentAdapter(filters, options);
      const duration = Date.now() - startTime;
      console.log(
        `Server action - fetchDeedOfAssignment - Query completed in ${duration}ms`
      );

      if (!result || typeof result !== "object") {
        console.error(
          "Server action - fetchDeedOfAssignment - Invalid result format:",
          result
        );
        return { data: [], total: 0 };
      }

      if (!Array.isArray(result.data)) {
        console.error(
          "Server action - fetchDeedOfAssignment - Result data is not an array:",
          result
        );
        return { data: [], total: 0 };
      }

      console.log(
        "Server action - fetchDeedOfAssignment - Successfully returned",
        result.data.length,
        "records out of total",
        result.total
      );

      // Add sample of first record for debugging (if available)
      if (result.data.length > 0) {
        const sampleRecord = { ...result.data[0] };
        // Sanitize sensitive data
        console.log(
          "Server action - fetchDeedOfAssignment - Sample record:",
          sampleRecord
        );
      } else {
        console.log(
          "Server action - fetchDeedOfAssignment - No records returned"
        );
      }

      return result;
    } catch (error) {
      console.error(
        "Server action - fetchDeedOfAssignment - Adapter call failed:",
        error
      );

      if (error instanceof Error) {
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }

      return { data: [], total: 0 };
    }
  });
}

// Get deed of assignment by ID
export async function getDeedOfAssignmentById(
  id: string
): Promise<DeedOfAssignmentType | null> {
  return withErrorHandling("getDeedOfAssignmentById", async () => {
    console.log("Server action - getDeedOfAssignmentById", { id });
    return getDeedOfAssignmentByIdAdapter(id);
  });
}

// Create new deed of assignment record
export async function createDeedOfAssignment(
  data: Omit<DeedOfAssignmentType, "deedId" | "createdAt" | "updatedAt">
): Promise<string> {
  return withErrorHandling("createDeedOfAssignment", async () => {
    // Sanitize data for logging
    const logData = { ...data };
    console.log("Server action - createDeedOfAssignment", {
      data: logData,
      creatorsType: typeof data.creators,
    });
    return createDeedOfAssignmentAdapter(data);
  });
}

// Update deed of assignment record
export async function updateDeedOfAssignment(
  id: string,
  data: Partial<DeedOfAssignmentType>
): Promise<void> {
  return withErrorHandling("updateDeedOfAssignment", async () => {
    // Sanitize data for logging
    const logData = { ...data };
    console.log("Server action - updateDeedOfAssignment", {
      id,
      data: logData,
      creatorsType: typeof data.creators,
    });
    return updateDeedOfAssignmentAdapter(id, data);
  });
}

// Delete deed of assignment record
export async function deleteDeedOfAssignment(id: string): Promise<void> {
  return withErrorHandling("deleteDeedOfAssignment", async () => {
    console.log("Server action - deleteDeedOfAssignment", { id });
    return deleteDeedOfAssignmentAdapter(id);
  });
}
