"use server";

import { db } from "@/drizzle/db";
import {
  patentSearchReport,
  patentUtilityModelApplication,
  ipDisclosure,
  ipDisclosureInventor,
} from "@/drizzle/migrations/schema";
import { eq, desc, asc, SQL, sql, like, and, or } from "drizzle-orm";

type SearchReportParams = {
  page: number;
  limit: number;
  sortBy: string;
  sortDirection: "asc" | "desc";
  searchQuery?: string;
};

export async function getSearchReportData({
  page,
  limit,
  sortBy,
  sortDirection,
  searchQuery,
}: SearchReportParams) {
  try {
    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Prepare search conditions
    let whereConditions: SQL[] = [];
    if (searchQuery) {
      const likeQuery = `%${searchQuery}%`;
      whereConditions.push(
        sql`${like(patentUtilityModelApplication.title, likeQuery)} OR EXISTS (
          SELECT 1 FROM ${ipDisclosureInventor}
          WHERE ${ipDisclosureInventor.disclosureId} = ${
          patentSearchReport.disclosureId
        }
          AND (
            LOWER(${ipDisclosureInventor.firstName}) LIKE LOWER(${likeQuery}) OR
            LOWER(${ipDisclosureInventor.lastName}) LIKE LOWER(${likeQuery})
          )
        )`
      );
    }

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(patentSearchReport)
      .leftJoin(
        patentUtilityModelApplication,
        eq(patentSearchReport.patentId, patentUtilityModelApplication.patentId)
      )
      .where(whereConditions.length ? and(...whereConditions) : sql`TRUE`);

    const totalCount = countResult[0]?.count || 0;

    // Create a query builder function
    const createQuery = () => {
      return db
        .select({
          searchReport: patentSearchReport,
          patent: patentUtilityModelApplication,
          disclosure: ipDisclosure,
        })
        .from(patentSearchReport)
        .leftJoin(
          patentUtilityModelApplication,
          eq(
            patentSearchReport.patentId,
            patentUtilityModelApplication.patentId
          )
        )
        .leftJoin(
          ipDisclosure,
          eq(patentSearchReport.disclosureId, ipDisclosure.disclosureId)
        )
        .where(whereConditions.length ? and(...whereConditions) : sql`TRUE`)
        .limit(limit)
        .offset(offset);
    };

    // Execute the query with appropriate sorting
    let reports;

    if (sortBy === "searchDate") {
      reports = await (sortDirection === "asc"
        ? createQuery().orderBy(asc(patentSearchReport.searchDate))
        : createQuery().orderBy(desc(patentSearchReport.searchDate)));
    } else if (sortBy === "patent.title") {
      reports = await (sortDirection === "asc"
        ? createQuery().orderBy(asc(patentUtilityModelApplication.title))
        : createQuery().orderBy(desc(patentUtilityModelApplication.title)));
    } else if (sortBy === "createdAt") {
      reports = await (sortDirection === "asc"
        ? createQuery().orderBy(asc(patentSearchReport.createdAt))
        : createQuery().orderBy(desc(patentSearchReport.createdAt)));
    } else {
      // Default sort
      reports = await createQuery().orderBy(desc(patentSearchReport.createdAt));
    }

    // For each search report, fetch inventors
    const searchReportsWithInventors = await Promise.all(
      reports.map(async (report) => {
        // Fetch inventors for this disclosure
        const inventors = await db
          .select()
          .from(ipDisclosureInventor)
          .where(
            eq(
              ipDisclosureInventor.disclosureId,
              report.searchReport.disclosureId
            )
          );

        // Format data to match the component's expected structure
        return {
          searchId: report.searchReport.searchId,
          disclosureId: report.searchReport.disclosureId,
          patentId: report.searchReport.patentId,
          searchStrings: (report.searchReport.searchStrings as any[]) || [],
          relevantDocuments:
            (report.searchReport.relevantDocuments as any[]) || [],
          searchDatabases:
            (report.searchReport.searchDatabases as string[]) || [],
          searchDate: report.searchReport.searchDate || "",
          searchSummary: report.searchReport.searchSummary || "",
          certification: report.searchReport.certification as {
            reviewedBy: string;
            submittedTo: {
              name: string;
              position: string;
            };
            technicalExpert: string;
          },
          createdAt: String(report.searchReport.createdAt || ""),
          updatedAt: String(report.searchReport.updatedAt || ""),
          patent: report.patent
            ? {
                title: report.patent.title,
                type: report.patent.type,
              }
            : undefined,
          inventors: inventors.map((inventor) => ({
            firstName: inventor.firstName,
            middleInitial: inventor.middleInitial,
            lastName: inventor.lastName,
          })),
        };
      })
    );

    return {
      data: searchReportsWithInventors,
      total: totalCount,
    };
  } catch (error) {
    console.error("Error in getSearchReportData:", error);
    return {
      data: [],
      total: 0,
    };
  }
}

type SearchReportUpdateParams = {
  searchId: string;
  searchStrings?: any[];
  relevantDocuments?: any[];
  searchDatabases?: string[];
  searchDate?: string;
  searchSummary?: string;
  certification?: {
    reviewedBy: string;
    submittedTo: {
      name: string;
      position: string;
    };
    technicalExpert: string;
  };
};

export async function updateSearchReport(params: SearchReportUpdateParams) {
  try {
    const { searchId, ...updateFields } = params;

    // Build the update object based on provided fields
    const updateData: Record<string, any> = {};

    // Process each field for the update
    Object.entries(updateFields).forEach(([key, value]) => {
      if (value !== undefined) {
        // Special handling for date fields
        if (key === "searchDate" && typeof value === "string") {
          // Parse the date string to ensure valid format
          updateData[key] = new Date(value).toISOString();
        } else {
          updateData[key] = value;
        }
      }
    });

    // Add updatedAt timestamp as ISO string
    updateData.updatedAt = new Date().toISOString();

    console.log("Search report update data:", JSON.stringify(updateData));

    // Only proceed if there are fields to update
    if (Object.keys(updateData).length === 0) {
      return { success: false, message: "No fields to update" };
    }

    // Perform direct database update
    try {
      await db
        .update(patentSearchReport)
        .set(updateData)
        .where(eq(patentSearchReport.searchId, searchId));

      console.log("Search report updated successfully for ID:", searchId);
      return {
        success: true,
        message: "Search report updated successfully",
      };
    } catch (dbError) {
      console.error("Database error updating search report:", dbError);
      return {
        success: false,
        message: `Database error: ${
          dbError instanceof Error ? dbError.message : String(dbError)
        }`,
      };
    }
  } catch (error) {
    console.error("Error updating search report:", error);
    return {
      success: false,
      message: `Failed to update search report: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}
