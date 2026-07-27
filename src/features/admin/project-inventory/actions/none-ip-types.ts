"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/drizzle/db";
import { eq, ilike, and, sql } from "drizzle-orm";
import { ipDisclosure, userAccount } from "@/drizzle/migrations/schema";
import {
  NoneIpTypesInventoryType,
  NoneIpTypesFilterType,
  NoneIpTypesPaginationType,
} from "../schemas/none-ip-types";

/**
 * Fetch IP disclosures with notSure set to true
 * @param filters Filter options for the query
 * @param pagination Pagination options for the query
 * @returns API response with data and optional error
 */
export async function fetchNoneIpTypesInventory(
  filters: NoneIpTypesFilterType,
  pagination: NoneIpTypesPaginationType
): Promise<{
  data: NoneIpTypesInventoryType[];
  total: number;
  error?: string;
}> {
  try {
    // Prepare filter conditions
    const conditions = [];

    // Status filter
    if (filters.status && filters.status !== "all") {
      conditions.push(eq(ipDisclosure.status, filters.status));
    }

    // Always filter for selectedIpTypes containing notSure = true
    conditions.push(
      sql`${ipDisclosure.selectedIpTypes}::jsonb->>'notSure' = 'true'`
    );

    // Search filter
    if (filters.search && filters.search.trim() !== "") {
      const searchTerm = `%${filters.search.trim()}%`;
      conditions.push(sql`${ipDisclosure.email} ILIKE ${searchTerm}`);
    }

    // Calculate pagination
    const skip = (pagination.page - 1) * pagination.limit;

    // Create WHERE clause with all conditions, or true if no conditions
    const whereClause = conditions.length ? and(...conditions) : undefined;

    // Get total count for pagination
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(ipDisclosure)
      .where(whereClause)
      .execute()
      .then((result) => result[0]?.count || 0);

    // Execute the main query with pagination
    const noneIpTypes = await db.query.ipDisclosure.findMany({
      where: whereClause,
      orderBy: (fields, { asc, desc }) => {
        return pagination.sortDirection === "asc"
          ? asc(fields[pagination.sortBy as keyof typeof fields])
          : desc(fields[pagination.sortBy as keyof typeof fields]);
      },
      limit: pagination.limit,
      offset: skip,
    });

    // Map the result to the expected format without using relations that don't exist
    const formattedData = noneIpTypes.map((item) => {
      return {
        id: item.disclosureId,
        ipDisclosureId: item.disclosureId,
        email: item.email || "",
        status: item.status || "draft",
        createdAt: item.createdAt
          ? new Date(item.createdAt).toISOString()
          : undefined,
        updatedAt: item.updatedAt
          ? new Date(item.updatedAt).toISOString()
          : undefined,
        writtenDisclosures: undefined,
        oralDisclosures: undefined,
        futureWork: undefined,
        confirmationDeclaration: false,
      };
    });

    return {
      data: formattedData,
      total: totalCount,
    };
  } catch (error) {
    console.error("Error fetching None IP Types inventory:", error);
    return {
      data: [],
      total: 0,
      error: "Failed to fetch None IP Types inventory",
    };
  }
}

/**
 * Get a specific None IP Type by ID
 * @param id The ID of the None IP Type to retrieve
 * @returns The None IP Type record or null if not found
 */
export async function getNoneIpTypeById(
  id: string
): Promise<NoneIpTypesInventoryType | null> {
  try {
    const result = await db.query.ipDisclosure.findFirst({
      where: (fields, { and, eq }) =>
        and(
          eq(fields.disclosureId, id),
          sql`${fields.selectedIpTypes}::jsonb->>'notSure' = 'true'`
        ),
    });

    if (!result) {
      return null;
    }

    return {
      id: result.disclosureId,
      ipDisclosureId: result.disclosureId,
      email: result.email || "",
      status: result.status || "draft",
      createdAt: result.createdAt
        ? new Date(result.createdAt).toISOString()
        : undefined,
      updatedAt: result.updatedAt
        ? new Date(result.updatedAt).toISOString()
        : undefined,
      writtenDisclosures: undefined,
      oralDisclosures: undefined,
      futureWork: undefined,
      confirmationDeclaration: false,
    };
  } catch (error) {
    console.error("Error fetching None IP Type record:", error);
    return null;
  }
}

/**
 * Update a None IP Type record
 * @param id The ID of the record to update
 * @param data The data to update
 * @returns Success status and any error message
 */
export async function updateNoneIpType(
  id: string,
  data: {
    status?: string;
    confirmation?: {
      writtenDisclosures?: {
        past?: boolean;
        planned?: boolean;
        notApplicable?: boolean;
      };
      oralDisclosures?: {
        past?: boolean;
        planned?: boolean;
        notApplicable?: boolean;
      };
      futureWork?: string;
      confirmationDeclaration?: boolean;
    };
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    if (data.status) {
      await db
        .update(ipDisclosure)
        .set({ status: data.status })
        .where(eq(ipDisclosure.disclosureId, id));
    }

    revalidatePath("/admin/proj-inventory");
    return { success: true };
  } catch (error) {
    console.error("Error updating None IP Type record:", error);
    return { success: false, error: "Failed to update the record" };
  }
}

/**
 * Delete a None IP Type record
 * @param id The ID of the record to delete
 * @returns Success status and any error message
 */
export async function deleteNoneIpType(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Only delete the ipDisclosure record if it exists
    const existingRecord = await db.query.ipDisclosure.findFirst({
      where: (fields, { and, eq }) =>
        and(
          eq(fields.disclosureId, id),
          sql`${fields.selectedIpTypes}::jsonb->>'notSure' = 'true'`
        ),
    });

    if (!existingRecord) {
      return { success: false, error: "Record not found" };
    }

    await db.delete(ipDisclosure).where(eq(ipDisclosure.disclosureId, id));

    revalidatePath("/admin/proj-inventory");
    return { success: true };
  } catch (error) {
    console.error("Error deleting None IP Type record:", error);
    return { success: false, error: "Failed to delete the record" };
  }
}
