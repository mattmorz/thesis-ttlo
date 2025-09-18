"use server";

import { db } from "@/drizzle/db";
import {
  patentMatrixSample,
  patentUtilityModelApplication,
  ipDisclosure,
  ipDisclosureInventor,
} from "@/drizzle/migrations/schema";
import { eq, desc, asc, SQL, sql, like, and, or } from "drizzle-orm";

type MatrixSampleParams = {
  page: number;
  limit: number;
  sortBy: string;
  sortDirection: "asc" | "desc";
  searchQuery?: string;
};

// Define the expected structure for priorArts
type PriorArts = {
  patents: string[];
  papers: string[];
  products: string[];
};

// Define the expected structure for matrixData
type MatrixData = {
  rows: string[];
  columns: string[];
  data: boolean[][];
};

// New type for matrix update params
type MatrixUpdateParams = {
  matrixId: string;
  inventionTitle?: string;
  analysisSummary?: string;
  conclusion?: string;
};

export async function getMatrixSampleData({
  page,
  limit,
  sortBy,
  sortDirection,
  searchQuery,
}: MatrixSampleParams) {
  try {
    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Prepare search conditions
    let whereConditions: SQL[] = [];
    if (searchQuery) {
      const likeQuery = `%${searchQuery}%`;
      whereConditions.push(
        sql`${like(patentUtilityModelApplication.title, likeQuery)} OR
            ${like(patentMatrixSample.inventionTitle, likeQuery)} OR 
            EXISTS (
              SELECT 1 FROM ${ipDisclosureInventor}
              WHERE ${ipDisclosureInventor.disclosureId} = ${
          patentMatrixSample.disclosureId
        }
              AND (
                LOWER(${
                  ipDisclosureInventor.firstName
                }) LIKE LOWER(${likeQuery}) OR
                LOWER(${ipDisclosureInventor.lastName}) LIKE LOWER(${likeQuery})
              )
            )`
      );
    }

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(patentMatrixSample)
      .leftJoin(
        patentUtilityModelApplication,
        eq(patentMatrixSample.patentId, patentUtilityModelApplication.patentId)
      )
      .where(whereConditions.length ? and(...whereConditions) : sql`TRUE`);

    const totalCount = countResult[0]?.count || 0;

    // Create a query builder function
    const createQuery = () => {
      return db
        .select({
          matrixSample: patentMatrixSample,
          patent: patentUtilityModelApplication,
          disclosure: ipDisclosure,
        })
        .from(patentMatrixSample)
        .leftJoin(
          patentUtilityModelApplication,
          eq(
            patentMatrixSample.patentId,
            patentUtilityModelApplication.patentId
          )
        )
        .leftJoin(
          ipDisclosure,
          eq(patentMatrixSample.disclosureId, ipDisclosure.disclosureId)
        )
        .where(whereConditions.length ? and(...whereConditions) : sql`TRUE`)
        .limit(limit)
        .offset(offset);
    };

    // Execute the query with appropriate sorting
    let matrixSamples;

    if (sortBy === "inventionTitle") {
      matrixSamples = await (sortDirection === "asc"
        ? createQuery().orderBy(asc(patentMatrixSample.inventionTitle))
        : createQuery().orderBy(desc(patentMatrixSample.inventionTitle)));
    } else if (sortBy === "patent.title") {
      matrixSamples = await (sortDirection === "asc"
        ? createQuery().orderBy(asc(patentUtilityModelApplication.title))
        : createQuery().orderBy(desc(patentUtilityModelApplication.title)));
    } else if (sortBy === "createdAt") {
      matrixSamples = await (sortDirection === "asc"
        ? createQuery().orderBy(asc(patentMatrixSample.createdAt))
        : createQuery().orderBy(desc(patentMatrixSample.createdAt)));
    } else {
      // Default sort
      matrixSamples = await createQuery().orderBy(
        desc(patentMatrixSample.createdAt)
      );
    }

    // For each matrix sample, fetch inventors
    const matrixSamplesWithInventors = await Promise.all(
      matrixSamples.map(async (sample) => {
        // Fetch inventors for this disclosure
        const inventors = await db
          .select()
          .from(ipDisclosureInventor)
          .where(
            eq(
              ipDisclosureInventor.disclosureId,
              sample.matrixSample.disclosureId
            )
          );

        // Parse jsonb fields with proper type casting
        const rawPriorArts = sample.matrixSample.priorArts as any;
        const priorArts: PriorArts = {
          patents: Array.isArray(rawPriorArts?.patents)
            ? rawPriorArts.patents
            : [],
          papers: Array.isArray(rawPriorArts?.papers)
            ? rawPriorArts.papers
            : [],
          products: Array.isArray(rawPriorArts?.products)
            ? rawPriorArts.products
            : [],
        };

        const features =
          (sample.matrixSample.features as Array<{
            id: string;
            name: string;
          }>) || [];

        const rawMatrixData = sample.matrixSample.matrixData as any;
        const matrixData: MatrixData = {
          rows: Array.isArray(rawMatrixData?.rows) ? rawMatrixData.rows : [],
          columns: Array.isArray(rawMatrixData?.columns)
            ? rawMatrixData.columns
            : [],
          data: Array.isArray(rawMatrixData?.data) ? rawMatrixData.data : [],
        };

        // Format data to match the component's expected structure
        return {
          matrixId: sample.matrixSample.matrixId,
          disclosureId: sample.matrixSample.disclosureId,
          patentId: sample.matrixSample.patentId,
          inventionTitle: sample.matrixSample.inventionTitle,
          priorArts,
          features,
          matrixData,
          analysisSummary: sample.matrixSample.analysisSummary,
          conclusion: sample.matrixSample.conclusion,
          createdAt: String(sample.matrixSample.createdAt || ""),
          updatedAt: String(sample.matrixSample.updatedAt || ""),
          patent: sample.patent
            ? {
                title: sample.patent.title,
                type: sample.patent.type,
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
      data: matrixSamplesWithInventors,
      total: totalCount,
    };
  } catch (error) {
    console.error("Error in getMatrixSampleData:", error);
    return {
      data: [],
      total: 0,
    };
  }
}

export async function updateMatrixSample({
  matrixId,
  inventionTitle,
  analysisSummary,
  conclusion,
}: MatrixUpdateParams) {
  try {
    // Build the update object based on provided fields
    const updateData: Record<string, any> = {};

    if (inventionTitle !== undefined) {
      updateData.inventionTitle = inventionTitle;
    }

    if (analysisSummary !== undefined) {
      updateData.analysisSummary = analysisSummary;
    }

    if (conclusion !== undefined) {
      updateData.conclusion = conclusion;
    }

    // Add updatedAt timestamp as ISO string
    updateData.updatedAt = new Date().toISOString();

    console.log("Matrix sample update data:", JSON.stringify(updateData));

    // Only proceed if there are fields to update
    if (Object.keys(updateData).length === 0) {
      return { success: false, message: "No fields to update" };
    }

    // Perform direct database update
    try {
      await db
        .update(patentMatrixSample)
        .set(updateData)
        .where(eq(patentMatrixSample.matrixId, matrixId));

      console.log("Matrix sample updated successfully for ID:", matrixId);
      return {
        success: true,
        message: "Matrix sample updated successfully",
      };
    } catch (dbError) {
      console.error("Database error updating matrix sample:", dbError);
      return {
        success: false,
        message: `Database error: ${
          dbError instanceof Error ? dbError.message : String(dbError)
        }`,
      };
    }
  } catch (error) {
    console.error("Error in updateMatrixSample:", error);
    return {
      success: false,
      message: `Failed to update matrix sample: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}
