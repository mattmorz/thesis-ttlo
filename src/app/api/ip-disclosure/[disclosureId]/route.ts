import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, queryClient } from "@/drizzle/db";
import { appRouter } from "@/trpc/router";
import { ipDisclosure as ipDisclosureTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Add this helper function after imports
function addRateLimitHeaders(
  response: NextResponse,
  remaining: number = 50,
): NextResponse {
  // Add rate limiting headers
  response.headers.set("X-RateLimit-Limit", "60"); // 60 requests per minute
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  response.headers.set(
    "X-RateLimit-Reset",
    Math.floor(Date.now() / 1000 + 60).toString(),
  );

  if (remaining <= 5) {
    // If we're getting close to the limit, add a Retry-After header
    response.headers.set("Retry-After", "5");
  }

  return response;
}

function normalizePersonRows(people: unknown) {
  if (!Array.isArray(people)) return [];

  return people.flatMap((person: any) => {
    if (!person || typeof person !== "object") return [];

    const firstName = String(person.firstName || "").trim();
    const lastName = String(person.lastName || "").trim();

    if (!firstName && !lastName) return [];

    return [
      {
        firstName,
        middleInitial: person.middleInitial
          ? String(person.middleInitial).trim()
          : null,
        lastName,
      },
    ];
  });
}

async function syncDisclosurePeople(
  disclosureId: string,
  applicants: unknown,
  inventors: unknown,
) {
  if (!queryClient) throw new Error("queryClient not available");

  await queryClient`DELETE FROM ip_disclosure_applicant WHERE disclosure_id = ${disclosureId}`;
  await queryClient`DELETE FROM ip_disclosure_inventor WHERE disclosure_id = ${disclosureId}`;

  const normalizedApplicants = normalizePersonRows(applicants);
  for (const applicant of normalizedApplicants) {
    await queryClient`INSERT INTO ip_disclosure_applicant (disclosure_id, first_name, middle_initial, last_name) VALUES (${disclosureId}, ${applicant.firstName}, ${applicant.middleInitial || null}, ${applicant.lastName})`;
  }

  const normalizedInventors = normalizePersonRows(inventors);
  for (const inventor of normalizedInventors) {
    await queryClient`INSERT INTO ip_disclosure_inventor (disclosure_id, first_name, middle_initial, last_name) VALUES (${disclosureId}, ${inventor.firstName}, ${inventor.middleInitial || null}, ${inventor.lastName})`;
  }
}

// GET handler for retrieving a specific IP disclosure
export async function GET(
  request: NextRequest,
  { params }: { params: { disclosureId: string } },
) {
  try {
    // Get the disclosure ID from the params
    const { disclosureId } = params;
    console.log("Fetching IP disclosure with ID:", disclosureId);

    // Validate the ID is a UUID
    const isValidUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        disclosureId,
      );
    if (!isValidUUID) {
      console.error("Invalid disclosure ID format:", disclosureId);
      return NextResponse.json(
        { error: "Invalid disclosure ID format" },
        { status: 400 },
      );
    }

    // Call the tRPC procedure to get the disclosure
    const caller = appRouter.createCaller({
      session: await auth(),
      req: request,
      res: undefined,
    });
    const disclosure = (await caller.ipDisclosure.getIpDisclosure({
      disclosureId,
    })) as unknown as {
      disclosure_id: string;
      applicants: any;
      inventors: any;
      applicantsInfo: any;
      copyright_basic_application: any;
      [key: string]: any; // Add index signature to allow string indexing
    };

    if (!disclosure) {
      console.log("No disclosure found with ID:", disclosureId);
      return NextResponse.json(
        { error: "Disclosure not found" },
        { status: 404 },
      );
    }

    console.log("Successfully fetched disclosure with ID:", disclosureId);

    // Log presence of key sections to help with debugging
    console.log("Disclosure data sections present:", {
      hasApplicantsInfo: !!disclosure.applicantsInfo,
      hasCopyrightApplication: !!disclosure.copyright_basic_application,
    });

    // Process copyright basic application data
    let copyrightApplication = null;
    if (disclosure.copyright_basic_application) {
      console.log("Processing copyright_basic_application data");
      copyrightApplication = {
        disclosureId: disclosure.disclosure_id,
        workTitle: disclosure.copyright_basic_application.work_title || "",
        workDescription:
          disclosure.copyright_basic_application.work_description || "",
        creationDate:
          disclosure.copyright_basic_application.creation_date || "",
      };
    }

    // Format applicants info
    const applicantsInfo = {
      ipTypes: disclosure.selected_ip_types || {},
      email: disclosure.email || "",
      isRightfulOwner: disclosure.is_rightful_owner || false,
      authorizedRepresentative: disclosure.authorized_representative || "",
      otherIpType: disclosure.other_ip_type || "",
      applicants: Array.isArray(disclosure.applicants)
        ? disclosure.applicants.map((applicant: any) => ({
            firstName: applicant.first_name || "",
            middleInitial: applicant.middle_initial || "",
            lastName: applicant.last_name || "",
          }))
        : [],
      inventors: Array.isArray(disclosure.inventors)
        ? disclosure.inventors.map((inventor: any) => ({
            firstName: inventor.first_name || "",
            middleInitial: inventor.middle_initial || "",
            lastName: inventor.last_name || "",
          }))
        : [],
    };

    // Further processing of ipTypes to ensure all fields are present with proper boolean values
    console.log("Original ipTypes from disclosure:", {
      value: applicantsInfo.ipTypes,
      type: typeof applicantsInfo.ipTypes,
      keys: Object.keys(applicantsInfo.ipTypes || {}),
      hasTrue: Object.values(applicantsInfo.ipTypes || {}).some(
        (v) => v === true,
      ),
    });

    // Ensure all IP types fields exist with boolean values
    const defaultIpTypes = {
      copyright: false,
      patent: false,
      utilityModel: false,
      industrialDesign: false,
      trademark: false,
      tradeSecret: false,
      other: false,
      notSure: false,
    };

    // Check if we have copyright data but no IP types selected
    const hasCopyrightData = copyrightApplication;
    const hasIpTypesSelected =
      applicantsInfo.ipTypes &&
      Object.values(applicantsInfo.ipTypes).some((value) => value === true);

    // Merge with defaults to ensure all fields exist
    let mergedIpTypes = {
      ...defaultIpTypes,
      ...(applicantsInfo.ipTypes || {}),
    };

    // If we have copyright data but no IP types selected, set copyright to true
    if (hasCopyrightData && !hasIpTypesSelected) {
      console.log(
        "Detected copyright data but no IP types selected - setting copyright to true",
      );
      mergedIpTypes.copyright = true;
    }

    // Convert all values to proper booleans
    const finalIpTypes = {
      copyright: Boolean(mergedIpTypes.copyright),
      patent: Boolean(mergedIpTypes.patent),
      utilityModel: Boolean(mergedIpTypes.utilityModel),
      industrialDesign: Boolean(mergedIpTypes.industrialDesign),
      trademark: Boolean(mergedIpTypes.trademark),
      tradeSecret: Boolean(mergedIpTypes.tradeSecret),
      other: Boolean(mergedIpTypes.other),
      notSure: Boolean(mergedIpTypes.notSure),
    };

    console.log("Final formatted ipTypes:", {
      original: applicantsInfo.ipTypes,
      merged: mergedIpTypes,
      final: finalIpTypes,
      hasTrue: Object.values(finalIpTypes).some((value) => value === true),
      selectedTypes: Object.entries(finalIpTypes)
        .filter(([_, value]) => value === true)
        .map(([key]) => key),
    });

    // Update applicantsInfo with the properly formatted ipTypes
    applicantsInfo.ipTypes = finalIpTypes;

    // Construct the response data with all necessary sections
    const responseData = {
      disclosureId: disclosure.disclosure_id,
      clientId: disclosure.client_id,
      status: disclosure.status,
      applicantsInfo,
      copyrightApplication,
    };

    // Log the constructed response components for debugging
    console.log("Response data components:", {
      hasDisclosureId: !!responseData.disclosureId,
      hasClientId: !!responseData.clientId,
      hasApplicantsInfo: !!responseData.applicantsInfo,
      hasCopyrightApplication: !!responseData.copyrightApplication,
    });

    // Add more detailed logging for structure
    console.log("Response data structure:", {
      disclosureId: responseData.disclosureId,
      clientId: responseData.clientId,
      hasApplicantsEmail: responseData.applicantsInfo?.email ? true : false,
      hasApplicantsTypes: responseData.applicantsInfo?.ipTypes
        ? Object.keys(responseData.applicantsInfo.ipTypes)
        : [],
    });

    // IMPORTANT: Return the data directly at the top level, not wrapped in a 'disclosureData' property
    return addRateLimitHeaders(NextResponse.json(responseData));
  } catch (error) {
    console.error("Error retrieving IP disclosure:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve IP disclosure",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Helper functions for consistent API responses
function generateResponse(status: number, message: string, data: any = {}) {
  return NextResponse.json({ message, success: true, ...data }, { status });
}

function generateErrorResponse(
  status: number,
  message: string,
  debugData: any = {},
) {
  return NextResponse.json({ error: message, debugData }, { status });
}

// PUT handler for updating a specific IP disclosure
export async function PUT(
  request: Request,
  { params }: { params: { disclosureId: string } },
) {
  const { disclosureId } = params;
  const debugData: any = {};

  try {
    // Require authentication before any processing
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    debugData.endpoint = "PUT /api/ip-disclosure/[disclosureId]";
    debugData.disclosureId = disclosureId;
    const body = await request.json();
    debugData.requestBody = body;

    console.log(`[API] PUT /api/ip-disclosure/${disclosureId}`, {
      body,
      ipTypes: body.selected_ip_types,
      ipTypesJSON: JSON.stringify(body.selected_ip_types),
    });

    // Validate the required fields
    if (!disclosureId) {
      debugData.error = "Missing disclosure ID";
      return generateErrorResponse(400, "Missing disclosure ID", debugData);
    }

    // Update the IP disclosure record directly using the schema fields
    try {
      // Handle selected_ip_types specially - verify it's valid JSON before updating
      if (body.selected_ip_types) {
        if (typeof body.selected_ip_types === "object") {
          // Ensure all values are strictly boolean
          const cleanedIpTypes: Record<string, boolean> = {};
          Object.entries(body.selected_ip_types).forEach(([key, value]) => {
            cleanedIpTypes[key] = value === true;
          });

          // Validate that at least one type is selected
          const hasSelectedType = Object.values(cleanedIpTypes).some(
            (v) => v === true,
          );
          if (!hasSelectedType) {
            debugData.error = "At least one IP type must be selected";
            debugData.ipTypes = cleanedIpTypes;
            return generateErrorResponse(
              400,
              "At least one IP type must be selected",
              debugData,
            );
          }

          // Convert to JSON string for storage
          body.selected_ip_types = JSON.stringify(cleanedIpTypes);
          debugData.finalIpTypes = body.selected_ip_types;
        } else {
          debugData.error = "Invalid selected_ip_types format";
          debugData.ipTypesFormat = typeof body.selected_ip_types;
          return generateErrorResponse(
            400,
            "Invalid IP types format",
            debugData,
          );
        }
      }

      // Extract applicants info from the request body
      const applicantsInfo = body.applicantsInfo || {};

      // Update the IP disclosure record using Drizzle (shares the same SSL-aware connection)
      try {
        const updatedRows = await db
          .update(ipDisclosureTable)
          .set({
            selectedIpTypes: body.selected_ip_types
              ? JSON.parse(
                  typeof body.selected_ip_types === "string"
                    ? body.selected_ip_types
                    : JSON.stringify(body.selected_ip_types),
                )
              : undefined,
            email: applicantsInfo.email || undefined,
            isRightfulOwner: applicantsInfo.isRightfulOwner === true,
            authorizedRepresentative:
              applicantsInfo.authorizedRepresentative ?? "",
            otherIpType: applicantsInfo.otherIpType ?? "",
            updatedAt: new Date().toISOString(),
          })
          .where(eq(ipDisclosureTable.disclosureId, disclosureId))
          .returning();

        if (updatedRows.length === 0) {
          debugData.error = "No record found or updated";
          return generateErrorResponse(404, "IP disclosure not found", debugData);
        }

        debugData.result = updatedRows[0];

        // Sync applicants/inventors using the shared postgres.js queryClient
        await syncDisclosurePeople(
          disclosureId,
          applicantsInfo.applicants,
          applicantsInfo.inventors,
        );

        console.log("Updated IP disclosure", { disclosureId });

        // Check if we should register this form in form_submission_registry
        const registerForm = body.registerForm === true;
        if (registerForm) {
          try {
            const { formSubmissionRegistry } =
              await import("@/drizzle/migrations/schema");
            const { and, eq: eqOp } = await import("drizzle-orm");

            const applicationId = undefined; // ipDisclosure table has no applicationId column

            const existingRegistry = await db
              .select({ registryId: formSubmissionRegistry.registryId })
              .from(formSubmissionRegistry)
              .where(
                and(
                  eqOp(formSubmissionRegistry.sourceType, "ip_disclosure"),
                  eqOp(formSubmissionRegistry.sourceId, disclosureId),
                ),
              );

            const sessionForRegistry = await auth();
            if (sessionForRegistry?.user?.id) {
              let ipTypes: Record<string, any> = {};
              try {
                ipTypes =
                  typeof body.selected_ip_types === "string"
                    ? JSON.parse(body.selected_ip_types)
                    : body.selected_ip_types || {};
              } catch {
                ipTypes = {};
              }

              const getTitle = () => {
                const types = [];
                if (ipTypes?.copyright) types.push("Copyright");
                if (ipTypes?.patent) types.push("Patent");
                if (ipTypes?.utilityModel) types.push("Utility Model");
                if (ipTypes?.trademark) types.push("Trademark");
                if (ipTypes?.tradeSecret) types.push("Trade Secret");
                return types.length > 0
                  ? `IP Disclosure - ${types.join(", ")}`
                  : "IP Disclosure Submission";
              };

              if (existingRegistry && existingRegistry.length > 0) {
                await db
                  .update(formSubmissionRegistry)
                  .set({
                    status: "draft",
                    title: getTitle(),
                    updatedAt: new Date().toISOString(),
                    ...(applicationId ? { ipApplicationId: applicationId } : {}),
                  })
                  .where(
                    eqOp(
                      formSubmissionRegistry.registryId,
                      existingRegistry[0].registryId,
                    ),
                  );
              } else {
                await db
                  .insert(formSubmissionRegistry)
                  .values({
                    userId: sessionForRegistry.user.id,
                    sourceType: "ip_disclosure",
                    sourceId: disclosureId,
                    ipApplicationId: applicationId,
                    status: "draft",
                    title: getTitle(),
                    description: "IP Disclosure Form",
                    updatedAt: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                  })
                  .returning();
              }
            }
          } catch (registryError) {
            console.error("Error handling form registry:", registryError);
            // Don't fail the entire operation if registry creation fails
          }
        }

        return generateResponse(200, "IP disclosure updated successfully", {
          id: disclosureId,
          result: updatedRows[0],
        });
      } catch (error) {
        debugData.firstApproachError =
          error instanceof Error ? error.message : String(error);
        debugData.fallbackError = debugData.firstApproachError;
        console.error("Error updating IP disclosure:", debugData.firstApproachError);
        return generateErrorResponse(500, "Failed to update IP disclosure", debugData);
      }
    } catch (topLevelError) {
      debugData.error =
        topLevelError instanceof Error
          ? topLevelError.message
          : String(topLevelError);
      console.error("Error in PUT handler:", debugData.error);
      return generateErrorResponse(
        500,
        `Failed to update disclosure: ${debugData.error}`,
        debugData,
      );
    }
  } catch (error) {
    debugData.error = error instanceof Error ? error.message : String(error);
    console.error("Outer error in PUT handler:", debugData.error);
    return generateErrorResponse(
      500,
      `Server error: ${debugData.error}`,
      debugData,
    );
  }
}
