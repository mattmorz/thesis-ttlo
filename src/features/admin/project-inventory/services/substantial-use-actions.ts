"use server";

import {
  fetchSubstantialUse as fetchSubstantialUseAdapter,
  getSubstantialUseById as getSubstantialUseByIdAdapter,
  createSubstantialUse as createSubstantialUseAdapter,
  updateSubstantialUse as updateSubstantialUseAdapter,
  deleteSubstantialUse as deleteSubstantialUseAdapter,
} from "./substantial-use-adapter";
import {
  SubstantialUseType,
  SubstantialUseFilterType,
} from "../schemas/substantial-use";

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

// Fetch substantial use records with filtering and pagination
export async function fetchSubstantialUse(
  filters: SubstantialUseFilterType,
  options?: {
    sortBy?: string;
    sortDirection?: "asc" | "desc";
    page?: number;
    limit?: number;
  }
): Promise<{ data: SubstantialUseType[]; total: number }> {
  return withErrorHandling("fetchSubstantialUse", async () => {
    console.log("Server action - fetchSubstantialUse - Request params:", {
      filters,
      options,
    });

    try {
      const startTime = Date.now(); // Add timing measurement
      const result = await fetchSubstantialUseAdapter(filters, options);
      const duration = Date.now() - startTime;
      console.log(
        `Server action - fetchSubstantialUse - Query completed in ${duration}ms`
      );

      if (!result || typeof result !== "object") {
        console.error(
          "Server action - fetchSubstantialUse - Invalid result format:",
          result
        );
        return { data: [], total: 0 };
      }

      if (!Array.isArray(result.data)) {
        console.error(
          "Server action - fetchSubstantialUse - Result data is not an array:",
          result
        );
        return { data: [], total: 0 };
      }

      console.log(
        "Server action - fetchSubstantialUse - Successfully returned",
        result.data.length,
        "records out of total",
        result.total
      );

      // Add sample of first record for debugging (if available)
      if (result.data.length > 0) {
        const sampleRecord = { ...result.data[0] };
        // Sanitize sensitive data
        console.log(
          "Server action - fetchSubstantialUse - Sample record:",
          sampleRecord
        );
      } else {
        console.log(
          "Server action - fetchSubstantialUse - No records returned"
        );
      }

      return result;
    } catch (error) {
      console.error(
        "Server action - fetchSubstantialUse - Adapter call failed:",
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

// Get substantial use by ID
export async function getSubstantialUseById(
  id: string
): Promise<SubstantialUseType | null> {
  return withErrorHandling("getSubstantialUseById", async () => {
    console.log("Server action - getSubstantialUseById", { id });
    return getSubstantialUseByIdAdapter(id);
  });
}

// Create new substantial use record
export async function createSubstantialUse(
  data: Omit<SubstantialUseType, "substantialUseId" | "createdAt" | "updatedAt">
): Promise<string> {
  return withErrorHandling("createSubstantialUse", async () => {
    // Sanitize data for logging
    const logData = { ...data };
    console.log("Server action - createSubstantialUse", {
      data: logData,
      laboratoryFacilitiesType: typeof data.laboratoryFacilities,
      fundingResourcesType: typeof data.fundingResources,
    });
    return createSubstantialUseAdapter(data);
  });
}

// Update substantial use record
export async function updateSubstantialUse(
  id: string,
  data: Partial<SubstantialUseType>
): Promise<void> {
  return withErrorHandling("updateSubstantialUse", async () => {
    // Sanitize data for logging
    const logData = { ...data };
    console.log("Server action - updateSubstantialUse", {
      id,
      data: logData,
      laboratoryFacilitiesType: typeof data.laboratoryFacilities,
      fundingResourcesType: typeof data.fundingResources,
    });
    return updateSubstantialUseAdapter(id, data);
  });
}

// Delete substantial use record
export async function deleteSubstantialUse(id: string): Promise<void> {
  return withErrorHandling("deleteSubstantialUse", async () => {
    console.log("Server action - deleteSubstantialUse", { id });
    return deleteSubstantialUseAdapter(id);
  });
}
