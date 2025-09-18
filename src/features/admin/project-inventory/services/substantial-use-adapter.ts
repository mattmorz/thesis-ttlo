"use server";

import { db } from "@/drizzle/db";
import {
  eq,
  asc,
  desc,
  sql,
  and,
  ilike,
  or,
  isNull,
  gte,
  lte,
} from "drizzle-orm";
import {
  substantialUse,
  userAccount,
  ipApplication,
} from "@/drizzle/migrations/schema";
import {
  SubstantialUseType,
  SubstantialUseFilterType,
} from "../schemas/substantial-use";

const formatDate = (date: Date | string | null): string | undefined => {
  if (!date) return undefined;
  if (typeof date === "string") {
    return date;
  }
  return date.toISOString();
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
  try {
    // Set default values
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const offset = (page - 1) * limit;
    const sortBy = options?.sortBy || "createdAt";
    const sortDirection = options?.sortDirection || "desc";

    // Build the query filters
    let conditions = [];

    if (filters.status && filters.status !== "all") {
      conditions.push(eq(substantialUse.status, filters.status));
    }

    if (filters.userId) {
      conditions.push(eq(substantialUse.userId, filters.userId));
    }

    if (filters.applicationId) {
      conditions.push(eq(substantialUse.applicationId, filters.applicationId));
    }

    if (filters.search) {
      conditions.push(
        or(
          ilike(substantialUse.researchTitle, `%${filters.search}%`),
          sql`${substantialUse.applicants}::text ILIKE ${`%${filters.search}%`}`
        )
      );
    }

    if (filters.startDate) {
      conditions.push(gte(substantialUse.createdAt, filters.startDate));
    }

    if (filters.endDate) {
      conditions.push(lte(substantialUse.createdAt, filters.endDate));
    }

    // Execute the query with all filters
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(substantialUse)
      .where(whereClause);

    const total = countResult[0]?.count || 0;

    // Execute the main query with sorting and pagination
    const query = db
      .select()
      .from(substantialUse)
      .where(whereClause)
      .limit(limit)
      .offset(offset);

    // Apply sorting
    if (sortBy === "researchTitle") {
      query.orderBy(
        sortDirection === "asc"
          ? asc(substantialUse.researchTitle)
          : desc(substantialUse.researchTitle)
      );
    } else if (sortBy === "status") {
      query.orderBy(
        sortDirection === "asc"
          ? asc(substantialUse.status)
          : desc(substantialUse.status)
      );
    } else {
      // Default sort by createdAt
      query.orderBy(
        sortDirection === "asc"
          ? asc(substantialUse.createdAt)
          : desc(substantialUse.createdAt)
      );
    }

    const results = await query;

    // Map the results to the expected format with proper type handling
    const data = results.map((item: any) => ({
      substantialUseId: item.substantialUseId,
      userId: item.userId,
      applicationId: item.applicationId,
      researchTitle: item.researchTitle || "",
      applicants: Array.isArray(item.applicants) ? item.applicants : [],
      laboratoryFacilities: item.laboratoryFacilities || { facilities: [] },
      fundingResources: item.fundingResources || { sources: [] },
      remarks: item.remarks,
      createdAt: formatDate(item.createdAt),
      updatedAt: formatDate(item.updatedAt),
      status: (item.status || "draft") as SubstantialUseType["status"],
    }));

    return { data, total };
  } catch (error) {
    console.error("Error fetching substantial use records:", error);
    throw new Error("Failed to fetch substantial use records");
  }
}

// Get substantial use record by ID
export async function getSubstantialUseById(
  id: string
): Promise<SubstantialUseType | null> {
  try {
    const result = await db
      .select()
      .from(substantialUse)
      .where(eq(substantialUse.substantialUseId, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const item = result[0];

    // Default structures for complex objects
    const defaultLaboratoryFacilities = { facilities: [] };
    const defaultFundingResources = { sources: [] };

    return {
      substantialUseId: item.substantialUseId,
      userId: item.userId || undefined,
      applicationId: item.applicationId || undefined,
      researchTitle: item.researchTitle || "",
      applicants: Array.isArray(item.applicants) ? item.applicants : [],
      laboratoryFacilities: item.laboratoryFacilities
        ? (item.laboratoryFacilities as any)
        : defaultLaboratoryFacilities,
      fundingResources: item.fundingResources
        ? (item.fundingResources as any)
        : defaultFundingResources,
      remarks: item.remarks || undefined,
      createdAt: formatDate(item.createdAt),
      updatedAt: formatDate(item.updatedAt),
      status: (item.status || "draft") as SubstantialUseType["status"],
    };
  } catch (error) {
    console.error("Error fetching substantial use record:", error);
    throw new Error("Failed to fetch substantial use record");
  }
}

// Create new substantial use record
export async function createSubstantialUse(
  data: Omit<SubstantialUseType, "substantialUseId" | "createdAt" | "updatedAt">
): Promise<string> {
  try {
    const now = new Date().toISOString();

    const result = await db
      .insert(substantialUse)
      .values({
        userId: data.userId,
        applicationId: data.applicationId,
        researchTitle: data.researchTitle,
        applicants: data.applicants as any,
        laboratoryFacilities:
          typeof data.laboratoryFacilities === "string"
            ? data.laboratoryFacilities
            : (JSON.stringify(data.laboratoryFacilities) as any),
        fundingResources:
          typeof data.fundingResources === "string"
            ? data.fundingResources
            : (JSON.stringify(data.fundingResources) as any),
        remarks: data.remarks,
        status: data.status || "draft",
        createdAt: now,
        updatedAt: now,
      })
      .returning({ substantialUseId: substantialUse.substantialUseId });

    return result[0]?.substantialUseId || "";
  } catch (error) {
    console.error("Error creating substantial use record:", error);
    throw new Error("Failed to create substantial use record");
  }
}

// Update existing substantial use record
export async function updateSubstantialUse(
  id: string,
  data: Partial<SubstantialUseType>
): Promise<void> {
  try {
    const now = new Date().toISOString();

    await db
      .update(substantialUse)
      .set({
        ...Object.fromEntries(
          Object.entries(data).map(([key, value]) => {
            // Properly stringify the JSON fields if they aren't already strings
            if (key === "laboratoryFacilities" && typeof value !== "string") {
              return [key, JSON.stringify(value)];
            }
            if (key === "fundingResources" && typeof value !== "string") {
              return [key, JSON.stringify(value)];
            }
            return [key, value];
          })
        ),
        updatedAt: now,
      })
      .where(eq(substantialUse.substantialUseId, id));
  } catch (error) {
    console.error("Error updating substantial use record:", error);
    throw new Error("Failed to update substantial use record");
  }
}

// Delete substantial use record
export async function deleteSubstantialUse(id: string): Promise<void> {
  try {
    await db
      .delete(substantialUse)
      .where(eq(substantialUse.substantialUseId, id));
  } catch (error) {
    console.error("Error deleting substantial use record:", error);
    throw new Error("Failed to delete substantial use record");
  }
}
