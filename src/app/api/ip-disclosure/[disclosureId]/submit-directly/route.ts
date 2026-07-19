import { NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { sql } from "drizzle-orm";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { disclosureId: string } }
) {
  try {
    // Get the disclosure ID from the URL params
    const { disclosureId } = params;

    // Validate the disclosure ID
    if (!disclosureId || typeof disclosureId !== "string") {
      return NextResponse.json(
        { error: "Invalid disclosure ID provided" },
        { status: 400 }
      );
    }

    // Get session to check authorization
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();

    console.log(
      "Processing direct submission for disclosure ID:",
      disclosureId
    );

    // Update the IP disclosure status - only update status and updated_at
    // There is no submission_date column in the database
    const result = await db.execute(
      sql`
        UPDATE ip_disclosure 
        SET 
          status = 'submitted',
          updated_at = NOW()
        WHERE disclosure_id = ${disclosureId}
      `
    );

    console.log("Direct update result:", result);

    return NextResponse.json(
      {
        success: true,
        message: "IP disclosure successfully submitted",
        disclosureId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error submitting IP disclosure directly:", error);

    return NextResponse.json(
      {
        error: "Failed to submit IP disclosure",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
