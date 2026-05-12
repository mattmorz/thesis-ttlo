import { NextRequest, NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { formSubmissionRegistry } from "@/drizzle/migrations/schema";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/form-registry/check
 * Check if a form registry entry exists for the given sourceType and ipApplicationId
 *
 * Query parameters:
 * - sourceType: The source type of the form (required)
 * - ipApplicationId: The application ID (required)
 * - sourceId: Optional source ID to check for a specific entry
 */
export async function GET(req: NextRequest) {
  try {
    console.log("[Form Registry Check API:GET] Starting check process");

    // Get session to validate user
    const session = await auth();
    if (!session?.user?.id) {
      console.log(
        "[Form Registry Check API:GET] Unauthorized - No user session found"
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(req.url);
    const sourceType = url.searchParams.get("sourceType") ?? url.searchParams.get("formType");
    const ipApplicationId =
      url.searchParams.get("ipApplicationId") ?? url.searchParams.get("applicationId");
    const sourceId = url.searchParams.get("sourceId");

    // Validate required parameters
    if (!sourceType || !ipApplicationId) {
      console.log(
        "[Form Registry Check API:GET] Missing required query parameters"
      );
      return NextResponse.json(
        {
          error: "Missing required query parameters",
          detail: "sourceType and ipApplicationId are required",
        },
        { status: 400 }
      );
    }

    console.log(
      `[Form Registry Check API:GET] Checking for registry entry: sourceType=${sourceType}, ipApplicationId=${ipApplicationId}${
        sourceId ? `, sourceId=${sourceId}` : ""
      }`
    );

    // Build query conditions
    let conditions = [
      eq(
        formSubmissionRegistry.sourceType,
        sourceType as
          | "client_profile"
          | "ip_disclosure"
          | "substantial_use"
          | "deed_of_assignment"
          | "other_document"
      ),
      eq(formSubmissionRegistry.ipApplicationId, ipApplicationId),
      eq(formSubmissionRegistry.userId, session.user.id),
    ];

    // Add sourceId condition if provided
    if (sourceId) {
      conditions.push(eq(formSubmissionRegistry.sourceId, sourceId));
    }

    // Check if registry entry exists
    const registryEntry = await db
      .select({ registryId: formSubmissionRegistry.registryId })
      .from(formSubmissionRegistry)
      .where(and(...conditions))
      .limit(1);

    const exists = registryEntry.length > 0;

    console.log(
      `[Form Registry Check API:GET] Check result: exists=${exists}${
        exists ? `, registryId=${registryEntry[0].registryId}` : ""
      }`
    );

    // Return result
    return NextResponse.json({
      exists,
      registryId: exists ? registryEntry[0].registryId : null,
    });
  } catch (error) {
    console.error(
      "[Form Registry Check API:GET] Error checking registry:",
      error
    );

    return NextResponse.json(
      {
        error: "Error checking registry",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
