"use server";

import { db } from "@/drizzle/db";
import { and, eq, or, sql, ilike, gte, lte, desc, asc } from "drizzle-orm";
import { deedOfAssignment } from "@/drizzle/migrations/schema";
import {
  DeedOfAssignmentType,
  DeedOfAssignmentFilterType,
} from "../schemas/deed-of-assignment";

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
      conditions.push(eq(deedOfAssignment.status, filters.status));
    }

    if (filters.userId) {
      conditions.push(eq(deedOfAssignment.userId, filters.userId));
    }

    if (filters.applicationId) {
      conditions.push(
        eq(deedOfAssignment.applicationId, filters.applicationId)
      );
    }

    if (filters.search) {
      conditions.push(
        or(
          ilike(deedOfAssignment.researchTitle, `%${filters.search}%`),
          sql`${deedOfAssignment.creators}::text ILIKE ${`%${filters.search}%`}`
        )
      );
    }

    if (filters.startDate) {
      conditions.push(gte(deedOfAssignment.createdAt, filters.startDate));
    }

    if (filters.endDate) {
      conditions.push(lte(deedOfAssignment.createdAt, filters.endDate));
    }

    // Execute the query with all filters
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(deedOfAssignment)
      .where(whereClause);

    const total = countResult[0]?.count || 0;

    // Execute the main query with sorting and pagination
    const query = db
      .select()
      .from(deedOfAssignment)
      .where(whereClause)
      .limit(limit)
      .offset(offset);

    // Apply sorting
    if (sortBy && sortDirection) {
      if (sortDirection === "desc") {
        query.orderBy(desc(deedOfAssignment[sortBy as keyof typeof deedOfAssignment] as any));
      } else {
        query.orderBy(asc(deedOfAssignment[sortBy as keyof typeof deedOfAssignment] as any));
      }
    }

    const data = await query;

    return {
      data: data as unknown as DeedOfAssignmentType[],
      total,
    };
  } catch (error) {
    console.error("Error in fetchDeedOfAssignment:", error);
    throw error;
  }
}

// Get deed of assignment by ID
export async function getDeedOfAssignmentById(
  id: string
): Promise<DeedOfAssignmentType | null> {
  try {
    const records = await db
      .select()
      .from(deedOfAssignment)
      .where(eq(deedOfAssignment.deedId, id))
      .limit(1);

    return records.length > 0
      ? (records[0] as unknown as DeedOfAssignmentType)
      : null;
  } catch (error) {
    console.error("Error in getDeedOfAssignmentById:", error);
    throw error;
  }
}

// Create new deed of assignment record
export async function createDeedOfAssignment(
  data: Omit<DeedOfAssignmentType, "deedId" | "createdAt" | "updatedAt">
): Promise<string> {
  try {
    const result = await db
      .insert(deedOfAssignment)
      .values({
        userId: data.userId,
        applicationId: data.applicationId,
        researchTitle: data.researchTitle,
        creators: data.creators as any,
        creatorAddress: data.creatorAddress,
        assigneeName: data.assigneeName || "CARAGA STATE UNIVERSITY",
        assigneeRepresentative:
          data.assigneeRepresentative || "ROLYN C. DAGUIL, Ph.D.",
        day: data.day,
        month: data.month,
        year: data.year,
        assigneeId: data.assigneeId || "M98 – 009",
        assigneeDate: data.assigneeDate,
        assigneePlace: data.assigneePlace || "Butuan City",
        notarizedDocumentPath: null,
        status: data.status || "draft",
        assignorId: data.assignorId,
        assignorDate: data.assignorDate,
        assignorPlace: data.assignorPlace || "Butuan City",
      })
      .returning({ deedId: deedOfAssignment.deedId });

    return result[0].deedId;
  } catch (error) {
    console.error("Error in createDeedOfAssignment:", error);
    throw error;
  }
}

// Update deed of assignment record
export async function updateDeedOfAssignment(
  id: string,
  data: Partial<DeedOfAssignmentType>
): Promise<void> {
  try {
    const updateData: any = {};

    // Only include defined fields
    if (data.researchTitle !== undefined)
      updateData.researchTitle = data.researchTitle;
    if (data.creators !== undefined) updateData.creators = data.creators;
    if (data.creatorAddress !== undefined)
      updateData.creatorAddress = data.creatorAddress;
    if (data.assigneeName !== undefined)
      updateData.assigneeName = data.assigneeName;
    if (data.assigneeRepresentative !== undefined)
      updateData.assigneeRepresentative = data.assigneeRepresentative;
    if (data.day !== undefined) updateData.day = data.day;
    if (data.month !== undefined) updateData.month = data.month;
    if (data.year !== undefined) updateData.year = data.year;
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
    if (data.assigneeDate !== undefined)
      updateData.assigneeDate = data.assigneeDate;
    if (data.assigneePlace !== undefined)
      updateData.assigneePlace = data.assigneePlace;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.assignorId !== undefined) updateData.assignorId = data.assignorId;
    if (data.assignorDate !== undefined)
      updateData.assignorDate = data.assignorDate;
    if (data.assignorPlace !== undefined)
      updateData.assignorPlace = data.assignorPlace;
    if (data.userId !== undefined) updateData.userId = data.userId;
    if (data.applicationId !== undefined)
      updateData.applicationId = data.applicationId;

    // Add updatedAt timestamp
    updateData.updatedAt = sql`CURRENT_TIMESTAMP`;

    await db
      .update(deedOfAssignment)
      .set(updateData)
      .where(eq(deedOfAssignment.deedId, id));
  } catch (error) {
    console.error("Error in updateDeedOfAssignment:", error);
    throw error;
  }
}

// Delete deed of assignment record
export async function deleteDeedOfAssignment(id: string): Promise<void> {
  try {
    await db.delete(deedOfAssignment).where(eq(deedOfAssignment.deedId, id));
  } catch (error) {
    console.error("Error in deleteDeedOfAssignment:", error);
    throw error;
  }
}
