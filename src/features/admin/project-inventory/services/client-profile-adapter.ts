import {
  eq,
  and,
  or,
  desc,
  asc,
  sql,
  isNotNull,
  isNull,
  gte,
  lte,
  SQL,
} from "drizzle-orm";
import { db } from "@/drizzle/db";
import { clientProfile } from "@/drizzle/migrations/schema";
import {
  ClientProfileType,
  ClientProfileFilterType,
} from "../schemas/client-profile";

export class ClientProfileAdapter {
  // Ensure the db import is correctly set up
  static async verifyDbConnection(): Promise<boolean> {
    try {
      console.log("🔌 [ClientProfileAdapter] Verifying database connection...");

      // Try a simple query to see if the database is accessible
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(clientProfile);

      console.log(
        "✅ [ClientProfileAdapter] Database connection successful, count result:",
        result
      );

      // Check if we got a valid result
      if (!result || !Array.isArray(result) || result.length === 0) {
        console.error(
          "❌ [ClientProfileAdapter] Database query returned invalid result:",
          result
        );
        return false;
      }

      // Get the count and convert to number if it's a string
      const rawCount = result[0]?.count;
      // Convert to number if it's a string
      const count =
        typeof rawCount === "string" ? parseInt(rawCount, 10) : rawCount;

      console.log(
        `✅ [ClientProfileAdapter] Database has ${count} records in clientProfile table`
      );
      return true;
    } catch (error) {
      console.error(
        "❌ [ClientProfileAdapter] Database connection failed:",
        error
      );
      console.error("❌ [ClientProfileAdapter] Error details:", {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : "No stack trace",
      });

      // Try to get more information about the database
      try {
        console.log(
          "🔍 [ClientProfileAdapter] Attempting to check database schema..."
        );
        const tables = await db
          .select()
          .from(sql`information_schema.tables`)
          .limit(5);
        console.log(
          "ℹ️ [ClientProfileAdapter] Sample of database tables:",
          tables
        );
      } catch (schemaError) {
        console.error(
          "❌ [ClientProfileAdapter] Failed to check schema:",
          schemaError
        );
      }

      return false;
    }
  }

