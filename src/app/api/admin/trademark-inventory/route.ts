import { NextRequest, NextResponse } from "next/server";
import { and, eq, ilike, or, inArray, sql } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
  trademarkApplication,
  ipDisclosure,
  ipDisclosureApplicant,
  userAccount,
} from "@/drizzle/migrations/schema";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortDirection = searchParams.get("sortDirection") || "desc";

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build query filters
    let filters = [];

    if (status && status !== "all") {
      filters.push(eq(ipDisclosure.status, status));
    }

    if (search) {
      filters.push(
        or(
          ilike(trademarkApplication.trademarkName, `%${search}%`),
          ilike(trademarkApplication.description, `%${search}%`),
          ilike(ipDisclosure.email, `%${search}%`)
        )
      );
    }

    // Execute query with filters
    const data = await db
      .select({
        trademark: trademarkApplication,
        disclosure: ipDisclosure,
      })
      .from(trademarkApplication)
      .leftJoin(
        ipDisclosure,
        eq(trademarkApplication.disclosureId, ipDisclosure.disclosureId)
      )
      .where(filters.length > 0 ? and(...filters) : undefined)
      .limit(limit)
      .offset(offset);

    // Get applicants for each trademark
    const disclosureIds = data
      .map((item) => item.disclosure?.disclosureId)
      .filter(Boolean) as string[];

    const applicantsData =
      disclosureIds.length > 0
        ? await db
            .select()
            .from(ipDisclosureApplicant)
            .where(inArray(ipDisclosureApplicant.disclosureId, disclosureIds))
        : [];

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(trademarkApplication)
      .leftJoin(
        ipDisclosure,
        eq(trademarkApplication.disclosureId, ipDisclosure.disclosureId)
      )
      .where(filters.length > 0 ? and(...filters) : undefined);

    // Format response
    const formattedData = data.map((item) => {
      // Find applicants for this disclosure
      const applicants = item.disclosure
        ? applicantsData.filter(
            (applicant) =>
              applicant.disclosureId === item.disclosure?.disclosureId
          )
        : [];

      return {
        trademark: item.trademark,
        disclosure: item.disclosure,
        applicants: applicants,
      };
    });

    // Return formatted data with total count
    return NextResponse.json({
      data: formattedData,
      total: totalCountResult[0]?.count || 0,
    });
  } catch (error) {
    console.error("Error fetching trademark inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch trademark inventory" },
      { status: 500 }
    );
  }
}
