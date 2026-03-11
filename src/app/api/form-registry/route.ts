import { NextRequest, NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { formSubmissionRegistry } from "@/drizzle/migrations/schema";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { ensureTrackingCodeForApplication } from "@/lib/services/tracking-code-service";

export const dynamic = "force-dynamic";

/**
 * POST /api/form-registry
 * Create or update a form registry entry
 */
export async function POST(req: NextRequest) {
  try {
    console.log("[Form Registry API:POST] Starting registry process");

    const session = await auth();
    if (!session?.user?.id) {
      console.log(
        "[Form Registry API:POST] Unauthorized - No user session found"
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const data = await req.json();

    console.log(
      `[Form Registry API:POST] Processing request for user ${userId}`
    );
    console.log(
      `[Form Registry API:POST] Request data: sourceType=${data.sourceType}, sourceId=${data.sourceId}, ipApplicationId=${data.ipApplicationId}`
    );

    // Validate required fields
    if (!data.sourceType || !data.sourceId) {
      console.log(
        `[Form Registry API:POST] Missing required fields: ${
          !data.sourceType ? "sourceType," : ""
        } ${!data.sourceId ? "sourceId," : ""}`
      );
      return NextResponse.json(
        {
          error: "Missing required fields: sourceType or sourceId",
        },
        { status: 400 }
      );
    }

    // For all source types except ip_disclosure, require ipApplicationId
    if (!data.ipApplicationId && data.sourceType !== "ip_disclosure") {
      console.log(
        `[Form Registry API:POST] Missing required field: ipApplicationId`
      );
      return NextResponse.json(
        {
          error:
            "Missing required field: ipApplicationId is required for this form type",
        },
        { status: 400 }
      );
    }

    // Validate sourceType
    const validSourceTypes = [
      "client_profile",
      "substantial_use",
      "deed_of_assignment",
      "ip_disclosure",
    ];
    if (!validSourceTypes.includes(data.sourceType)) {
      console.log(
        `[Form Registry API:POST] Invalid sourceType: ${data.sourceType}`
      );
      return NextResponse.json(
        {
          error: `Invalid sourceType. Valid values are: ${validSourceTypes.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    console.log(
      `[Form Registry API:POST] Checking for existing registry for ${data.sourceType}:${data.sourceId}`
    );

    // Check if entry already exists
    let existingEntries;
    try {
      existingEntries = await db
        .select({ registryId: formSubmissionRegistry.registryId })
        .from(formSubmissionRegistry)
        .where(
          and(
            eq(formSubmissionRegistry.sourceType, data.sourceType),
            eq(formSubmissionRegistry.sourceId, data.sourceId),
            eq(formSubmissionRegistry.ipApplicationId, data.ipApplicationId)
          )
        );

      console.log(
        `[Form Registry API:POST] Found ${existingEntries.length} existing entries`
      );
    } catch (error) {
      console.error(
        `[Form Registry API:POST] Error checking for existing entries:`,
        error
      );
      return NextResponse.json(
        { error: "Database error while checking for existing entries" },
        { status: 500 }
      );
    }

    let result;

    // Prepare base registry data
    const registryData = {
      userId: userId,
      sourceType: data.sourceType,
      sourceId: data.sourceId,
      ipApplicationId: data.ipApplicationId,
      status: data.status || "draft",
      title: data.title || `${data.sourceType.replace(/_/g, " ")} form`,
      description: data.description,
      inventorsCreators: data.inventorsCreators
        ? JSON.stringify(data.inventorsCreators)
        : null,
      applicants: data.applicants ? JSON.stringify(data.applicants) : null,
      updatedAt: new Date().toISOString(),
    };

    console.log(
      `[Form Registry API:POST] Prepared registry data: status=${registryData.status}, title=${registryData.title}`
    );

    if (existingEntries.length > 0) {
      // Update existing entry
      console.log(
        `[Form Registry API:POST] Updating existing registry: ${existingEntries[0].registryId}`
      );

      try {
        result = await db
          .update(formSubmissionRegistry)
          .set(registryData)
          .where(
            eq(formSubmissionRegistry.registryId, existingEntries[0].registryId)
          )
          .returning();

        console.log(
          `[Form Registry API:POST] Update successful, rows affected:`,
          result.length
        );
        console.log(
          `[Form Registry API:POST] Updated registry ID: ${result[0]?.registryId}`
        );
      } catch (updateError) {
        console.error(
          `[Form Registry API:POST] Error updating registry:`,
          updateError
        );
        return NextResponse.json(
          {
            error: "Failed to update registry entry",
            details:
              updateError instanceof Error
                ? updateError.message
                : String(updateError),
          },
          { status: 500 }
        );
      }

      if (
        registryData.status &&
        ["submitted", "processed", "pending_review"].includes(
          registryData.status
        ) &&
        registryData.ipApplicationId
      ) {
        try {
          await ensureTrackingCodeForApplication(
            registryData.ipApplicationId,
            userId
          );
        } catch (trackingError) {
          console.error(
            "[Form Registry API:POST] Tracking code creation failed:",
            trackingError
          );
        }
      }

      return NextResponse.json({
        success: true,
        data: result[0],
        message: "Registry entry updated successfully",
      });
    } else {
      // Create new entry
      console.log(
        `[Form Registry API:POST] Creating new registry entry for sourceId: ${data.sourceId}`
      );

      // For new entries, create a new object with createdAt
      const newRegistryData = {
        ...registryData,
        createdAt: new Date().toISOString(),
      };

      try {
        result = await db
          .insert(formSubmissionRegistry)
          .values(newRegistryData)
          .returning();

        console.log(
          `[Form Registry API:POST] Creation successful, new registry ID: ${result[0]?.registryId}`
        );
      } catch (createError) {
        console.error(
          `[Form Registry API:POST] Error creating registry:`,
          createError
        );
        console.error(
          `[Form Registry API:POST] Error details:`,
          createError instanceof Error
            ? createError.message
            : String(createError)
        );
        console.error(
          `[Form Registry API:POST] Error stack:`,
          createError instanceof Error
            ? createError.stack
            : "No stack available"
        );

        return NextResponse.json(
          {
            error: "Failed to create registry entry",
            details:
              createError instanceof Error
                ? createError.message
                : String(createError),
          },
          { status: 500 }
        );
      }

      if (
        registryData.status &&
        ["submitted", "processed", "pending_review"].includes(
          registryData.status
        ) &&
        registryData.ipApplicationId
      ) {
        try {
          await ensureTrackingCodeForApplication(
            registryData.ipApplicationId,
            userId
          );
        } catch (trackingError) {
          console.error(
            "[Form Registry API:POST] Tracking code creation failed:",
            trackingError
          );
        }
      }

      return NextResponse.json({
        success: true,
        data: result[0],
        message: "Registry entry created successfully",
      });
    }
  } catch (error) {
    console.error(
      "[Form Registry API:POST] Error creating/updating registry:",
      error
    );
    console.error(
      "[Form Registry API:POST] Error details:",
      error instanceof Error ? error.message : String(error)
    );
    console.error(
      "[Form Registry API:POST] Error stack:",
      error instanceof Error ? error.stack : "No stack available"
    );

    return NextResponse.json(
      {
        error: "Failed to create or update registry entry",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/form-registry
 * Get registry entries for a specific form or application
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const sourceType = url.searchParams.get("sourceType");
    const sourceId = url.searchParams.get("sourceId");
    const applicationId = url.searchParams.get("applicationId");

    // At least one query parameter is required
    if (!sourceType && !sourceId && !applicationId) {
      return NextResponse.json(
        {
          error:
            "At least one filter parameter is required: sourceType, sourceId, or applicationId",
        },
        { status: 400 }
      );
    }

    // Create base condition that user ID must match
    let conditions = [eq(formSubmissionRegistry.userId, session.user.id)];

    // Add additional conditions based on provided parameters
    if (sourceType) {
      // Cast sourceType to ensure it matches the expected type for the enum column
      const validSourceType = sourceType as
        | "client_profile"
        | "substantial_use"
        | "deed_of_assignment"
        | "ip_disclosure"
        | "other_document";
      conditions.push(eq(formSubmissionRegistry.sourceType, validSourceType));
    }

    if (sourceId) {
      conditions.push(eq(formSubmissionRegistry.sourceId, sourceId));
    }

    if (applicationId) {
      conditions.push(
        eq(formSubmissionRegistry.ipApplicationId, applicationId)
      );
    }

    // Execute the query with all conditions
    const entries = await db
      .select()
      .from(formSubmissionRegistry)
      .where(and(...conditions));

    return NextResponse.json({
      success: true,
      data: entries,
    });
  } catch (error) {
    console.error("[Form Registry] Error retrieving registry entries:", error);
    return NextResponse.json(
      { error: "Failed to retrieve registry entries" },
      { status: 500 }
    );
  }
}
