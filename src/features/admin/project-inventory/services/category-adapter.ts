import { db } from "@/drizzle/db";
import {
  ipApplication,
  userAccount,
  ipDisclosure,
  ipDisclosureInventor,
  ipDisclosureApplicant,
  patentUtilityModelApplication,
  patentSearchReport,
  patentMatrixSample,
  copyrightBasicApplication,
  trademarkApplication,
  tradeSecretApplication,
  clientProfile,
  substantialUse,
  deedOfAssignment,
} from "@/drizzle/migrations/schema";
import {
  eq,
  and,
  desc,
  asc,
  SQL,
  count,
  sql,
  isNotNull,
  inArray,
  or,
  ilike,
} from "drizzle-orm";

/**
 * Adapter for fetching data specific to each IP category
 */
export class CategoryAdapter {
  /**
   * Get Patent/Utility Model disclosures and applications
   */
  static async getPatentUMData(options?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDirection?: "asc" | "desc";
  }): Promise<{ data: any[]; total: number }> {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 15;
      const offset = (page - 1) * limit;
      const sortDir = options?.sortDirection || "desc";
      const sortField = options?.sortBy || "createdAt";

      // First get count for pagination
      const totalResult = await db
        .select({ count: count() })
        .from(ipDisclosure)
        .innerJoin(
          patentUtilityModelApplication,
          eq(
            ipDisclosure.disclosureId,
            patentUtilityModelApplication.disclosureId
          )
        );

      const total = totalResult[0]?.count || 0;

      // Then get the data with related tables
      const result = await db
        .select({
          disclosure: ipDisclosure,
          patentApplication: patentUtilityModelApplication,
          searchReport: {
            id: patentSearchReport.searchId,
            searchDate: patentSearchReport.searchDate,
          },
          matrixSample: {
            id: patentMatrixSample.matrixId,
            inventionTitle: patentMatrixSample.inventionTitle,
            conclusion: patentMatrixSample.conclusion,
          },
        })
        .from(ipDisclosure)
        .innerJoin(
          patentUtilityModelApplication,
          eq(
            ipDisclosure.disclosureId,
            patentUtilityModelApplication.disclosureId
          )
        )
        .leftJoin(
          patentSearchReport,
          eq(
            patentUtilityModelApplication.patentId,
            patentSearchReport.patentId
          )
        )
        .leftJoin(
          patentMatrixSample,
          eq(
            patentUtilityModelApplication.patentId,
            patentMatrixSample.patentId
          )
        )
        .orderBy(
          sortDir === "asc"
            ? asc(ipDisclosure[sortField as keyof typeof ipDisclosure] as any)
            : desc(ipDisclosure[sortField as keyof typeof ipDisclosure] as any)
        )
        .limit(limit)
        .offset(offset);

      // Enhance with inventors for each disclosure
      const enhancedData = await Promise.all(
        result.map(async (item) => {
          const inventors = await db
            .select()
            .from(ipDisclosureInventor)
            .where(
              eq(
                ipDisclosureInventor.disclosureId,
                item.disclosure.disclosureId
              )
            );

          return {
            ...item,
            inventors,
          };
        })
      );

      return {
        data: enhancedData,
        total,
      };
    } catch (error) {
      console.error("Error fetching Patent/UM data:", error);
      throw error;
    }
  }

  /**
   * Get Copyright disclosures and applications
   */
  static async getCopyrightData(options?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDirection?: "asc" | "desc";
    search?: string;
  }): Promise<{ data: any[]; total: number }> {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 15;
      const offset = (page - 1) * limit;
      const sortDir = options?.sortDirection || "desc";
      const sortField = options?.sortBy || "createdAt";
      const searchQuery = options?.search?.trim() || "";

      // Get the data with related tables
      let result;
      let total;

      // If there's a search query, filter results on the application side
      // This is a temporary solution until we resolve the typing issues
      const baseResult = await db
        .select({
          disclosure: ipDisclosure,
          copyrightApplication: copyrightBasicApplication,
        })
        .from(ipDisclosure)
        .innerJoin(
          copyrightBasicApplication,
          eq(ipDisclosure.disclosureId, copyrightBasicApplication.disclosureId)
        );

      // Apply search filter if needed
      if (searchQuery) {
        result = baseResult.filter(
          (item) =>
            item.copyrightApplication.workTitle
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            item.copyrightApplication.workDescription
              .toLowerCase()
              .includes(searchQuery.toLowerCase())
        );
        total = result.length;

        // Apply sorting and pagination
        result = result
          .sort((a, b) => {
            const aValue =
              (a as any)[sortField] ||
              a.disclosure[sortField as keyof typeof a.disclosure];
            const bValue =
              (b as any)[sortField] ||
              b.disclosure[sortField as keyof typeof b.disclosure];
            return sortDir === "asc"
              ? aValue > bValue
                ? 1
                : -1
              : aValue < bValue
              ? 1
              : -1;
          })
          .slice(offset, offset + limit);
      } else {
        // Without search, use database pagination and sorting
        const totalResult = await db
          .select({ count: count() })
          .from(ipDisclosure)
          .innerJoin(
            copyrightBasicApplication,
            eq(
              ipDisclosure.disclosureId,
              copyrightBasicApplication.disclosureId
            )
          );

        total = totalResult[0]?.count || 0;

        result = await db
          .select({
            disclosure: ipDisclosure,
            copyrightApplication: copyrightBasicApplication,
          })
          .from(ipDisclosure)
          .innerJoin(
            copyrightBasicApplication,
            eq(
              ipDisclosure.disclosureId,
              copyrightBasicApplication.disclosureId
            )
          )
          .orderBy(
            sortDir === "asc"
              ? asc(ipDisclosure[sortField as keyof typeof ipDisclosure] as any)
              : desc(
                  ipDisclosure[sortField as keyof typeof ipDisclosure] as any
                )
          )
          .limit(limit)
          .offset(offset);
      }

      // Enhance with inventors
      const enhancedData = await Promise.all(
        result.map(async (item) => {
          const inventors = await db
            .select()
            .from(ipDisclosureInventor)
            .where(
              eq(
                ipDisclosureInventor.disclosureId,
                item.disclosure.disclosureId
              )
            );

          return {
            ...item,
            inventors,
          };
        })
      );

      return {
        data: enhancedData,
        total,
      };
    } catch (error) {
      console.error("Error fetching Copyright data:", error);
      throw error;
    }
  }

  /**
   * Get Trademark disclosures and applications
   */
  static async getTrademarkData(options?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDirection?: "asc" | "desc";
  }): Promise<{ data: any[]; total: number }> {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 15;
      const offset = (page - 1) * limit;
      const sortDir = options?.sortDirection || "desc";
      const sortField = options?.sortBy || "createdAt";

      // Get count for pagination
      const totalResult = await db
        .select({ count: count() })
        .from(ipDisclosure)
        .innerJoin(
          trademarkApplication,
          eq(ipDisclosure.disclosureId, trademarkApplication.disclosureId)
        );

      const total = totalResult[0]?.count || 0;

      // Get the data with related tables
      const result = await db
        .select({
          disclosure: ipDisclosure,
          trademarkApplication: trademarkApplication,
        })
        .from(ipDisclosure)
        .innerJoin(
          trademarkApplication,
          eq(ipDisclosure.disclosureId, trademarkApplication.disclosureId)
        )
        .orderBy(
          sortDir === "asc"
            ? asc(ipDisclosure[sortField as keyof typeof ipDisclosure] as any)
            : desc(ipDisclosure[sortField as keyof typeof ipDisclosure] as any)
        )
        .limit(limit)
        .offset(offset);

      // Enhance with inventors
      const enhancedData = await Promise.all(
        result.map(async (item) => {
          const inventors = await db
            .select()
            .from(ipDisclosureInventor)
            .where(
              eq(
                ipDisclosureInventor.disclosureId,
                item.disclosure.disclosureId
              )
            );

          return {
            ...item,
            inventors,
          };
        })
      );

      return {
        data: enhancedData,
        total,
      };
    } catch (error) {
      console.error("Error fetching Trademark data:", error);
      throw error;
    }
  }

  /**
   * Get Trade Secret disclosures and applications
   */
  static async getTradeSecretData(options?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDirection?: "asc" | "desc";
  }): Promise<{ data: any[]; total: number }> {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 15;
      const offset = (page - 1) * limit;
      const sortDir = options?.sortDirection || "desc";
      const sortField = options?.sortBy || "createdAt";

      // Get count for pagination
      const totalResult = await db
        .select({ count: count() })
        .from(ipDisclosure)
        .innerJoin(
          tradeSecretApplication,
          eq(ipDisclosure.disclosureId, tradeSecretApplication.disclosureId)
        );

      const total = totalResult[0]?.count || 0;

      // Get the data with related tables
      const result = await db
        .select({
          disclosure: ipDisclosure,
          tradeSecretApplication: tradeSecretApplication,
        })
        .from(ipDisclosure)
        .innerJoin(
          tradeSecretApplication,
          eq(ipDisclosure.disclosureId, tradeSecretApplication.disclosureId)
        )
        .orderBy(
          sortDir === "asc"
            ? asc(ipDisclosure[sortField as keyof typeof ipDisclosure] as any)
            : desc(ipDisclosure[sortField as keyof typeof ipDisclosure] as any)
        )
        .limit(limit)
        .offset(offset);

      // Enhance with inventors
      const enhancedData = await Promise.all(
        result.map(async (item) => {
          const inventors = await db
            .select()
            .from(ipDisclosureInventor)
            .where(
              eq(
                ipDisclosureInventor.disclosureId,
                item.disclosure.disclosureId
              )
            );

          return {
            ...item,
            inventors,
          };
        })
      );

      return {
        data: enhancedData,
        total,
      };
    } catch (error) {
      console.error("Error fetching Trade Secret data:", error);
      throw error;
    }
  }

  /**
   * Get Industrial Design / Other disclosures
   */
  static async getIndustrialDesignData(options?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDirection?: "asc" | "desc";
  }): Promise<{ data: any[]; total: number }> {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 15;
      const offset = (page - 1) * limit;
      const sortDir = options?.sortDirection || "desc";
      const sortField = options?.sortBy || "createdAt";

      // Define the types we want to exclude (they are handled by other methods)
      const excludedTypes = [
        "patent",
        "copyright",
        "trademark",
        "trade_secret",
      ];

      // Get count for pagination
      const totalResult = await db
        .select({ count: count() })
        .from(ipDisclosure)
        .where(
          sql`(${ipDisclosure.selectedIpTypes} IS NULL OR NOT EXISTS(
            SELECT 1 FROM jsonb_array_elements_text(${
              ipDisclosure.selectedIpTypes
            })
            WHERE value IN (${excludedTypes.join(",")})
          ))`
        );

      const total = totalResult[0]?.count || 0;

      // Get the data with related tables
      const result = await db
        .select({
          disclosure: ipDisclosure,
        })
        .from(ipDisclosure)
        .where(
          sql`(${ipDisclosure.selectedIpTypes} IS NULL OR NOT EXISTS(
            SELECT 1 FROM jsonb_array_elements_text(${
              ipDisclosure.selectedIpTypes
            })
            WHERE value IN (${excludedTypes.join(",")})
          ))`
        )
        .orderBy(
          sortDir === "asc"
            ? asc(ipDisclosure[sortField as keyof typeof ipDisclosure] as any)
            : desc(ipDisclosure[sortField as keyof typeof ipDisclosure] as any)
        )
        .limit(limit)
        .offset(offset);

      // Enhance with applicants and inventors
      const enhancedData = await Promise.all(
        result.map(async (item) => {
          const applicants = await db
            .select()
            .from(ipDisclosureApplicant)
            .where(
              eq(
                ipDisclosureApplicant.disclosureId,
                item.disclosure.disclosureId
              )
            );

          const inventors = await db
            .select()
            .from(ipDisclosureInventor)
            .where(
              eq(
                ipDisclosureInventor.disclosureId,
                item.disclosure.disclosureId
              )
            );

          return {
            ...item,
            applicants,
            inventors,
          };
        })
      );

      return {
        data: enhancedData,
        total,
      };
    } catch (error) {
      console.error("Error fetching Industrial Design data:", error);
      throw error;
    }
  }

  /**
   * Get Client Profile data
   */
  static async getClientProfileData(options?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDirection?: "asc" | "desc";
  }): Promise<{ data: any[]; total: number }> {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 15;
      const offset = (page - 1) * limit;
      const sortDir = options?.sortDirection || "desc";
      const sortField = options?.sortBy || "createdAt";

      // Get count for pagination
      const totalResult = await db
        .select({ count: count() })
        .from(clientProfile)
        .innerJoin(
          ipApplication,
          eq(clientProfile.ipApplicationId, ipApplication.id)
        );

      const total = totalResult[0]?.count || 0;

      // Get the data with related tables
      const result = await db
        .select({
          clientProfile: clientProfile,
          ipApplication: ipApplication,
          user: {
            id: userAccount.id,
            name: userAccount.name,
            email: userAccount.email,
            role: userAccount.role,
          },
        })
        .from(clientProfile)
        .innerJoin(
          ipApplication,
          eq(clientProfile.ipApplicationId, ipApplication.id)
        )
        .leftJoin(userAccount, eq(clientProfile.userId, userAccount.id))
        .orderBy(
          sortDir === "asc"
            ? asc(clientProfile[sortField as keyof typeof clientProfile] as any)
            : desc(
                clientProfile[sortField as keyof typeof clientProfile] as any
              )
        )
        .limit(limit)
        .offset(offset);

      return {
        data: result,
        total,
      };
    } catch (error) {
      console.error("Error fetching Client Profile data:", error);
      throw error;
    }
  }

  /**
   * Get Substantial Use data
   */
  static async getSubstantialUseData(options?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDirection?: "asc" | "desc";
  }): Promise<{ data: any[]; total: number }> {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 15;
      const offset = (page - 1) * limit;
      const sortDir = options?.sortDirection || "desc";
      const sortField = options?.sortBy || "createdAt";

      // Get count for pagination
      const totalResult = await db
        .select({ count: count() })
        .from(substantialUse)
        .innerJoin(
          ipApplication,
          eq(substantialUse.applicationId, ipApplication.id)
        );

      const total = totalResult[0]?.count || 0;

      // Get the data with related tables
      const result = await db
        .select({
          substantialUse: substantialUse,
          ipApplication: ipApplication,
          user: {
            id: userAccount.id,
            name: userAccount.name,
            email: userAccount.email,
            role: userAccount.role,
          },
        })
        .from(substantialUse)
        .innerJoin(
          ipApplication,
          eq(substantialUse.applicationId, ipApplication.id)
        )
        .leftJoin(userAccount, eq(substantialUse.userId, userAccount.id))
        .orderBy(
          sortDir === "asc"
            ? asc(
                substantialUse[sortField as keyof typeof substantialUse] as any
              )
            : desc(
                substantialUse[sortField as keyof typeof substantialUse] as any
              )
        )
        .limit(limit)
        .offset(offset);

      return {
        data: result,
        total,
      };
    } catch (error) {
      console.error("Error fetching Substantial Use data:", error);
      throw error;
    }
  }

  /**
   * Get Deed of Assignment data
   */
  static async getDeedOfAssignmentData(options?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDirection?: "asc" | "desc";
  }): Promise<{ data: any[]; total: number }> {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 15;
      const offset = (page - 1) * limit;
      const sortDir = options?.sortDirection || "desc";
      const sortField = options?.sortBy || "createdAt";

      // Get count for pagination
      const totalResult = await db
        .select({ count: count() })
        .from(deedOfAssignment)
        .innerJoin(
          ipApplication,
          eq(deedOfAssignment.applicationId, ipApplication.id)
        );

      const total = totalResult[0]?.count || 0;

      // Get the data with related tables
      const result = await db
        .select({
          deedOfAssignment: deedOfAssignment,
          ipApplication: ipApplication,
          user: {
            id: userAccount.id,
            name: userAccount.name,
            email: userAccount.email,
            role: userAccount.role,
          },
        })
        .from(deedOfAssignment)
        .innerJoin(
          ipApplication,
          eq(deedOfAssignment.applicationId, ipApplication.id)
        )
        .leftJoin(userAccount, eq(deedOfAssignment.userId, userAccount.id))
        .orderBy(
          sortDir === "asc"
            ? asc(
                deedOfAssignment[
                  sortField as keyof typeof deedOfAssignment
                ] as any
              )
            : desc(
                deedOfAssignment[
                  sortField as keyof typeof deedOfAssignment
                ] as any
              )
        )
        .limit(limit)
        .offset(offset);

      return {
        data: result,
        total,
      };
    } catch (error) {
      console.error("Error fetching Deed of Assignment data:", error);
      throw error;
    }
  }

  /**
   * Update Patent/UM application data
   */
  static async updatePatentUMData(params: {
    patentId: string;
    title?: string;
    problem?: string;
    solution?: string;
    comparison?: string;
    novelty?: string;
    variations?: string;
    usage?: string;
    literatureReferences?: string;
    ownPublications?: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const { patentId, ...updateFields } = params;

      // Build the update object based on provided fields
      const updateData: Record<string, any> = {};

      Object.entries(updateFields).forEach(([key, value]) => {
        if (value !== undefined) {
          // Handle date fields if added in the future
          if (
            typeof value === "string" &&
            (key.includes("Date") || key.includes("date"))
          ) {
            updateData[key] = new Date(value).toISOString();
          } else {
            updateData[key] = value;
          }
        }
      });

      // Add updatedAt timestamp as ISO string
      updateData.updatedAt = new Date().toISOString();

      console.log("Patent/UM update data:", JSON.stringify(updateData));

      // Only proceed if there are fields to update
      if (Object.keys(updateData).length === 0) {
        return { success: false, message: "No fields to update" };
      }

      // Perform a direct update without the promise race pattern
      try {
        await db
          .update(patentUtilityModelApplication)
          .set(updateData)
          .where(eq(patentUtilityModelApplication.patentId, patentId));

        console.log(
          "Patent/UM application updated successfully for ID:",
          patentId
        );
        return {
          success: true,
          message: "Patent/UM application updated successfully",
        };
      } catch (dbError) {
        console.error("Database error updating Patent/UM data:", dbError);
        return {
          success: false,
          message: `Database error: ${
            dbError instanceof Error ? dbError.message : String(dbError)
          }`,
        };
      }
    } catch (error) {
      console.error("Error updating Patent/UM data:", error);
      return {
        success: false,
        message: `Failed to update Patent/UM application: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

 
}
