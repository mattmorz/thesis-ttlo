"use server";

import { ClientProfileAdapter } from "./client-profile-adapter";
import {
  ClientProfileType,
  ClientProfileFilterType,
} from "../schemas/client-profile";

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

// Fetch client profiles with filtering and pagination
export async function fetchClientProfiles(
  filters: ClientProfileFilterType,
  options?: {
    sortBy?: string;
    sortDirection?: "asc" | "desc";
    page?: number;
    limit?: number;
  }
): Promise<{ data: ClientProfileType[]; total: number }> {
  return withErrorHandling("fetchClientProfiles", async () => {
    console.log("Server action - fetchClientProfiles - Request params:", {
      filters,
      options,
    });

    try {
      console.log("Server action - fetchClientProfiles - Calling adapter");
      const startTime = Date.now(); // Add timing measurement

      const result = await ClientProfileAdapter.fetchClientProfiles(
        filters,
        options
      );

      const duration = Date.now() - startTime;
      console.log(
        `Server action - fetchClientProfiles - Query completed in ${duration}ms`
      );

      // Validate the response format
      if (!result || typeof result !== "object") {
        console.error(
          "Server action - fetchClientProfiles - Invalid result format:",
          result
        );
        return { data: [], total: 0 };
      }

      // Ensure data is an array
      if (!Array.isArray(result.data)) {
        console.error(
          "Server action - fetchClientProfiles - Result data is not an array:",
          result
        );
        return { data: [], total: 0 };
      }

      console.log(
        "Server action - fetchClientProfiles - Successfully returned",
        result.data.length,
        "records out of total",
        result.total
      );

      // Add sample of first record for debugging (if available)
      if (result.data.length > 0) {
        const sampleRecord = { ...result.data[0] };
        // Sanitize sample record to avoid sensitive data and long fields in logs
        if (sampleRecord.mailingAddress)
          sampleRecord.mailingAddress = "[truncated]";

        // Handle complex objects for logging (fixing type errors)
        if (sampleRecord.publishedResearch) {
          sampleRecord.publishedResearch = {
            value: sampleRecord.publishedResearch.value,
            details: "[truncated]",
          };
        }

        if (sampleRecord.developedMaterials) {
          sampleRecord.developedMaterials = {
            value: sampleRecord.developedMaterials.value,
            details: "[truncated]",
          };
        }

        if (sampleRecord.ipExperience) {
          sampleRecord.ipExperience = {
            hasExperience: sampleRecord.ipExperience.hasExperience,
            types: sampleRecord.ipExperience.types
              ? { ...sampleRecord.ipExperience.types }
              : undefined,
          };
        }

        console.log(
          "Server action - fetchClientProfiles - Sample record:",
          sampleRecord
        );
      } else {
        console.log(
          "Server action - fetchClientProfiles - No records returned"
        );
      }

      return result;
    } catch (error) {
      console.error(
        "Server action - fetchClientProfiles - Adapter call failed:",
        error
      );

      // Add more detailed error logging
      if (error instanceof Error) {
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }

      // Return empty data instead of throwing
      return { data: [], total: 0 };
    }
  });
}

// Get client profile by ID
export async function getClientProfileById(
  clientId: string
): Promise<ClientProfileType | null> {
  return withErrorHandling("getClientProfileById", async () => {
    console.log("Server action - getClientProfileById", { clientId });
    return ClientProfileAdapter.getClientProfileById(clientId);
  });
}

// Create new client profile
export async function createClientProfile(
  data: Omit<ClientProfileType, "clientId" | "createdAt" | "updatedAt">
): Promise<string> {
  return withErrorHandling("createClientProfile", async () => {
    console.log("Server action - createClientProfile", { data });
    return ClientProfileAdapter.createClientProfile(data);
  });
}

// Update client profile
export async function updateClientProfile(
  clientId: string,
  data: Partial<ClientProfileType>
): Promise<void> {
  return withErrorHandling("updateClientProfile", async () => {
    console.log("Server action - updateClientProfile", { clientId, data });
    return ClientProfileAdapter.updateClientProfile(clientId, data);
  });
}

// Delete client profile
export async function deleteClientProfile(clientId: string): Promise<void> {
  return withErrorHandling("deleteClientProfile", async () => {
    console.log("Server action - deleteClientProfile", { clientId });
    return ClientProfileAdapter.deleteClientProfile(clientId);
  });
}
