import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { appRouter } from "@/trpc/router";
import { headers } from "next/headers";
import { db } from "@/drizzle/db";
import { sql } from "drizzle-orm";
import pkg from "pg";

export const dynamic = "force-dynamic";
const { Pool } = pkg;

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Add this helper function after imports
function addRateLimitHeaders(
  response: NextResponse,
  remaining: number = 50
): NextResponse {
  // Add rate limiting headers
  response.headers.set("X-RateLimit-Limit", "60"); // 60 requests per minute
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  response.headers.set(
    "X-RateLimit-Reset",
    Math.floor(Date.now() / 1000 + 60).toString()
  );

  if (remaining <= 5) {
    // If we're getting close to the limit, add a Retry-After header
    response.headers.set("Retry-After", "5");
  }

  return response;
}

// GET handler for retrieving a specific IP disclosure
export async function GET(
  request: NextRequest,
  { params }: { params: { disclosureId: string } }
) {
  try {
    // Get the disclosure ID from the params
    const { disclosureId } = params;
    console.log("Fetching IP disclosure with ID:", disclosureId);

    // Validate the ID is a UUID
    const isValidUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        disclosureId
      );
    if (!isValidUUID) {
      console.error("Invalid disclosure ID format:", disclosureId);
      return NextResponse.json(
        { error: "Invalid disclosure ID format" },
        { status: 400 }
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
      copyright_transaction_part1: any;
      copyright_transaction_part2: any;
      [key: string]: any; // Add index signature to allow string indexing
    };

    if (!disclosure) {
      console.log("No disclosure found with ID:", disclosureId);
      return NextResponse.json(
        { error: "Disclosure not found" },
        { status: 404 }
      );
    }

    // Specifically check for transaction form data
    console.log("Successfully fetched disclosure with ID:", disclosureId);

    // Log presence of key sections to help with debugging
    console.log("Disclosure data sections present:", {
      hasTransactionFormPart1: !!disclosure.copyright_transaction_part1,
      hasTransactionFormPart2: !!disclosure.copyright_transaction_part2,
      hasApplicantsInfo: !!disclosure.applicantsInfo,
      hasCopyrightApplication: !!disclosure.copyright_basic_application,
    });

    // Process copyright transaction part 1 data (co-authors)
    let transactionFormPart1 = null;
    if (disclosure.copyright_transaction_part1) {
      console.log("Processing copyright_transaction_part1 data");
      // Extract copyright ID and transaction data
      const copyrightId = disclosure.copyright_transaction_part1.copyright_id;
      let transactionData =
        disclosure.copyright_transaction_part1.transaction_data;

      // Check if transaction_data is a string that needs parsing
      if (transactionData && typeof transactionData === "string") {
        try {
          transactionData = JSON.parse(transactionData);
          console.log("Parsed transaction_data from string to object", {
            keys: Object.keys(transactionData),
            hasCoAuthors: !!transactionData.coAuthors,
          });
        } catch (err) {
          console.error("Error parsing transaction_data JSON:", err);
          // Initialize with an empty object if parsing fails
          transactionData = {};
        }
      }

      // If transactionData is null or undefined, initialize it
      if (!transactionData) {
        console.log(
          "transactionData is null or undefined, initializing with empty object"
        );
        transactionData = {};
      }

      // Ensure coAuthors exists and is an array
      if (!transactionData.coAuthors) {
        console.log("coAuthors missing, initializing with empty array");
        transactionData.coAuthors = [];
      } else if (!Array.isArray(transactionData.coAuthors)) {
        // If coAuthors exists but is not an array, convert it
        console.log("coAuthors is not an array, converting to array");
        if (typeof transactionData.coAuthors === "object") {
          // If it's an object, convert to array with single item
          transactionData.coAuthors = [transactionData.coAuthors];
        } else {
          // Otherwise, initialize as empty array
          transactionData.coAuthors = [];
        }
      }

      // Check if coAuthors has any valid entries
      const hasValidCoAuthor = transactionData.coAuthors.some(
        (author: {
          firstName?: string;
          lastName?: string;
          emailAddress?: string;
          nationality?: string;
        }) =>
          author.firstName?.trim() ||
          author.lastName?.trim() ||
          author.emailAddress?.trim() ||
          author.nationality?.trim()
      );

      if (!hasValidCoAuthor && transactionData.coAuthors.length === 0) {
        console.log("No valid coAuthors found, adding a default empty entry");
        transactionData.coAuthors.push({
          firstName: "",
          middleName: "",
          lastName: "",
          dateOfBirth: "",
          civilStatus: "",
          sex: "",
          nationality: "",
          countryOfResidence: "",
          address: "",
          municipality: "",
          provinceState: "",
          zipCode: "",
          mobileNumber: "",
          emailAddress: "",
          isClaimingEntireWork: false,
          claimDetails: "",
        });
      }

      // Log coAuthors structure
      console.log("coAuthors structure:", {
        isArray: Array.isArray(transactionData.coAuthors),
        length: Array.isArray(transactionData.coAuthors)
          ? transactionData.coAuthors.length
          : 0,
        firstItem:
          transactionData.coAuthors &&
          Array.isArray(transactionData.coAuthors) &&
          transactionData.coAuthors.length > 0
            ? Object.keys(transactionData.coAuthors[0])
            : "none",
        hasValidEntry: hasValidCoAuthor,
      });

      // Create transaction form part 1 object
      transactionFormPart1 = {
        disclosureId: disclosure.disclosure_id,
        copyrightId: copyrightId,
        transaction_data: transactionData,
      };

      console.log("Processed transaction form part 1:", {
        hasCoAuthors: transactionData.coAuthors
          ? Array.isArray(transactionData.coAuthors)
            ? transactionData.coAuthors.length
            : "not an array"
          : "none",
        disclosureId: disclosure.disclosure_id,
        copyrightId: copyrightId,
        coAuthorsSample:
          transactionData.coAuthors && transactionData.coAuthors.length > 0
            ? transactionData.coAuthors.map(
                (author: {
                  firstName?: string;
                  lastName?: string;
                  emailAddress?: string;
                }) => ({
                  firstName: author.firstName,
                  lastName: author.lastName,
                  isEmpty: !(
                    author.firstName?.trim() ||
                    author.lastName?.trim() ||
                    author.emailAddress?.trim()
                  ),
                })
              )
            : "none",
      });
    }

    // Process copyright transaction part 2 data
    let transactionFormPart2 = null;
    if (disclosure.copyright_transaction_part2) {
      console.log("Processing copyright_transaction_part2 data");

      // Extract copyright ID and transaction details
      const copyrightId = disclosure.copyright_transaction_part2.copyright_id;
      let transactionDetails =
        disclosure.copyright_transaction_part2.transaction_details;

      // Check if transaction_details is a string that needs parsing
      if (transactionDetails && typeof transactionDetails === "string") {
        try {
          transactionDetails = JSON.parse(transactionDetails);
          console.log("Parsed transaction_details from string to object");
        } catch (err) {
          console.error("Error parsing transaction_details JSON:", err);
          // Initialize with an empty object if parsing fails
          transactionDetails = {};
        }
      }

      // If transactionDetails is null or undefined, initialize it
      if (!transactionDetails) {
        console.log(
          "transactionDetails is null or undefined, initializing with empty object"
        );
        transactionDetails = {};
      }

      // Process transaction form part 2 data
      // Extract all required fields
      const applicantInfo =
        disclosure.copyright_transaction_part2.applicant_info || {};
      const authorInfo =
        disclosure.copyright_transaction_part2.author_info || {};
      const workCreationForm =
        disclosure.copyright_transaction_part2.work_creation_form || {};
      const submissionType =
        disclosure.copyright_transaction_part2.submission_type || {};
      const transactionType =
        disclosure.copyright_transaction_part2.transaction_type || {};

      // Check documentsSubmitted structure and ensure it's formatted correctly
      if (!transactionDetails.documentsSubmitted) {
        console.log(
          "documentsSubmitted missing, initializing with default structure"
        );
        transactionDetails.documentsSubmitted = {
          electronicCopy: false,
          governmentId: false,
          others: false,
          files: {},
        };
      }

      // Check signature structure
      if (!transactionDetails.signature) {
        console.log("signature missing, initializing with default structure");
        transactionDetails.signature = {
          agree: false,
          firstName: "",
          middleInitial: "",
          lastName: "",
          signatureFile: [],
        };
      }

      // Create transaction form part 2 object with all necessary fields
      transactionFormPart2 = {
        disclosureId: disclosure.disclosure_id,
        copyrightId: copyrightId,
        transaction_details: transactionDetails,
        applicant_info: applicantInfo,
        author_info: authorInfo,
        work_creation_form: workCreationForm,
        submission_type: submissionType,
        transaction_type: transactionType,
      };

      console.log("Processed transaction form part 2:", {
        hasTransactionDetails: !!transactionDetails,
        hasDocumentsSubmitted: !!transactionDetails.documentsSubmitted,
        hasSignature: !!transactionDetails.signature,
        disclosureId: disclosure.disclosure_id,
        copyrightId: copyrightId,
      });
    }

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
        (v) => v === true
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
    const hasCopyrightData =
      copyrightApplication || transactionFormPart1 || transactionFormPart2;
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
        "Detected copyright data but no IP types selected - setting copyright to true"
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
      transactionFormPart1,
      transactionFormPart2,
    };

    // Log the constructed response components for debugging
    console.log("Response data components:", {
      hasDisclosureId: !!responseData.disclosureId,
      hasClientId: !!responseData.clientId,
      hasApplicantsInfo: !!responseData.applicantsInfo,
      hasCopyrightApplication: !!responseData.copyrightApplication,
      hasTransactionFormPart1: !!responseData.transactionFormPart1,
      hasTransactionFormPart1CoAuthors: responseData.transactionFormPart1
        ?.transaction_data?.coAuthors
        ? true
        : false,
      hasTransactionFormPart2: !!responseData.transactionFormPart2,
    });

    // Add more detailed logging for structure
    console.log("Response data structure:", {
      disclosureId: responseData.disclosureId,
      clientId: responseData.clientId,
      hasApplicantsEmail: responseData.applicantsInfo?.email ? true : false,
      hasApplicantsTypes: responseData.applicantsInfo?.ipTypes
        ? Object.keys(responseData.applicantsInfo.ipTypes)
        : [],
      transactionFormPart1Keys: responseData.transactionFormPart1
        ? Object.keys(responseData.transactionFormPart1)
        : [],
      transactionFormPart2Keys: responseData.transactionFormPart2
        ? Object.keys(responseData.transactionFormPart2)
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
      { status: 500 }
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
  debugData: any = {}
) {
  return NextResponse.json({ error: message, debugData }, { status });
}

// PUT handler for updating a specific IP disclosure
export async function PUT(
  request: Request,
  { params }: { params: { disclosureId: string } }
) {
  const { disclosureId } = params;
  const debugData: any = {};

  try {
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
            (v) => v === true
          );
          if (!hasSelectedType) {
            debugData.error = "At least one IP type must be selected";
            debugData.ipTypes = cleanedIpTypes;
            return generateErrorResponse(
              400,
              "At least one IP type must be selected",
              debugData
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
            debugData
          );
        }
      }

      // Extract applicants info from the request body
      const applicantsInfo = body.applicantsInfo || {};

      // Update the IP disclosure record directly using the schema fields
      try {
        const client = await pool.connect();
        try {
          // Format data for database update
          const updateData = {
            selectedIpTypes: body.selected_ip_types, // Already JSON stringified
            email: applicantsInfo.email,
            isRightfulOwner: applicantsInfo.isRightfulOwner === true,
            authorizedRepresentative:
              applicantsInfo.authorizedRepresentative || "",
            otherIpType: applicantsInfo.otherIpType || "",
            updatedAt: new Date(),
          };

          // Build query dynamically based on available fields
          const updateColumns = [];
          const updateValues = [];
          let paramIndex = 1;

          if (updateData.selectedIpTypes) {
            updateColumns.push(`selected_ip_types = $${paramIndex}`);
            updateValues.push(updateData.selectedIpTypes);
            paramIndex++;
          }

          if (updateData.email) {
            updateColumns.push(`email = $${paramIndex}`);
            updateValues.push(updateData.email);
            paramIndex++;
          }

          if (updateData.isRightfulOwner !== undefined) {
            updateColumns.push(`is_rightful_owner = $${paramIndex}`);
            updateValues.push(updateData.isRightfulOwner);
            paramIndex++;
          }

          if (updateData.authorizedRepresentative !== undefined) {
            updateColumns.push(`authorized_representative = $${paramIndex}`);
            updateValues.push(updateData.authorizedRepresentative);
            paramIndex++;
          }

          if (updateData.otherIpType !== undefined) {
            updateColumns.push(`other_ip_type = $${paramIndex}`);
            updateValues.push(updateData.otherIpType);
            paramIndex++;
          }

          // Always update the timestamp
          updateColumns.push(`updated_at = NOW()`);

          // Add disclosure ID as the last parameter
          updateValues.push(disclosureId);

          const updateQuery = `
            UPDATE ip_disclosure
            SET ${updateColumns.join(", ")}
            WHERE disclosure_id = $${paramIndex}
            RETURNING *
          `;

          debugData.updateQuery = updateQuery;
          debugData.updateValues = updateValues;

          const result = await client.query(updateQuery, updateValues);

          if (result.rows.length === 0) {
            debugData.error = "No record found or updated";
            return generateErrorResponse(
              404,
              "IP disclosure not found",
              debugData
            );
          }

          debugData.result = result.rows[0];

          // Verify the update
          const verificationResult = await client.query(
            `SELECT disclosure_id, selected_ip_types FROM ip_disclosure WHERE disclosure_id = $1`,
            [disclosureId]
          );
          debugData.ipTypesVerification = verificationResult.rows[0];

          console.log("Updated IP disclosure", {
            disclosureId,
            result: result.rows[0],
            ipTypes: result.rows[0]?.selected_ip_types,
          });

          // Check if we should register this form in form_submission_registry
          const registerForm = body.registerForm === true;
          if (registerForm) {
            console.log("Registering IP disclosure form in registry", {
              disclosureId,
            });

            try {
              const { formSubmissionRegistry } = await import(
                "@/drizzle/migrations/schema"
              );
              const { and, eq } = await import("drizzle-orm");

              // Get application ID from the result or database
              const applicationId = result.rows[0]?.application_id;

              // First check if an entry already exists
              const existingRegistry = await db
                .select({ registryId: formSubmissionRegistry.registryId })
                .from(formSubmissionRegistry)
                .where(
                  and(
                    eq(formSubmissionRegistry.sourceType, "ip_disclosure"),
                    eq(formSubmissionRegistry.sourceId, disclosureId)
                  )
                );

              // Get user ID from auth session
              const session = await auth();
              if (!session?.user?.id) {
                console.error("No user ID available for registry");
              } else {
                // Extract IP types for the title
                let ipTypes: Record<string, any> = {};
                try {
                  ipTypes =
                    typeof body.selected_ip_types === "string"
                      ? JSON.parse(body.selected_ip_types)
                      : body.selected_ip_types || {};
                } catch (e) {
                  console.error(
                    "Error parsing IP types for registry title:",
                    e
                  );
                  ipTypes = {};
                }

                // Create a title based on the IP types
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
                  console.log(
                    "Updating existing registry entry",
                    existingRegistry[0]
                  );

                  // Update existing registry entry with the latest application ID if available
                  await db
                    .update(formSubmissionRegistry)
                    .set({
                      status: "draft",
                      title: getTitle(),
                      updatedAt: new Date().toISOString(),
                      // Only update the application ID if we have a valid one
                      ...(applicationId
                        ? { ipApplicationId: applicationId }
                        : {}),
                    })
                    .where(
                      eq(
                        formSubmissionRegistry.registryId,
                        existingRegistry[0].registryId
                      )
                    );

                  console.log("Updated existing registry entry");
                } else {
                  console.log("Creating new registry entry");

                  // Create new registry entry
                  const registryResult = await db
                    .insert(formSubmissionRegistry)
                    .values({
                      userId: session.user.id,
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

                  console.log("Created new registry entry", registryResult[0]);
                }
              }
            } catch (registryError) {
              console.error("Error handling form registry:", registryError);
              // Don't fail the entire operation if registry creation fails
            }
          } else {
            console.log("Skipping form registry as registerForm != true");
          }

          return generateResponse(200, "IP disclosure updated successfully", {
            id: disclosureId,
            result: result.rows[0],
            ipTypesVerification: verificationResult.rows[0],
          });
        } finally {
          client.release();
        }
      } catch (error) {
        debugData.firstApproachError =
          error instanceof Error ? error.message : String(error);
        console.error(
          "Error updating IP disclosure:",
          debugData.firstApproachError
        );

        // Fall back to just updating the IP types
        if (body.selected_ip_types) {
          try {
            const client = await pool.connect();
            try {
              const ipUpdateResult = await client.query(
                `UPDATE ip_disclosure
                SET selected_ip_types = $1::jsonb,
                    updated_at = NOW()
                WHERE disclosure_id = $2
                RETURNING disclosure_id, selected_ip_types`,
                [body.selected_ip_types, disclosureId]
              );

              if (ipUpdateResult.rows.length === 0) {
                debugData.error = "No record found with fallback approach";
                return generateErrorResponse(
                  404,
                  "IP disclosure not found (fallback)",
                  debugData
                );
              }

              debugData.fallbackResult = ipUpdateResult.rows[0];

              console.log("Updated IP types directly (fallback):", {
                disclosureId,
                result: ipUpdateResult.rows[0],
              });

              return generateResponse(
                200,
                "IP types updated successfully (direct update)",
                {
                  id: disclosureId,
                  result: ipUpdateResult.rows[0],
                }
              );
            } finally {
              client.release();
            }
          } catch (fallbackError) {
            debugData.fallbackError =
              fallbackError instanceof Error
                ? fallbackError.message
                : String(fallbackError);
            console.error(
              "Error updating IP types (fallback):",
              debugData.fallbackError
            );

            return generateErrorResponse(
              500,
              "Failed to update IP disclosure",
              debugData
            );
          }
        } else {
          return generateErrorResponse(
            500,
            "Failed to update IP disclosure and no IP types available for fallback",
            debugData
          );
        }
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
        debugData
      );
    }
  } catch (error) {
    debugData.error = error instanceof Error ? error.message : String(error);
    console.error("Outer error in PUT handler:", debugData.error);
    return generateErrorResponse(
      500,
      `Server error: ${debugData.error}`,
      debugData
    );
  }
}