  // Fetch client profiles with filtering and pagination - simplified version
  static async fetchClientProfiles(
    filters: ClientProfileFilterType,
    options?: {
      sortBy?: string;
      sortDirection?: "asc" | "desc";
      page?: number;
      limit?: number;
    }
  ): Promise<{ data: ClientProfileType[]; total: number }> {
    try {
      console.log("🔍 [ClientProfileAdapter] fetchClientProfiles started");
      console.log("🔍 [ClientProfileAdapter] DB object type:", typeof db);
      console.log(
        "🔍 [ClientProfileAdapter] ClientProfile table:",
        typeof clientProfile
      );

      // Check database connection first
      const isConnected = await ClientProfileAdapter.verifyDbConnection();
      if (!isConnected) {
        console.error(
          "❌ [ClientProfileAdapter] Cannot fetch client profiles: Database connection failed"
        );
        return { data: [], total: 0 };
      }

      console.log("🔍 [ClientProfileAdapter] Fetching all client profiles");

      // Simplified approach: Fetch all records and do filtering in memory
      try {
        console.log("🔍 [ClientProfileAdapter] Executing simplified query");

        // Create base query with only sorting
        let query = db.select().from(clientProfile);

        // Apply sorting
        const sortField = options?.sortBy || "createdAt";
        const sortDirection = options?.sortDirection || "desc";

        // Build the query with sorting - use a more type-safe approach
        let sortedQuery;
        if (sortField === "firstName") {
          sortedQuery =
            sortDirection === "asc"
              ? query.orderBy(asc(clientProfile.firstName))
              : query.orderBy(desc(clientProfile.firstName));
        } else if (sortField === "lastName") {
          sortedQuery =
            sortDirection === "asc"
              ? query.orderBy(asc(clientProfile.lastName))
              : query.orderBy(desc(clientProfile.lastName));
        } else if (sortField === "email") {
          sortedQuery =
            sortDirection === "asc"
              ? query.orderBy(asc(clientProfile.email))
              : query.orderBy(desc(clientProfile.email));
        } else {
          // Default to createdAt
          sortedQuery =
            sortDirection === "asc"
              ? query.orderBy(asc(clientProfile.createdAt))
              : query.orderBy(desc(clientProfile.createdAt));
        }

        // Execute the query
        const allResults = await sortedQuery;
        console.log(
          `📊 [ClientProfileAdapter] Fetched ${allResults.length} total records`
        );

        // Transform the results to match expected ClientProfileType
        const transformedData = allResults.map((profile) => ({
          ...profile,
          // Ensure these fields have the correct shape by parsing the JSON
          publishedResearch:
            typeof profile.publishedResearch === "string"
              ? JSON.parse(profile.publishedResearch)
              : profile.publishedResearch,
          developedMaterials:
            typeof profile.developedMaterials === "string"
              ? JSON.parse(profile.developedMaterials)
              : profile.developedMaterials,
          ipExperience:
            typeof profile.ipExperience === "string"
              ? JSON.parse(profile.ipExperience)
              : profile.ipExperience,
          gender:
            typeof profile.gender === "string"
              ? JSON.parse(profile.gender)
              : profile.gender,
          citizenship:
            typeof profile.citizenship === "string"
              ? JSON.parse(profile.citizenship)
              : profile.citizenship,
          highestDegree:
            typeof profile.highestDegree === "string"
              ? JSON.parse(profile.highestDegree)
              : profile.highestDegree,
          familiarWithIpRights:
            typeof profile.familiarWithIpRights === "string"
              ? JSON.parse(profile.familiarWithIpRights)
              : profile.familiarWithIpRights,
        })) as ClientProfileType[];

        // Apply filtering in memory
        let filteredData = transformedData;

        const {
          status,
          search,
          hasDegree,
          hasPublishedResearch,
          hasIpExperience,
          startDate,
          endDate,
        } = filters;

        // Apply status filter
        if (status && status !== "all") {
          filteredData = filteredData.filter(
            (profile) => profile.status === status
          );
          console.log(
            `🔎 [ClientProfileAdapter] Filtered by status: ${status}, remaining: ${filteredData.length}`
          );
        }

        // Apply search filter
        if (search) {
          const searchLower = search.toLowerCase();
          filteredData = filteredData.filter(
            (profile) =>
              profile.firstName?.toLowerCase().includes(searchLower) ||
              profile.lastName?.toLowerCase().includes(searchLower) ||
              profile.email?.toLowerCase().includes(searchLower)
          );
          console.log(
            `🔎 [ClientProfileAdapter] Filtered by search: "${search}", remaining: ${filteredData.length}`
          );
        }

        // Apply degree filter
        if (hasDegree === true) {
          filteredData = filteredData.filter(
            (profile) => !!profile.degree && profile.degree.trim() !== ""
          );
          console.log(
            `🔎 [ClientProfileAdapter] Filtered for profiles with degrees, remaining: ${filteredData.length}`
          );
        } else if (hasDegree === false) {
          filteredData = filteredData.filter(
            (profile) => !profile.degree || profile.degree.trim() === ""
          );
          console.log(
            `🔎 [ClientProfileAdapter] Filtered for profiles without degrees, remaining: ${filteredData.length}`
          );
        }

        // Apply published research filter
        if (hasPublishedResearch === true) {
          filteredData = filteredData.filter(
            (profile) => profile.publishedResearch?.value === "yes"
          );
          console.log(
            `🔎 [ClientProfileAdapter] Filtered for profiles with published research, remaining: ${filteredData.length}`
          );
        } else if (hasPublishedResearch === false) {
          filteredData = filteredData.filter(
            (profile) =>
              !profile.publishedResearch ||
              profile.publishedResearch.value === "no"
          );
          console.log(
            `🔎 [ClientProfileAdapter] Filtered for profiles without published research, remaining: ${filteredData.length}`
          );
        }

        // Apply IP experience filter
        if (hasIpExperience === true) {
          filteredData = filteredData.filter(
            (profile) => profile.ipExperience?.hasExperience === "yes"
          );
          console.log(
            `🔎 [ClientProfileAdapter] Filtered for profiles with IP experience, remaining: ${filteredData.length}`
          );
        } else if (hasIpExperience === false) {
          filteredData = filteredData.filter(
            (profile) =>
              !profile.ipExperience ||
              profile.ipExperience.hasExperience === "no"
          );
          console.log(
            `🔎 [ClientProfileAdapter] Filtered for profiles without IP experience, remaining: ${filteredData.length}`
          );
        }

        // Apply date range filters
        if (startDate) {
          const startDateObj = new Date(startDate);
          filteredData = filteredData.filter(
            (profile) =>
              profile.createdAt && new Date(profile.createdAt) >= startDateObj
          );
          console.log(
            `🔎 [ClientProfileAdapter] Filtered for profiles created after: ${startDate}, remaining: ${filteredData.length}`
          );
        }

        if (endDate) {
          const endDateObj = new Date(endDate);
          endDateObj.setHours(23, 59, 59, 999);
          filteredData = filteredData.filter(
            (profile) =>
              profile.createdAt && new Date(profile.createdAt) <= endDateObj
          );
          console.log(
            `🔎 [ClientProfileAdapter] Filtered for profiles created before: ${endDate}, remaining: ${filteredData.length}`
          );
        }

        const totalCount = filteredData.length;
        console.log(
          `🔢 [ClientProfileAdapter] Total matching records after filtering: ${totalCount}`
        );

        // Apply pagination in memory if needed
        if (options?.page !== undefined && options?.limit !== undefined) {
          const page = options.page;
          const limit = options.limit;
          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;

          const paginatedData = filteredData.slice(startIndex, endIndex);
          console.log(
            `📄 [ClientProfileAdapter] Applied pagination: page ${page}, limit ${limit}, returned ${paginatedData.length} records`
          );

          return {
            data: paginatedData,
            total: totalCount,
          };
        }

        // Return all filtered data if no pagination
        return {
          data: filteredData,
          total: totalCount,
        };
      } catch (queryError) {
        console.error(
          "Error executing simplified client profiles query:",
          queryError
        );
        // Log more details about the error
        if (queryError instanceof Error) {
          console.error("Error details:", {
            name: queryError.name,
            message: queryError.message,
            stack: queryError.stack,
          });
        }
        return { data: [], total: 0 };
      }
    } catch (error) {
      console.error("Error fetching client profiles:", error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }
      // Return empty data instead of throwing to prevent UI errors
      return { data: [], total: 0 };
    }
  }

