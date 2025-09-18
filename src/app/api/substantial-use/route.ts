import { NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { eq } from "drizzle-orm";
import {
  substantialUse,
  formSubmissionRegistry,
} from "@/drizzle/migrations/schema";
import { auth } from "@/auth";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import { checkPermission, bypassPermissions } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

// Add more detailed logging with proper type annotations
function logRequest(
  method: string,
  userId: string,
  data: Record<string, any>
): void {
  console.log(`[${method}] Request received for user: ${userId}`);
  console.log(`[${method}] Request data:`, JSON.stringify(data, null, 2));
}

function logError(method: string, error: Error | unknown): void {
  console.error(`[${method}] Error:`, error);
  if (error instanceof Error) {
    console.error(`[${method}] Error stack:`, error.stack);
  }
}

function logSuccess(method: string, result: Record<string, any>): void {
  console.log(`[${method}] Success:`, result);
}

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

export const POST = auth(async function POST(req) {
  try {
    console.log("[POST] Starting substantial use form submission...");

    // Get the user session
    if (!req.auth) {
      console.log("[POST] Unauthorized: No auth session found");
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Development bypass for admin
    if (bypassPermissions(req.auth)) {
      console.log("[POST] Admin bypass active in development mode");
    } else {
      // Check permissions
      const canSubmit = checkPermission(req.auth, "canSubmit");
      if (!canSubmit) {
        console.log("[POST] Permission denied: User cannot submit form");
        return NextResponse.json(
          { error: "Permission denied: Cannot submit form" },
          { status: 403 }
        );
      }
    }

    const userId = req.auth.user.id;
    if (!userId) {
      console.log("[POST] Unauthorized: No user ID found in auth session");
      return NextResponse.json(
        { error: "User ID not found." },
        { status: 401 }
      );
    }

    // Get the request body
    const body = await req.json();
    const {
      applicants,
      laboratoryFacilities: rawLabFacilities,
      fundingResources: rawFundingResources,
      remarks,
      researchTitle,
      applicationId,
    } = body;

    console.log(
      "[POST] Request body:",
      JSON.stringify(
        {
          userId,
          applicationId,
          researchTitle,
        },
        null,
        2
      )
    );

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

    // Validate required fields
    if (!researchTitle) {
      return NextResponse.json(
        { error: "Research title is required." },
        { status: 400 }
      );
    }

    // Log the applicationId for debugging
    console.log(`[POST] Using applicationId: ${applicationId} for submission`);

    // Test database connection before proceeding
    try {
      const dbTest = await testDatabaseConnection();
      if (!dbTest.success) {
        console.error("[POST] Database connection test failed:", dbTest.error);
        return NextResponse.json(
          { error: "Database connection error. Please try again later." },
          { status: 500 }
        );
      }
    } catch (dbTestError) {
      console.error("[POST] Database test error:", dbTestError);
      return NextResponse.json(
        { error: "Database connection error. Please try again later." },
        { status: 500 }
      );
    }

    // Check if a record already exists for this user and optionally this application
    let queryCondition;
    try {
      if (applicationId) {
        // If applicationId is provided, look for a record with this user and application
        queryCondition = sql`${substantialUse.userId} = ${userId} AND ${substantialUse.applicationId} = ${applicationId}`;
      } else {
        // Otherwise, just look for a record with this user
        queryCondition = eq(substantialUse.userId, userId);
      }

      const existingRecord = await db.query.substantialUse.findFirst({
        where: queryCondition,
      });

      let result;

      if (existingRecord) {
        // Update existing record
        console.log(
          `[POST] Updating existing record for user: ${userId}${
            applicationId ? ` and application: ${applicationId}` : ""
          }`
        );

        // Set the update data
        const updateData: any = {
          researchTitle: researchTitle,
          applicants: applicants,
          laboratoryFacilities: laboratoryFacilities,
          fundingResources: fundingResources,
          remarks: remarks,
          status: "submitted",
          applicationId: applicationId,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        };

        result = await db
          .update(substantialUse)
          .set(updateData)
          .where(queryCondition)
          .returning();
      } else {
        // Create new record
        console.log(
          `[POST] Creating new record for user: ${userId}${
            applicationId ? ` and application: ${applicationId}` : ""
          }`
        );

        result = await db
          .insert(substantialUse)
          .values({
            userId: userId,
            researchTitle: researchTitle,
            applicants: applicants,
            laboratoryFacilities: laboratoryFacilities,
            fundingResources: fundingResources,
            remarks: remarks,
            status: "submitted",
            applicationId: applicationId,
          })
          .returning();
      }

      console.log(
        "[POST] Form submitted successfully:",
        result[0].substantialUseId
      );

      // Add form registry integration directly in the API
      let registrySuccess = false;
      let registryMessage = "";
      let registryId = null;

      // Extract the status from the result or use the default "submitted"
      const formStatus = result[0]?.status || "submitted";

      if (result && result.length > 0 && result[0].substantialUseId) {
        console.log(
          `[API:POST] Registering substantial use ID ${result[0].substantialUseId} for application ${applicationId}`
        );

        try {
          // Force a database connection test before registry operations
          const dbConnectionTest = await testDatabaseConnection();
          if (!dbConnectionTest.success) {
            throw new Error(
              `Database connection test failed: ${dbConnectionTest.message}`
            );
          }

          // Check if a registry entry already exists for this form with exact matches
          console.log(
            `[API:POST] Checking for existing registry by application ID ${applicationId} and source type substantial_use`
          );

          let existingRegistry = null;
          try {
            existingRegistry = await db.query.formSubmissionRegistry.findFirst({
              where: (fields) =>
                eq(fields.ipApplicationId, applicationId) &&
                eq(fields.sourceType, "substantial_use"),
            });

            console.log(
              `[API:POST] Existing registry search result: ${
                existingRegistry ? "Found" : "Not found"
              }`
            );
          } catch (findError) {
            console.error(
              `[API:POST] Error searching for existing registry:`,
              findError
            );
            // Continue with creation as if no registry was found
          }

          // Prepare registry data
          const registryData = {
            userId: userId,
            sourceType: "substantial_use" as const,
            sourceId: result[0].substantialUseId,
            ipApplicationId: applicationId,
            status:
              formStatus === "submitted"
                ? ("submitted" as const)
                : ("draft" as const),
            title: `Substantial Use: ${researchTitle || "Untitled"}`,
            description: `Substantial Use Certification form submission`,
            inventorsCreators:
              Array.isArray(applicants) && applicants.length > 0
                ? JSON.stringify(
                    applicants.map((applicant) => ({
                      name: `${applicant.firstName || ""} ${
                        applicant.middleInitial || ""
                      } ${applicant.lastName || ""}`.trim(),
                      role: "Applicant",
                    }))
                  )
                : null,
            updatedAt: new Date().toISOString(),
            submittedAt:
              formStatus === "submitted" ? new Date().toISOString() : null,
          };

          if (!existingRegistry) {
            // Create a new registry entry
            console.log(
              `[API:POST] Creating new registry entry for substantial use ID: ${result[0].substantialUseId}`
            );

            try {
              const registryResult = await db
                .insert(formSubmissionRegistry)
                .values({
                  userId: userId,
                  sourceType: "substantial_use" as const,
                  sourceId: result[0].substantialUseId,
                  ipApplicationId: applicationId,
                  status:
                    formStatus === "submitted"
                      ? ("submitted" as const)
                      : ("draft" as const),
                  title: `Substantial Use: ${researchTitle || "Untitled"}`,
                  description: `Substantial Use Certification form submission`,
                  inventorsCreators:
                    Array.isArray(applicants) && applicants.length > 0
                      ? JSON.stringify(
                          applicants.map((applicant) => ({
                            name: `${applicant.firstName || ""} ${
                              applicant.middleInitial || ""
                            } ${applicant.lastName || ""}`.trim(),
                            role: "Applicant",
                          }))
                        )
                      : null,
                  updatedAt: new Date().toISOString(),
                  submittedAt:
                    formStatus === "submitted"
                      ? new Date().toISOString()
                      : null,
                })
                .returning();

              console.log(
                "[API:POST] Created form submission registry entry:",
                registryResult
              );
              registrySuccess = true;
              registryMessage = "Form registry created successfully";
              if (registryResult && registryResult.length > 0) {
                registryId = registryResult[0].registryId;
                console.log(`[API:POST] New registry ID: ${registryId}`);
              }
            } catch (insertError) {
              console.error(
                "[API:POST] Error creating registry entry:",
                insertError
              );
              throw insertError; // Re-throw to be caught by outer try/catch
            }
          } else {
            // Update the existing registry entry
            console.log(
              `[API:POST] Updating existing registry entry: ${existingRegistry.registryId}`
            );

            try {
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

              console.log(
                "[API:POST] Updated form submission registry entry:",
                registryResult
              );
              registrySuccess = true;
              registryMessage = "Form registry updated successfully";
              registryId = existingRegistry.registryId;
              console.log(`[API:POST] Updated registry ID: ${registryId}`);
            } catch (updateError) {
              console.error(
                "[API:POST] Error updating registry entry:",
                updateError
              );
              throw updateError; // Re-throw to be caught by outer try/catch
            }
          }
        } catch (registryError) {
          console.error("[API:POST] Error updating registry:", registryError);
          console.error(
            "[API:POST] Error details:",
            registryError instanceof Error
              ? registryError.message
              : String(registryError)
          );
          console.error(
            "[API:POST] Error stack:",
            registryError instanceof Error
              ? registryError.stack
              : "No stack available"
          );

          registrySuccess = false;
          registryMessage = `Error updating form registry: ${
            registryError instanceof Error
              ? registryError.message
              : String(registryError)
          }`;

          // Attempt a fallback registry creation if the error is likely due to missing data
          try {
            console.log(
              "[API:POST] Attempting fallback registry creation with minimal data"
            );
            const fallbackResult = await db
              .insert(formSubmissionRegistry)
              .values({
                userId: userId,
                sourceType: "substantial_use" as const,
                sourceId: result[0].substantialUseId,
                ipApplicationId: applicationId,
                status: "submitted" as const,
                title: "Substantial Use Form",
                updatedAt: new Date().toISOString(),
                submittedAt: new Date().toISOString(),
              })
              .returning();

            if (fallbackResult && fallbackResult.length > 0) {
              registrySuccess = true;
              registryMessage = "Form registry created with fallback method";
              registryId = fallbackResult[0].registryId;
              console.log(
                `[API:POST] Fallback registry created, ID: ${registryId}`
              );
            }
          } catch (fallbackError) {
            console.error(
              "[API:POST] Fallback registry creation also failed:",
              fallbackError
            );
            // Continue even if fallback registry update fails
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
      console.error("[POST] Database operation error:", dbError);
      if (dbError instanceof Error) {
        console.error("[POST] Error details:", dbError.message);
        console.error("[POST] Error stack:", dbError.stack);
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
    console.error("[POST] Error submitting form:", error);
    if (error instanceof Error) {
      console.error("[POST] Error details:", error.message);
      console.error("[POST] Error stack:", error.stack);
    }
    return NextResponse.json(
      {
        error: "Failed to submit substantial use form",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
});

export const PUT = auth(async function PUT(req) {
  try {
    console.log("[PUT] Starting substantial use form update...");

    // Get the user session
    if (!req.auth) {
      console.log("[PUT] Unauthorized: No auth session found");
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Development bypass for admin
    if (bypassPermissions(req.auth)) {
      console.log("[PUT] Admin bypass active in development mode");
    } else {
      // Check permissions
      const canEdit = checkPermission(req.auth, "canEdit");
      if (!canEdit) {
        console.log("[PUT] Permission denied: User cannot edit form");
        return NextResponse.json(
          { error: "Permission denied: Cannot edit form" },
          { status: 403 }
        );
      }
    }

    const userId = req.auth.user.id;
    if (!userId) {
      console.log("[PUT] Unauthorized: No user ID found in auth session");
      return NextResponse.json(
        { error: "User ID not found." },
        { status: 401 }
      );
    }

    // Get the request body
    const body = await req.json();
    const {
      applicants,
      laboratoryFacilities: rawLabFacilities,
      fundingResources: rawFundingResources,
      remarks,
      researchTitle,
      status = "draft",
      applicationId,
    } = body;

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

    // Build the query condition based on applicationId
    let queryCondition;
    if (applicationId) {
      // If applicationId is provided, look for a record with this user and application
      queryCondition = sql`${substantialUse.userId} = ${userId} AND ${substantialUse.applicationId} = ${applicationId}`;
    } else {
      // Otherwise, just look for a record with this user
      queryCondition = eq(substantialUse.userId, userId);
    }

    // Check if a record exists for this user
    const existingRecord = await db.query.substantialUse.findFirst({
      where: queryCondition,
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: "No record found to update" },
        { status: 404 }
      );
    }

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
        applicationId: applicationId,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(queryCondition)
      .returning();

    return NextResponse.json({
      message: "Substantial use form updated successfully",
      data: result[0],
    });
  } catch (error) {
    console.error("[PUT] Error updating substantial use form:", error);
    return NextResponse.json(
      { error: "Failed to update substantial use form" },
      { status: 500 }
    );
  }
});

export const GET = auth(async function GET(req) {
  try {
    console.log("[GET] Starting substantial use form retrieval...");

    // Get the user session
    if (!req.auth) {
      console.log("[GET] Unauthorized: No auth session found");
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Development bypass for admin
    if (bypassPermissions(req.auth)) {
      console.log("[GET] Admin bypass active in development mode");
    } else {
      // Check permissions
      const canView = checkPermission(req.auth, "canView");
      if (!canView) {
        console.log("[GET] Permission denied: User cannot view form");
        return NextResponse.json(
          { error: "Permission denied: Cannot view form" },
          { status: 403 }
        );
      }
    }

    const userId = req.auth.user.id;
    if (!userId) {
      console.log("[GET] Unauthorized: No user ID found in auth session");
      return NextResponse.json(
        { error: "User ID not found." },
        { status: 401 }
      );
    }

    // Test database connection first
    const dbTest = await testDatabaseConnection();
    if (!dbTest.success) {
      console.error(
        "[GET] Database connection test failed before processing request"
      );
      return NextResponse.json(
        {
          error: "Database connection failed",
          details: dbTest.error || "Could not connect to database",
        },
        { status: 500 }
      );
    }
    console.log("[GET] Database connection test passed");

    // Extract applicationId from URL parameters
    const url = new URL(req.url);
    const applicationId = url.searchParams.get("applicationId");

    console.log(
      `[GET] Fetching substantial use form for user: ${userId}${
        applicationId ? ` and application: ${applicationId}` : ""
      }`
    );

    // Build the query condition based on applicationId
    let queryCondition;
    if (applicationId) {
      // If applicationId is provided, look for a record with this user and application
      queryCondition = sql`${substantialUse.userId} = ${userId} AND ${substantialUse.applicationId} = ${applicationId}`;
    } else {
      // Otherwise, just look for a record with this user
      queryCondition = eq(substantialUse.userId, userId);
    }

    // Get the record for this user
    let result;
    try {
      result = await db.query.substantialUse.findFirst({
        where: queryCondition,
      });
      console.log("[GET] Query result:", result ? "Found" : "Not found");
    } catch (queryError) {
      console.error("[GET] Error querying record:", queryError);
      // Try alternative query method if the query builder fails
      const records = await db
        .select()
        .from(substantialUse)
        .where(queryCondition);
      result = records.length > 0 ? records[0] : null;
      console.log(
        "[GET] Alternative query result:",
        result ? "Found" : "Not found"
      );
    }

    if (!result) {
      console.log(
        `[GET] No substantial use form found for user: ${userId}${
          applicationId ? ` and application: ${applicationId}` : ""
        }`
      );
      return NextResponse.json(
        { message: "No substantial use form found for this user" },
        { status: 404 }
      );
    }

    // Normalize the data to ensure consistent format
    const normalizedData = {
      ...result,
      // Ensure these specific fields are present with consistent naming
      researchTitle:
        result.researchTitle || (result as any).research_title || "",

      // Handle laboratory facilities - ensure it's an object
      laboratoryFacilities: (() => {
        if (
          typeof result.laboratoryFacilities === "object" &&
          result.laboratoryFacilities !== null
        ) {
          return result.laboratoryFacilities;
        }
        if (
          typeof (result as any).laboratory_facilities === "object" &&
          (result as any).laboratory_facilities !== null
        ) {
          return (result as any).laboratory_facilities;
        }
        if (typeof result.laboratoryFacilities === "string") {
          try {
            return JSON.parse(result.laboratoryFacilities);
          } catch (e) {
            console.error(
              "[GET] Error parsing laboratoryFacilities string:",
              e
            );
            return {};
          }
        }
        if (typeof (result as any).laboratory_facilities === "string") {
          try {
            return JSON.parse((result as any).laboratory_facilities);
          } catch (e) {
            console.error(
              "[GET] Error parsing laboratory_facilities string:",
              e
            );
            return {};
          }
        }
        return {};
      })(),

      // Handle funding resources - ensure it's an object
      fundingResources: (() => {
        if (
          typeof result.fundingResources === "object" &&
          result.fundingResources !== null
        ) {
          return result.fundingResources;
        }
        if (
          typeof (result as any).funding_resources === "object" &&
          (result as any).funding_resources !== null
        ) {
          return (result as any).funding_resources;
        }
        if (typeof result.fundingResources === "string") {
          try {
            return JSON.parse(result.fundingResources);
          } catch (e) {
            console.error("[GET] Error parsing fundingResources string:", e);
            return {};
          }
        }
        if (typeof (result as any).funding_resources === "string") {
          try {
            return JSON.parse((result as any).funding_resources);
          } catch (e) {
            console.error("[GET] Error parsing funding_resources string:", e);
            return {};
          }
        }
        return {};
      })(),

      remarks: result.remarks || "",
      status: result.status || "draft",
      applicationId: result.applicationId || null,

      // Ensure applicants is an array
      applicants: Array.isArray(result.applicants) ? result.applicants : [],
    };

    console.log("[GET] Normalized data for client:", {
      researchTitle: normalizedData.researchTitle,
      laboratoryFacilitiesType: typeof normalizedData.laboratoryFacilities,
      fundingResourcesType: typeof normalizedData.fundingResources,
      status: normalizedData.status,
      applicationId: normalizedData.applicationId,
    });

    logSuccess("GET", { id: result.substantialUseId });

    return NextResponse.json({
      message: "Substantial use form retrieved successfully",
      data: normalizedData,
    });
  } catch (error) {
    logError("GET", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve substantial use form",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
});

export const PATCH = auth(async function PATCH(req) {
  try {
    console.log("[PATCH] Starting substantial use form status update...");

    // Get the user session
    if (!req.auth) {
      console.log("[PATCH] Unauthorized: No auth session found");
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Development bypass for admin
    if (bypassPermissions(req.auth)) {
      console.log("[PATCH] Admin bypass active in development mode");
    } else {
      // Check permissions
      const canEdit = checkPermission(req.auth, "canEdit");
      if (!canEdit) {
        console.log("[PATCH] Permission denied: User cannot edit form status");
        return NextResponse.json(
          { error: "Permission denied: Cannot edit form status" },
          { status: 403 }
        );
      }
    }

    const userId = req.auth.user.id;
    if (!userId) {
      console.log("[PATCH] Unauthorized: No user ID found in auth session");
      return NextResponse.json(
        { error: "User ID not found." },
        { status: 401 }
      );
    }

    // Get the request body
    const body = await req.json();
    const { status, applicationId } = body;

    console.log("[PATCH] Request body:", {
      userId,
      status,
      applicationId,
    });

    // Validate required fields
    if (!status) {
      return NextResponse.json(
        { error: "Status is required." },
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

    // Build the query condition
    let queryCondition;

    if (applicationId) {
      queryCondition = sql`${substantialUse.userId} = ${userId} AND ${substantialUse.applicationId} = ${applicationId}`;
    } else {
      return NextResponse.json(
        { error: "Either applicationId is required." },
        { status: 400 }
      );
    }

    // Check if a record exists for this query
    const existingRecord = await db.query.substantialUse.findFirst({
      where: queryCondition,
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: "No record found to update status" },
        { status: 404 }
      );
    }

    // Update only the status field
    const result = await db
      .update(substantialUse)
      .set({
        status: status,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(queryCondition)
      .returning();

    console.log("[PATCH] Form status updated successfully:", {
      id: result[0].substantialUseId,
      status: result[0].status,
    });

    return NextResponse.json({
      message: "Substantial use form status updated successfully",
      data: result[0],
    });
  } catch (error) {
    console.error("[PATCH] Error updating form status:", error);
    if (error instanceof Error) {
      console.error("[PATCH] Error details:", error.message);
      console.error("[PATCH] Error stack:", error.stack);
    }
    return NextResponse.json(
      {
        error: "Failed to update substantial use form status",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
});
