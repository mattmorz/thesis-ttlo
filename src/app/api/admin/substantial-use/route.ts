import { NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { eq, and, sql } from "drizzle-orm";
import {
  substantialUse,
  formSubmissionRegistry,
  ipApplication,
} from "@/drizzle/migrations/schema";
import { auth } from "@/auth";
import { checkPermission, bypassPermissions } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

// Helper function to safely get error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// Helper function to test database connection
async function testDatabaseConnection() {
  try {
    console.log("[DB TEST] Testing direct database connection...");

    // Test basic connection with a simple query
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log("[DB TEST] Basic connection test result:", result);

    // Test if we can access the substantialUse table
    const tableTest = await db
      .select({ count: sql`count(*)` })
      .from(substantialUse);
    console.log("[DB TEST] Table access test result:", tableTest);

    return { success: true, message: "Database connection successful" };
  } catch (error) {
    console.error("[DB TEST] Database connection test failed:", error);
    return {
      success: false,
      message: "Database connection failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function POST(req: Request) {
  try {
    console.log("📥 POST /api/admin/substantial-use - Start");

    const session = await auth();
    if (!session?.user?.id) {
      console.error("❌ No user session found");
      return NextResponse.json(
        { error: "Unauthorized: No user session" },
        { status: 401 }
      );
    }

    // Development bypass for admin
    if (bypassPermissions(session)) {
      console.log("[POST] Admin bypass active in development mode");
    } else {
      // Check permissions
      const canSubmit = checkPermission(session, "canSubmit");
      if (!canSubmit) {
        console.log("[POST] Permission denied: User cannot submit form");
        return NextResponse.json(
          { error: "Permission denied: Cannot submit form" },
          { status: 403 }
        );
      }
    }

    // Initialize registry variables that will be used throughout the function
    let registryId = null;
    let registrySuccess = false;
    let registryMessage = "No registry operation attempted";

    const data = await req.json();
    console.log(
      "📦 Received substantial use form data:",
      JSON.stringify(
        {
          userId: session.user.id,
          applicationId: data.applicationId,
          researchTitle: data.researchTitle,
        },
        null,
        2
      )
    );

    const {
      applicants,
      laboratoryFacilities: rawLabFacilities,
      fundingResources: rawFundingResources,
      remarks,
      researchTitle,
      applicationId,
      status = "submitted",
    } = data;

    // Validate required fields
    if (!researchTitle) {
      return NextResponse.json(
        { error: "Research title is required." },
        { status: 400 }
      );
    }

    // If application ID is provided, verify it exists
    if (applicationId) {
      console.log(`🔍 Verifying application ID: ${applicationId}`);
      try {
        const applicationExists = await db.query.ipApplication.findFirst({
          where: eq(ipApplication.id, applicationId),
          columns: { id: true },
        });

        if (!applicationExists) {
          console.error(
            `❌ Application ID ${applicationId} does not exist in the database`
          );
          return NextResponse.json(
            {
              error: "Invalid application ID",
              detail: `Application ID ${applicationId} not found in the database`,
            },
            { status: 400 }
          );
        }
        console.log(`✓ Verified application ID ${applicationId} exists`);
      } catch (err) {
        console.error(
          `❌ Error verifying application ID ${applicationId}:`,
          err
        );
        return NextResponse.json(
          {
            error: "Error validating application ID",
            detail:
              err instanceof Error ? err.message : "Unknown database error",
          },
          { status: 500 }
        );
      }
    }

    // Safely process laboratoryFacilities
    const laboratoryFacilities = (() => {
      try {
        return typeof rawLabFacilities === "string"
          ? rawLabFacilities
          : JSON.stringify(rawLabFacilities || {});
      } catch (e) {
        console.error("[POST] Error stringifying laboratoryFacilities:", e);
        return JSON.stringify({});
      }
    })();

    // Safely process fundingResources
    const fundingResources = (() => {
      try {
        return typeof rawFundingResources === "string"
          ? rawFundingResources
          : JSON.stringify(rawFundingResources || {});
      } catch (e) {
        console.error("[POST] Error stringifying fundingResources:", e);
        return JSON.stringify({});
      }
    })();

    // Test database connection before proceeding
    try {
      console.log(
        "🔄 Testing database connection before substantial use form submission"
      );
      const dbTest = await testDatabaseConnection();
      if (!dbTest.success) {
        console.error("❌ Database connection test failed:", dbTest.error);
        return NextResponse.json(
          { error: "Database connection error. Please try again later." },
          { status: 500 }
        );
      }
      console.log("✓ Database connection test passed");
    } catch (dbTestError) {
      console.error("❌ Database test error:", dbTestError);
      return NextResponse.json(
        { error: "Database connection error. Please try again later." },
        { status: 500 }
      );
    }

    // Check for existing form for this user and application
    let existingRecord = null;
    let result;

    try {
      if (applicationId) {
        console.log(
          `🔍 Checking for existing form for application ID: ${applicationId}`
        );

        // First check if a form is directly associated with this application
        existingRecord = await db.query.substantialUse.findFirst({
          where: and(
            eq(substantialUse.userId, session.user.id),
            eq(substantialUse.applicationId, applicationId)
          ),
        });

        if (existingRecord) {
          console.log(
            `✓ Found existing form with ID: ${existingRecord.substantialUseId}`
          );
        } else {
          console.log("✗ No existing form found for this application");
        }
      }

      if (existingRecord) {
        // Update existing record
        console.log(
          `🔄 Updating existing substantial use record ID: ${existingRecord.substantialUseId}`
        );

        result = await db
          .update(substantialUse)
          .set({
            researchTitle: researchTitle,
            applicants: applicants,
            laboratoryFacilities: laboratoryFacilities,
            fundingResources: fundingResources,
            remarks: remarks,
            status: status,
            applicationId: applicationId,
            updatedAt: new Date().toISOString(),
          })
          .where(
            eq(substantialUse.substantialUseId, existingRecord.substantialUseId)
          )
          .returning();
      } else {
        // Create new record
        console.log(
          `🆕 Creating new substantial use record for user: ${session.user.id}`
        );

        result = await db
          .insert(substantialUse)
          .values({
            userId: session.user.id,
            researchTitle: researchTitle,
            applicants: applicants,
            laboratoryFacilities: laboratoryFacilities,
            fundingResources: fundingResources,
            remarks: remarks,
            status: status,
            applicationId: applicationId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .returning();
      }

      console.log(
        `✅ Substantial use form ${
          existingRecord ? "updated" : "created"
        } successfully: ID ${result[0].substantialUseId}`
      );

      // Handle form registry if application ID is provided
      if (applicationId && result && result.length > 0) {
        console.log(
          `🔗 Registering substantial use form ID ${result[0].substantialUseId} for application ${applicationId}`
        );

        try {
          // Check if a registry entry already exists
          const existingRegistry =
            await db.query.formSubmissionRegistry.findFirst({
              where: and(
                eq(formSubmissionRegistry.ipApplicationId, applicationId),
                eq(formSubmissionRegistry.sourceType, "substantial_use")
              ),
            });

          const registryData = {
            userId: session.user.id,
            sourceType: "substantial_use" as const,
            sourceId: result[0].substantialUseId,
            ipApplicationId: applicationId,
            status: status,
            title: `Substantial Use: ${researchTitle || "Untitled"}`,
            description: "Substantial Use Certification form submission",
            inventorsCreators:
              Array.isArray(applicants) && applicants.length > 0
                ? JSON.stringify(
                    applicants.map((applicant: any) => ({
                      name: `${applicant.firstName || ""} ${
                        applicant.middleInitial || ""
                      } ${applicant.lastName || ""}`.trim(),
                      role: "Applicant",
                    }))
                  )
                : null,
            updatedAt: new Date().toISOString(),
            submittedAt:
              status === "submitted" ? new Date().toISOString() : null,
          };

          if (!existingRegistry) {
            // Create new registry entry
            const registryResult = await db
              .insert(formSubmissionRegistry)
              .values({
                ...registryData,
                createdAt: new Date().toISOString(),
              })
              .returning();

            if (registryResult && registryResult.length > 0) {
              registryId = registryResult[0].registryId;
              registrySuccess = true;
              registryMessage = "Form registry created successfully";
              console.log(`✅ Created form registry entry: ${registryId}`);
            }
          } else {
            // Update existing registry
            const registryResult = await db
              .update(formSubmissionRegistry)
              .set(registryData)
              .where(
                eq(
                  formSubmissionRegistry.registryId,
                  existingRegistry.registryId
                )
              )
              .returning();

            if (registryResult && registryResult.length > 0) {
              registryId = registryResult[0].registryId;
              registrySuccess = true;
              registryMessage = "Form registry updated successfully";
              console.log(`✅ Updated form registry entry: ${registryId}`);
            }
          }
        } catch (registryError) {
          console.error("⚠️ Error with form registry:", registryError);
          registrySuccess = false;
          registryMessage = `Registry error: ${
            registryError instanceof Error
              ? registryError.message
              : "Unknown error"
          }`;

          // Try fallback registry creation with minimal data
          try {
            console.log(
              "🔄 Attempting fallback registry creation with minimal data"
            );
            const fallbackResult = await db
              .insert(formSubmissionRegistry)
              .values({
                userId: session.user.id,
                sourceType: "substantial_use" as const,
                sourceId: result[0].substantialUseId,
                ipApplicationId: applicationId,
                status: status,
                title: "Substantial Use Form",
                updatedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                submittedAt:
                  status === "submitted" ? new Date().toISOString() : null,
              })
              .returning();

            if (fallbackResult && fallbackResult.length > 0) {
              registryId = fallbackResult[0].registryId;
              registrySuccess = true;
              registryMessage = "Form registry created with fallback method";
              console.log(`✅ Fallback registry created: ${registryId}`);
            }
          } catch (fallbackError) {
            console.error(
              "❌ Fallback registry creation also failed:",
              fallbackError
            );
          }
        }
      }

      return NextResponse.json({
        success: true,
        data: result[0],
        registry: {
          success: registrySuccess,
          message: registryMessage,
          registryId: registryId,
        },
      });
    } catch (dbError) {
      console.error("❌ Database operation error:", dbError);
      if (dbError instanceof Error) {
        console.error("Error details:", dbError.message);
        console.error("Stack trace:", dbError.stack);
      }
      return NextResponse.json(
        {
          error: "Failed to submit substantial use form",
          details: getErrorMessage(dbError),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Error in POST /api/admin/substantial-use:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to submit substantial use form",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    console.log("📥 GET /api/admin/substantial-use - Start");

    const session = await auth();
    if (!session?.user?.id) {
      console.error("❌ No user session found");
      return NextResponse.json(
        { error: "Unauthorized: No user session" },
        { status: 401 }
      );
    }

    // Check if the user is admin or staff
    const isAdmin =
      session.user?.role === "admin" || session.user?.role === "ttlo_staff";
    const bypassForAdmin = bypassPermissions(session);

    if (bypassForAdmin) {
      console.log("[GET] Admin bypass active in development mode");
    } else if (!isAdmin) {
      // Check permissions for non-admin users
      const canView = checkPermission(session, "canView");
      if (!canView) {
        console.log("[GET] Permission denied: User cannot view form");
        return NextResponse.json(
          { error: "Permission denied: Cannot view form" },
          { status: 403 }
        );
      }
    }

    // Test database connection before proceeding
    const dbTest = await testDatabaseConnection();
    if (!dbTest.success) {
      console.error(
        "❌ Database connection test failed before processing request"
      );
      return NextResponse.json(
        {
          error: "Database connection failed",
          details: dbTest.error || "Could not connect to database",
        },
        { status: 500 }
      );
    }
    console.log("✓ Database connection test passed");

    // Extract applicationId from URL parameters
    const url = new URL(req.url);
    const applicationId = url.searchParams.get("applicationId");

    if (!applicationId) {
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 }
      );
    }

    console.log(
      `🔍 Fetching substantial use form for application: ${applicationId}`
    );

    // Different query conditions based on user role
    let queryCondition;
    if (isAdmin || bypassForAdmin) {
      // Admin can access any form by applicationId
      queryCondition = eq(substantialUse.applicationId, applicationId);
      console.log("🔑 Admin access - retrieving form by applicationId only");
    } else {
      // Non-admin users can only access their own forms
      queryCondition = and(
        eq(substantialUse.applicationId, applicationId),
        eq(substantialUse.userId, session.user.id)
      );
      console.log(
        "👤 Regular user access - retrieving form by applicationId and userId"
      );
    }

    // Get the record
    let result;
    try {
      result = await db.query.substantialUse.findFirst({
        where: queryCondition,
      });
      console.log("[GET] Query result:", result ? "Found" : "Not found");
    } catch (queryError) {
      console.error("❌ Error querying record:", queryError);

      // Try alternative query method if the query builder fails
      try {
        const records = await db
          .select()
          .from(substantialUse)
          .where(queryCondition);

        result = records.length > 0 ? records[0] : null;
        console.log(
          "📌 Alternative query result:",
          result ? "Found" : "Not found"
        );
      } catch (fallbackError) {
        console.error("❌ Fallback query also failed:", fallbackError);
        return NextResponse.json(
          {
            error: "Database query failed",
            details: getErrorMessage(fallbackError),
          },
          { status: 500 }
        );
      }
    }

    if (!result) {
      console.log(
        `❌ No substantial use form found for application: ${applicationId}`
      );
      return NextResponse.json(
        {
          success: false,
          exists: false,
          message: "No substantial use form found for this application",
        },
        { status: 404 }
      );
    }

    // Check if there's a form registry entry
    let registryId = null;
    try {
      const registryEntry = await db.query.formSubmissionRegistry.findFirst({
        where: and(
          eq(formSubmissionRegistry.ipApplicationId, applicationId),
          eq(formSubmissionRegistry.sourceType, "substantial_use"),
          eq(formSubmissionRegistry.sourceId, result.substantialUseId)
        ),
      });

      if (registryEntry) {
        registryId = registryEntry.registryId;
        console.log(`✓ Found form registry entry: ${registryId}`);
      }
    } catch (registryError) {
      console.error("⚠️ Error checking registry:", registryError);
      // Continue processing without registry ID
    }

    // Normalize the data to ensure consistent format
    const normalizedData = {
      ...result,

      // Ensure these fields are properly formatted
      laboratoryFacilities: (() => {
        if (
          typeof result.laboratoryFacilities === "object" &&
          result.laboratoryFacilities !== null
        ) {
          return result.laboratoryFacilities;
        }
        if (typeof result.laboratoryFacilities === "string") {
          try {
            return JSON.parse(result.laboratoryFacilities);
          } catch (e) {
            console.error("⚠️ Error parsing laboratoryFacilities string:", e);
            return {};
          }
        }
        return {};
      })(),

      fundingResources: (() => {
        if (
          typeof result.fundingResources === "object" &&
          result.fundingResources !== null
        ) {
          return result.fundingResources;
        }
        if (typeof result.fundingResources === "string") {
          try {
            return JSON.parse(result.fundingResources);
          } catch (e) {
            console.error("⚠️ Error parsing fundingResources string:", e);
            return {};
          }
        }
        return {};
      })(),

      // Ensure applicants is an array
      applicants: Array.isArray(result.applicants) ? result.applicants : [],

      // Add registry information
      registryId: registryId,
    };

    console.log("✅ Substantial use form retrieved successfully");

    return NextResponse.json({
      success: true,
      exists: true,
      message: "Substantial use form retrieved successfully",
      data: normalizedData,
    });
  } catch (error) {
    console.error("❌ Error in GET /api/admin/substantial-use:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to retrieve substantial use form",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    console.log("📥 PUT /api/admin/substantial-use - Start");

    const session = await auth();
    if (!session?.user?.id) {
      console.error("❌ No user session found");
      return NextResponse.json(
        { error: "Unauthorized: No user session" },
        { status: 401 }
      );
    }

    // Development bypass for admin
    if (bypassPermissions(session)) {
      console.log("[PUT] Admin bypass active in development mode");
    } else {
      // Check permissions
      const canEdit = checkPermission(session, "canEdit");
      if (!canEdit) {
        console.log("[PUT] Permission denied: User cannot edit form");
        return NextResponse.json(
          { error: "Permission denied: Cannot edit form" },
          { status: 403 }
        );
      }
    }

    // Initialize registry variables
    let registryId = null;
    let registrySuccess = false;
    let registryMessage = "No registry operations performed";

    const data = await req.json();
    console.log(
      "📦 Received form update data:",
      JSON.stringify(
        {
          userId: session.user.id,
          applicationId: data.applicationId,
          researchTitle: data.researchTitle,
        },
        null,
        2
      )
    );

    const {
      applicants,
      laboratoryFacilities: rawLabFacilities,
      fundingResources: rawFundingResources,
      remarks,
      researchTitle,
      status = "draft",
      applicationId,
    } = data;

    // Validate applicationId
    if (!applicationId) {
      return NextResponse.json(
        { error: "Application ID is required for updates" },
        { status: 400 }
      );
    }

    // Safely process laboratoryFacilities
    const laboratoryFacilities = (() => {
      try {
        return typeof rawLabFacilities === "string"
          ? rawLabFacilities
          : JSON.stringify(rawLabFacilities || {});
      } catch (e) {
        console.error("[PUT] Error stringifying laboratoryFacilities:", e);
        return JSON.stringify({});
      }
    })();

    // Safely process fundingResources
    const fundingResources = (() => {
      try {
        return typeof rawFundingResources === "string"
          ? rawFundingResources
          : JSON.stringify(rawFundingResources || {});
      } catch (e) {
        console.error("[PUT] Error stringifying fundingResources:", e);
        return JSON.stringify({});
      }
    })();

    // Find the existing form for this application
    console.log(
      `🔍 Looking for existing form for application ID: ${applicationId}`
    );
    const existingRecord = await db.query.substantialUse.findFirst({
      where: and(
        eq(substantialUse.userId, session.user.id),
        eq(substantialUse.applicationId, applicationId)
      ),
    });

    if (!existingRecord) {
      console.log("❌ No existing form found to update");
      return NextResponse.json(
        { error: "No substantial use form found to update" },
        { status: 404 }
      );
    }

    console.log(
      `🔄 Updating substantial use form ID: ${existingRecord.substantialUseId}`
    );

    // Update the record
    const result = await db
      .update(substantialUse)
      .set({
        researchTitle: researchTitle,
        applicants: applicants,
        laboratoryFacilities: laboratoryFacilities,
        fundingResources: fundingResources,
        remarks: remarks,
        status: status,
        updatedAt: new Date().toISOString(),
      })
      .where(
        eq(substantialUse.substantialUseId, existingRecord.substantialUseId)
      )
      .returning();

    console.log("✅ Substantial use form updated successfully");

    // Update registry entry if it exists
    try {
      const registryEntry = await db.query.formSubmissionRegistry.findFirst({
        where: and(
          eq(formSubmissionRegistry.ipApplicationId, applicationId),
          eq(formSubmissionRegistry.sourceType, "substantial_use"),
          eq(formSubmissionRegistry.sourceId, existingRecord.substantialUseId)
        ),
      });

      if (registryEntry) {
        console.log(`🔄 Updating registry entry: ${registryEntry.registryId}`);

        const registryResult = await db
          .update(formSubmissionRegistry)
          .set({
            status: status,
            title: `Substantial Use: ${researchTitle || "Untitled"}`,
            updatedAt: new Date().toISOString(),
            submittedAt:
              status === "submitted" ? new Date().toISOString() : null,
          })
          .where(
            eq(formSubmissionRegistry.registryId, registryEntry.registryId)
          )
          .returning();

        if (registryResult && registryResult.length > 0) {
          registryId = registryResult[0].registryId;
          registrySuccess = true;
          registryMessage = "Form registry updated successfully";
        }
      } else {
        console.log("⚠️ No registry entry found to update");
      }
    } catch (registryError) {
      console.error("⚠️ Error updating registry:", registryError);
      registrySuccess = false;
      registryMessage = `Registry error: ${
        registryError instanceof Error ? registryError.message : "Unknown error"
      }`;
    }

    return NextResponse.json({
      success: true,
      message: "Substantial use form updated successfully",
      data: result[0],
      registry: {
        success: registrySuccess,
        registryId: registryId,
        message: registryMessage,
      },
    });
  } catch (error) {
    console.error("❌ Error in PUT /api/admin/substantial-use:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to update substantial use form",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    console.log("📥 PATCH /api/admin/substantial-use - Start");

    const session = await auth();
    if (!session?.user?.id) {
      console.error("❌ No user session found");
      return NextResponse.json(
        { error: "Unauthorized: No user session" },
        { status: 401 }
      );
    }

    // Development bypass for admin
    if (bypassPermissions(session)) {
      console.log("[PATCH] Admin bypass active in development mode");
    } else {
      // Check permissions
      const canEdit = checkPermission(session, "canEdit");
      if (!canEdit) {
        console.log("[PATCH] Permission denied: User cannot edit form status");
        return NextResponse.json(
          { error: "Permission denied: Cannot edit form status" },
          { status: 403 }
        );
      }
    }

    const data = await req.json();
    console.log(
      "📦 Received status update data:",
      JSON.stringify(data, null, 2)
    );

    const { status, applicationId } = data;

    // Validate required fields
    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    if (!applicationId) {
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 }
      );
    }

    // Validate status value
    const validStatuses = ["draft", "submitted", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: "Invalid status value",
          details: `Status must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Check if certain status changes require additional permissions
    if (
      (status === "approved" || status === "rejected") &&
      !bypassPermissions(session) &&
      !checkPermission(session, "canApprove")
    ) {
      return NextResponse.json(
        { error: "Permission denied: Cannot approve/reject forms" },
        { status: 403 }
      );
    }

    // Find the form to update
    console.log(`🔍 Looking for form with application ID: ${applicationId}`);

    let queryCondition;
    // Admin can update any form, regular users can only update their own
    if (
      session.user?.role === "admin" ||
      session.user?.role === "ttlo_staff" ||
      bypassPermissions(session)
    ) {
      queryCondition = eq(substantialUse.applicationId, applicationId);
    } else {
      queryCondition = and(
        eq(substantialUse.applicationId, applicationId),
        eq(substantialUse.userId, session.user.id)
      );
    }

    const existingRecord = await db.query.substantialUse.findFirst({
      where: queryCondition,
    });

    if (!existingRecord) {
      console.log("❌ No form found to update status");
      return NextResponse.json(
        { error: "No substantial use form found to update status" },
        { status: 404 }
      );
    }

    console.log(
      `🔄 Updating status to '${status}' for form ID: ${existingRecord.substantialUseId}`
    );

    // Update only the status field
    const result = await db
      .update(substantialUse)
      .set({
        status: status,
        updatedAt: new Date().toISOString(),
      })
      .where(
        eq(substantialUse.substantialUseId, existingRecord.substantialUseId)
      )
      .returning();

    console.log("✅ Status updated successfully");

    // Also update the registry status if it exists
    try {
      const registryEntry = await db.query.formSubmissionRegistry.findFirst({
        where: and(
          eq(formSubmissionRegistry.ipApplicationId, applicationId),
          eq(formSubmissionRegistry.sourceType, "substantial_use")
        ),
      });

      if (registryEntry) {
        console.log(
          `🔄 Updating registry status for entry: ${registryEntry.registryId}`
        );

        await db
          .update(formSubmissionRegistry)
          .set({
            status: status,
            updatedAt: new Date().toISOString(),
            submittedAt:
              status === "submitted"
                ? new Date().toISOString()
                : registryEntry.submittedAt,
          })
          .where(
            eq(formSubmissionRegistry.registryId, registryEntry.registryId)
          );

        console.log("✅ Registry status updated successfully");
      }
    } catch (registryError) {
      console.error("⚠️ Error updating registry status:", registryError);
      // Continue processing without stopping for registry errors
    }

    return NextResponse.json({
      success: true,
      message: "Substantial use form status updated successfully",
      data: result[0],
    });
  } catch (error) {
    console.error("❌ Error in PATCH /api/admin/substantial-use:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to update substantial use form status",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