  // Get client profile by ID
  static async getClientProfileById(
    clientId: string
  ): Promise<ClientProfileType | null> {
    try {
      const result = await db
        .select()
        .from(clientProfile)
        .where(eq(clientProfile.clientId, clientId))
        .limit(1);

      return (result[0] as ClientProfileType) || null;
    } catch (error) {
      console.error("Error fetching client profile by ID:", error);
      throw new Error("Failed to fetch client profile");
    }
  }

  // Create new client profile
  static async createClientProfile(
    data: Omit<ClientProfileType, "clientId" | "createdAt" | "updatedAt">
  ): Promise<string> {
    try {
      const now = new Date().toISOString();

      const result = await db
        .insert(clientProfile)
        .values({
          firstName: data.firstName,
          middleName: data.middleName,
          lastName: data.lastName,
          userId: data.userId,
          contactNumber: data.contactNumber,
          email: data.email,
          mailingAddress: data.mailingAddress,
          companyName: data.companyName,
          companyEmail: data.companyEmail,
          occupation: data.occupation,
          age: data.age,
          companyStreet: data.companyStreet,
          companyBarangay: data.companyBarangay,
          companyCityMunicipality: data.companyCityMunicipality,
          companyProvince: data.companyProvince,
          degree: data.degree,
          profession: data.profession,
          publishedResearch: data.publishedResearch as any,
          developedMaterials: data.developedMaterials as any,
          ipExperience: data.ipExperience as any,
          status: data.status || "draft",
          gender: data.gender as any,
          citizenship: data.citizenship as any,
          highestDegree: data.highestDegree as any,
          familiarWithIpRights: data.familiarWithIpRights as any,
          // ipApplicationId was removed from schema
          createdAt: now,
          updatedAt: now,
        })
        .returning({ clientId: clientProfile.clientId });

      return result[0]?.clientId || "";
    } catch (error) {
      console.error("Error creating client profile:", error);
      throw new Error("Failed to create client profile");
    }
  }

  // Update existing client profile
  static async updateClientProfile(
    clientId: string,
    data: Partial<ClientProfileType>
  ): Promise<void> {
    try {
      const now = new Date().toISOString();

      await db
        .update(clientProfile)
        .set({
          ...data,
          updatedAt: now,
        })
        .where(eq(clientProfile.clientId, clientId));
    } catch (error) {
      console.error("Error updating client profile:", error);
      throw new Error("Failed to update client profile");
    }
  }

  // Delete client profile
  static async deleteClientProfile(clientId: string): Promise<void> {
    try {
      await db
        .delete(clientProfile)
        .where(eq(clientProfile.clientId, clientId));
    } catch (error) {
      console.error("Error deleting client profile:", error);
      throw new Error("Failed to delete client profile");
    }
  }
}
