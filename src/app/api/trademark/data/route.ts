import { NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Get the disclosure ID from the query string
    const url = new URL(request.url);
    const disclosureId = url.searchParams.get("disclosureId");

    if (!disclosureId) {
      return NextResponse.json(
        { error: "Disclosure ID is required" },
        { status: 400 }
      );
    }

    // First check if the disclosure exists
    const disclosureResult = await db.execute(
      sql`SELECT disclosure_id FROM ip_disclosure WHERE disclosure_id = ${disclosureId}`
    );

    if (disclosureResult.length === 0) {
      return NextResponse.json(
        { error: "Disclosure not found" },
        { status: 404 }
      );
    }

    // Query the trademark_application table
    const result = await db.execute(
      sql`SELECT * FROM trademark_application WHERE disclosure_id = ${disclosureId}`
    );

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Trademark application not found" },
        { status: 404 }
      );
    }

    // Normalize the data from snake_case to camelCase
    const trademarkData = result[0];
    const normalizedData = {
      trademarkId: trademarkData.trademark_id,
      disclosureId: trademarkData.disclosure_id,
      trademarkName: trademarkData.trademark_name,
      description: trademarkData.description,
      translation: trademarkData.translation || "",
      niceClassifications: Array.isArray(trademarkData.nice_classifications)
        ? trademarkData.nice_classifications
        : [],
      businessType: trademarkData.business_type || {
        company: false,
        soleProprietor: false,
      },
      legalName: trademarkData.legal_name,
      createdAt: trademarkData.created_at,
      updatedAt: trademarkData.updated_at,
    };

    return NextResponse.json(normalizedData);
  } catch (error) {
    console.error("Error fetching trademark data:", error);
    return NextResponse.json(
      { error: "Failed to fetch trademark data" },
      { status: 500 }
    );
  }
}
