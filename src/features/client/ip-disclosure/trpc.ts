import { z } from "zod";
import { protectedProcedure, router } from "@/trpc/init";
import { db } from "@/drizzle/db";
import { v4 as uuidv4 } from "uuid";
import { sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { auth } from "@/auth";

// Define schemas for validation
const ipTypeSchema = z.object({
  copyright: z.boolean(),
  patent: z.boolean(),
  utilityModel: z.boolean(),
  industrialDesign: z.boolean(),
  trademark: z.boolean(),
  tradeSecret: z.boolean(),
  other: z.boolean(),
  notSure: z.boolean(),
});

const applicantSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleInitial: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
});

const inventorSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleInitial: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
});

// Main IP Disclosure schema
const ipDisclosureSchema = z.object({
  clientId: z.string().uuid(),
  selectedIpTypes: ipTypeSchema,
  applicants: z.array(applicantSchema).min(1),
  inventors: z.array(inventorSchema).min(1),
  email: z.string().email().optional(),
  isRightfulOwner: z.boolean().optional(),
  authorizedRepresentative: z.string().optional(),
  otherIpType: z.string().optional(),
});

// Trademark Application schema
const trademarkSchema = z.object({
  disclosureId: z.string().uuid(),
  trademarkName: z.string().min(1, "Trademark name is required"),
  description: z.string().min(1, "Description is required"),
  translation: z.string().optional(),
  niceClassifications: z.array(z.string()).optional(),
  businessType: z
    .object({
      company: z.boolean().optional(),
      soleProprietor: z.boolean().optional(),
    })
    .optional(),
  legalName: z.string().min(1, "Legal name is required"),
  registerForm: z.boolean().optional(),
});

// Trade Secret Application schema
const tradeSecretSchema = z.object({
  disclosureId: z.string().uuid(),
  description: z.string().min(1, "Description is required"),
  confidentialityMeasures: z
    .string()
    .min(1, "Confidentiality measures are required"),
  registerForm: z.boolean().optional(),
});

// Disclosure Confirmation schema
const disclosureConfirmationSchema = z.object({
  disclosureId: z.string().uuid(),
  writtenDisclosures: z.object({
    past: z.boolean(),
    planned: z.boolean(),
    notApplicable: z.boolean(),
  }),
  oralDisclosures: z.object({
    past: z.boolean(),
    planned: z.boolean(),
    notApplicable: z.boolean(),
  }),
  futureWork: z.string().optional(),
  confirmationDeclaration: z.boolean(),
});

// Copyright Application schema
const copyrightSchema = z.object({
  disclosureId: z.string().uuid(),
  workTitle: z.string().min(1, "Work title is required"),
  workDescription: z.string().min(1, "Description is required"),
  creationDate: z.string().optional(),
  transactionData: z.record(z.any()).optional(),
});

// Patent/Utility Model Application schema
const patentUtilityModelSchema = z.object({
  disclosureId: z.string().uuid(),
  title: z.string().optional(),
  description: z.string().optional(),
  claims: z.array(z.string()).optional(),
  drawings: z.array(z.any()).optional(),
  inventors: z.array(z.any()).optional(),
  additionalData: z.record(z.any()).optional(),
});

// Define the context type
interface Context {
  db: any; // Replace with the actual database type if available
}

export const ipDisclosureRouter = router({
  // Create a new IP disclosure
  createIpDisclosure: protectedProcedure
    .input(ipDisclosureSchema)
    .mutation(async ({ input }) => {
      console.log("Creating IP disclosure with client ID:", input.clientId);
      console.log(
        "Input data:",
        JSON.stringify(
          {
            selectedIpTypes: input.selectedIpTypes,
          },
          null,
          2
        )
      );

      try {
        // Check if the client exists in user_account table
        console.log("Checking if client ID exists in user_account table...");
        const userExists = await db.execute(
          sql`SELECT id FROM user_account WHERE id = ${input.clientId}`
        );

        console.log("User account query result:", userExists);

        if (!userExists || userExists.length === 0) {
          console.error(
            "Client ID not found in user_account table:",
            input.clientId
          );
          throw new Error("Client ID not found");
        }

        console.log("Client ID found in user_account table");

        // Check if the ip_disclosure table has the expected columns
        console.log("Checking ip_disclosure table structure...");
        try {
          const tableStructure = await db.execute(
            sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'ip_disclosure'`
          );
          console.log(
            "IP disclosure table columns:",
            tableStructure.map((row) => row.column_name)
          );
        } catch (structureError) {
          console.error("Error checking table structure:", structureError);
        }

        // Create the main IP disclosure record using raw SQL
        console.log("Inserting new IP disclosure record...");
        try {
          // Ensure selectedIpTypes is a valid JSON object
          let selectedIpTypesJSON = {};

          if (input.selectedIpTypes) {
            // Format the selectedIpTypes to ensure all values are proper booleans
            const formattedIpTypes = {
              copyright: Boolean(input.selectedIpTypes.copyright),
              patent: Boolean(input.selectedIpTypes.patent),
              utilityModel: Boolean(input.selectedIpTypes.utilityModel),
              industrialDesign: Boolean(input.selectedIpTypes.industrialDesign),
              trademark: Boolean(input.selectedIpTypes.trademark),
              tradeSecret: Boolean(input.selectedIpTypes.tradeSecret),
              other: Boolean(input.selectedIpTypes.other),
              notSure: Boolean(input.selectedIpTypes.notSure),
            };

            selectedIpTypesJSON = formattedIpTypes;
          }

          // Log the exact object we're about to insert into the database
          console.log("selectedIpTypes to insert:", {
            original: input.selectedIpTypes,
            formatted: selectedIpTypesJSON,
            asJSON: JSON.stringify(selectedIpTypesJSON),
          });

          // Log the exact SQL query we're about to execute (with sensitive data redacted)
          console.log(
            "SQL Query structure:",
            `
            INSERT INTO ip_disclosure (
              client_id, 
              selected_ip_types, 
              status,
              email,
              is_rightful_owner,
              authorized_representative,
              other_ip_type,
              created_at, 
              updated_at
            ) 
            VALUES (
              [client_id], 
              [selected_ip_types JSON], 
              'draft',
              [email],
              [is_rightful_owner],
              [authorized_representative],
              [other_ip_type],
              NOW(), 
              NOW()
            )
            RETURNING disclosure_id as "disclosureId"
          `
          );

          // Execute the query within a transaction with all available fields
          const result = await db.transaction(async (tx) => {
            const insertResult = await tx.execute(
              sql`
                INSERT INTO ip_disclosure (
                  client_id, 
                  selected_ip_types,
                  status,
                  email,
                  is_rightful_owner,
                  authorized_representative,
                  other_ip_type,
                  created_at, 
                  updated_at
                ) 
                VALUES (
                  ${input.clientId}, 
                  ${JSON.stringify(selectedIpTypesJSON)},
                  'draft',
                  ${input.email || null},
                  ${input.isRightfulOwner || false},
                  ${input.authorizedRepresentative || null},
                  ${input.otherIpType || null},
                  NOW(), 
                  NOW()
                )
                RETURNING disclosure_id as "disclosureId"
              `
            );

            console.log("Insert query result:", insertResult);

            if (!insertResult || !insertResult.length || !insertResult[0].disclosureId) {
              console.error("Failed to create IP disclosure - no ID returned");
              throw new Error("Failed to create IP disclosure");
            }

            const disclosureId = insertResult[0].disclosureId;
            console.log("Created IP disclosure with ID:", disclosureId);

            // Insert applicants using raw SQL
            if (input.applicants.length > 0) {
              console.log(`Inserting ${input.applicants.length} applicants...`);
              for (const applicant of input.applicants) {
                await tx.execute(
                  sql`
                    INSERT INTO ip_disclosure_applicant (
                      disclosure_id, 
                      first_name, 
                      middle_initial, 
                      last_name
                    ) 
                    VALUES (
                      ${disclosureId}, 
                      ${applicant.firstName}, 
                      ${applicant.middleInitial || null}, 
                      ${applicant.lastName}
                    )
                  `
                );
              }
              console.log(`Added ${input.applicants.length} applicants`);
            }

            // Insert inventors using raw SQL
            if (input.inventors.length > 0) {
              for (const inventor of input.inventors) {
                await tx.execute(
                  sql`
                    INSERT INTO ip_disclosure_inventor (
                      disclosure_id, 
                      first_name, 
                      middle_initial, 
                      last_name
                    ) 
                    VALUES (
                      ${disclosureId}, 
                      ${inventor.firstName}, 
                      ${inventor.middleInitial || null}, 
                      ${inventor.lastName}
                    )
                  `
                );
              }
              console.log(`Added ${input.inventors.length} inventors`);
            }

            return { success: true, disclosureId };
          });

          return result;
        } catch (insertError: unknown) {
          // Log the detailed error
          console.error("SQL Insert Error:", insertError);

          // Extract error details if available
          const errorMessage =
            insertError instanceof Error
              ? insertError.message
              : "Unknown database error";

          // Log additional details if available
          if (insertError && typeof insertError === "object") {
            const details = {
              code: (insertError as any).code,
              detail: (insertError as any).detail,
              hint: (insertError as any).hint,
              position: (insertError as any).position,
            };
            console.error("Error details:", details);
          }

          throw new Error(`Failed to create IP disclosure: ${errorMessage}`);
        }
      } catch (error) {
        console.error("Error creating IP disclosure:", error);
        throw new Error("Failed to create IP disclosure");
      }
    }),

  // Update an existing IP disclosure
  updateIpDisclosure: protectedProcedure
    .input(
      z.object({
        disclosureId: z.string().uuid(),
        data: ipDisclosureSchema.partial(),
      })
    )
    .mutation(async ({ input }) => {
      console.log("Updating IP disclosure:", input);

      try {
        // First, check if the disclosure exists
        const disclosureExists = await db.execute(
          sql`SELECT disclosure_id, selected_ip_types FROM ip_disclosure WHERE disclosure_id = ${input.disclosureId}`
        );

        if (!disclosureExists || disclosureExists.length === 0) {
          console.error("IP disclosure not found:", input.disclosureId);
          throw new Error("IP disclosure not found");
        }

        // Log the current IP types in the database
        console.log("Current IP types in database:", {
          rawValue: disclosureExists[0].selected_ip_types,
          asString: JSON.stringify(disclosureExists[0].selected_ip_types),
        });

        // Update the main IP disclosure record using raw SQL
        console.log("Updating IP disclosure with ID:", input.disclosureId);

        // Log detailed information about selectedIpTypes
        const selectedIpTypes = input.data.selectedIpTypes || {};
        console.log("selectedIpTypes before database update:", {
          isObject: typeof selectedIpTypes === "object",
          isNull: selectedIpTypes === null,
          keys: selectedIpTypes ? Object.keys(selectedIpTypes) : [],
          values: selectedIpTypes ? Object.values(selectedIpTypes) : [],
          hasTrue: selectedIpTypes
            ? Object.values(selectedIpTypes).some((v) => v === true)
            : false,
          stringified: JSON.stringify(selectedIpTypes),
          trademark: (selectedIpTypes as any)?.trademark,
          selectedKeys: selectedIpTypes
            ? Object.entries(selectedIpTypes)
                .filter(([_, value]) => value === true)
                .map(([key]) => key)
            : [],
        });

        // Format the selectedIpTypes to ensure all values are STRICTLY boolean values
        let formattedIpTypes = {
          copyright: false,
          patent: false,
          utilityModel: false,
          industrialDesign: false,
          trademark: false,
          tradeSecret: false,
          other: false,
          notSure: false,
        };

        if (selectedIpTypes && typeof selectedIpTypes === "object") {
          // Explicitly check for strict boolean true for each type
          const typedSelectedIpTypes = selectedIpTypes as Record<string, any>;

          // Log each type individually to debug true/false values
          console.log("Individual IP type values:", {
            copyright: {
              value: typedSelectedIpTypes.copyright,
              type: typeof typedSelectedIpTypes.copyright,
              strictTrue: typedSelectedIpTypes.copyright === true,
              asBool: Boolean(typedSelectedIpTypes.copyright),
            },
            trademark: {
              value: typedSelectedIpTypes.trademark,
              type: typeof typedSelectedIpTypes.trademark,
              strictTrue: typedSelectedIpTypes.trademark === true,
              asBool: Boolean(typedSelectedIpTypes.trademark),
            },
          });

          formattedIpTypes = {
            copyright: typedSelectedIpTypes.copyright === true,
            patent: typedSelectedIpTypes.patent === true,
            utilityModel: typedSelectedIpTypes.utilityModel === true,
            industrialDesign: typedSelectedIpTypes.industrialDesign === true,
            trademark: typedSelectedIpTypes.trademark === true,
            tradeSecret: typedSelectedIpTypes.tradeSecret === true,
            other: typedSelectedIpTypes.other === true,
            notSure: typedSelectedIpTypes.notSure === true,
          };
        }

        // Log the formatted IP types
        console.log("Formatted selectedIpTypes for update:", {
          original: selectedIpTypes,
          formatted: formattedIpTypes,
          asJSON: JSON.stringify(formattedIpTypes),
          hasTrueValues: Object.values(formattedIpTypes).some(
            (v) => v === true
          ),
          specificValues: {
            copyright: formattedIpTypes.copyright,
            trademark: formattedIpTypes.trademark,
          },
        });

        console.log(
          "Update data:",
          JSON.stringify(
            {
              selectedIpTypes: formattedIpTypes,
              email: input.data.email,
              isRightfulOwner: input.data.isRightfulOwner,
              authorizedRepresentative: input.data.authorizedRepresentative,
              otherIpType: input.data.otherIpType,
            },
            null,
            2
          )
        );

        try {
          // Start a transaction for atomicity
          await db.transaction(async (tx) => {
            // Generate SQL statement for debugging - this shows exactly what we're trying to update
            const jsonIpTypes = JSON.stringify(formattedIpTypes || {});
            console.log("IP types JSON to update:", jsonIpTypes);

            const sqlStatement = `
              UPDATE ip_disclosure 
              SET 
                selected_ip_types = '${jsonIpTypes}',
                email = [email value],
                is_rightful_owner = [is_rightful_owner value],
                authorized_representative = [authorized_representative value],
                other_ip_type = [other_ip_type value],
                updated_at = NOW()
              WHERE disclosure_id = [disclosure_id]
            `;
            console.log("SQL update statement (template):", sqlStatement);

            // First, perform a verification query to ensure there's no issue with the JSON format
            try {
              console.log("Verifying JSON for selected_ip_types...");
              const jsonTest = await tx.execute(
                sql`SELECT '${JSON.stringify(formattedIpTypes)}' as json_test`
              );
              console.log("JSON validation result:", jsonTest);
            } catch (jsonErr) {
              console.error("JSON format validation error:", jsonErr);
            }

            // Try to update with two different approaches to ensure it succeeds
            let updateSucceeded = false;
            let updateError = null;

            // Approach 1: Using the normal SQL template
            try {
              console.log("Executing update using SQL template...");
              const updateResult = await tx.execute(
                sql`
                  UPDATE ip_disclosure 
                  SET 
                    selected_ip_types = ${JSON.stringify(
                      formattedIpTypes || {}
                    )},
                    email = ${input.data.email || null},
                    is_rightful_owner = ${input.data.isRightfulOwner || false},
                    authorized_representative = ${
                      input.data.authorizedRepresentative || null
                    },
                    other_ip_type = ${input.data.otherIpType || null},
                    updated_at = NOW()
                  WHERE disclosure_id = ${input.disclosureId}
                `
              );
              console.log(
                "SQL update result (template approach):",
                updateResult
              );
              updateSucceeded = true;
            } catch (updateErr) {
              console.error(
                "Error executing update using SQL template:",
                updateErr
              );
              updateError = updateErr;

              // Approach 2: Try direct SQL string as a fallback
              try {
                console.log("Trying direct SQL approach as fallback...");
                // Use the sql tag to properly create a parameterized query
                const directResult = await tx.execute(
                  sql`
                    UPDATE ip_disclosure 
                    SET 
                      selected_ip_types = jsonb_build_object(
                        'copyright', ${formattedIpTypes.copyright},
                        'patent', ${formattedIpTypes.patent},
                        'utilityModel', ${formattedIpTypes.utilityModel},
                        'industrialDesign', ${
                          formattedIpTypes.industrialDesign
                        },
                        'trademark', ${formattedIpTypes.trademark},
                        'tradeSecret', ${formattedIpTypes.tradeSecret},
                        'other', ${formattedIpTypes.other},
                        'notSure', ${formattedIpTypes.notSure}
                      ),
                      email = ${input.data.email || null},
                      is_rightful_owner = ${
                        input.data.isRightfulOwner || false
                      },
                      authorized_representative = ${
                        input.data.authorizedRepresentative || null
                      },
                      other_ip_type = ${input.data.otherIpType || null},
                      updated_at = NOW()
                    WHERE disclosure_id = ${input.disclosureId}
                  `
                );

                console.log(
                  "SQL update result (direct approach):",
                  directResult
                );
                updateSucceeded = true;
              } catch (directErr) {
                console.error("Error with direct SQL approach:", directErr);

                // Approach 3: Try a third approach with individual column updates
                try {
                  console.log(
                    "Trying third fallback approach with direct JSON string..."
                  );

                  // Create a simple JSON string manually to avoid potential issues with JSON construction
                  const ipTypesJson = `{"copyright":${formattedIpTypes.copyright},"patent":${formattedIpTypes.patent},"utilityModel":${formattedIpTypes.utilityModel},"industrialDesign":${formattedIpTypes.industrialDesign},"trademark":${formattedIpTypes.trademark},"tradeSecret":${formattedIpTypes.tradeSecret},"other":${formattedIpTypes.other},"notSure":${formattedIpTypes.notSure}}`;

                  console.log("Manual IP types JSON string:", ipTypesJson);

                  const thirdResult = await tx.execute(
                    sql`
                      UPDATE ip_disclosure 
                      SET 
                        selected_ip_types = ${ipTypesJson}::jsonb,
                        email = ${input.data.email || null},
                        is_rightful_owner = ${
                          input.data.isRightfulOwner || false
                        },
                        authorized_representative = ${
                          input.data.authorizedRepresentative || null
                        },
                        other_ip_type = ${input.data.otherIpType || null},
                        updated_at = NOW()
                      WHERE disclosure_id = ${input.disclosureId}
                    `
                  );

                  console.log(
                    "SQL update result (third approach):",
                    thirdResult
                  );
                  updateSucceeded = true;
                } catch (thirdErr) {
                  console.error("Error with third approach:", thirdErr);
                  // If all approaches failed, we'll use the original error
                }
              }
            }

            // If neither approach worked, throw the original error
            if (!updateSucceeded && updateError) {
              throw updateError;
            }

            // After update, verify the updated data
            const updatedRecord = await tx.execute(
              sql`SELECT selected_ip_types FROM ip_disclosure WHERE disclosure_id = ${input.disclosureId}`
            );
            if (updatedRecord.length > 0) {
              console.log("Updated IP disclosure record:", {
                selected_ip_types: updatedRecord[0].selected_ip_types,
                asString: JSON.stringify(updatedRecord[0].selected_ip_types),
                hasTrue: updatedRecord[0].selected_ip_types
                  ? Object.values(updatedRecord[0].selected_ip_types).some(
                      (v) => v === true
                    )
                  : false,
                trademark: (updatedRecord[0].selected_ip_types as any)
                  ?.trademark,
              });
            }

            // If applicants are provided, update them
            if (input.data.applicants && input.data.applicants.length > 0) {
              // Delete existing applicants first
              await tx.execute(
                sql`DELETE FROM ip_disclosure_applicant WHERE disclosure_id = ${input.disclosureId}`
              );

              // Insert new applicants
              for (const applicant of input.data.applicants) {
                await tx.execute(
                  sql`
                  INSERT INTO ip_disclosure_applicant (
                    applicant_id,
                    disclosure_id,
                    first_name,
                    middle_initial,
                    last_name,
                    created_at,
                    updated_at
                  ) 
                  VALUES (
                    ${uuidv4()},
                    ${input.disclosureId},
                    ${applicant.firstName || ""},
                    ${applicant.middleInitial || ""},
                    ${applicant.lastName || ""},
                    NOW(),
                    NOW()
                  )
                `
                );
              }
            }

            // If inventors are provided, update them
            if (input.data.inventors && input.data.inventors.length > 0) {
              // Delete existing inventors first
              await tx.execute(
                sql`DELETE FROM ip_disclosure_inventor WHERE disclosure_id = ${input.disclosureId}`
              );

              // Insert new inventors
              for (const inventor of input.data.inventors) {
                await tx.execute(
                  sql`
                  INSERT INTO ip_disclosure_inventor (
                    inventor_id,
                    disclosure_id,
                    first_name,
                    middle_initial,
                    last_name,
                    created_at,
                    updated_at
                  ) 
                  VALUES (
                    ${uuidv4()},
                    ${input.disclosureId},
                    ${inventor.firstName || ""},
                    ${inventor.middleInitial || ""},
                    ${inventor.lastName || ""},
                    NOW(),
                    NOW()
                  )
                `
                );
              }
            }
          });

          console.log("IP disclosure updated successfully");
          return { success: true };
        } catch (updateError: unknown) {
          console.error("Error updating IP disclosure:", updateError);
          const errorMessage =
            updateError instanceof Error
              ? updateError.message
              : "Unknown error";
          throw new Error(`Failed to update IP disclosure: ${errorMessage}`);
        }
      } catch (error) {
        console.error("Error updating IP disclosure:", error);
        throw new Error("Failed to update IP disclosure");
      }
    }),

  // Get an IP disclosure by ID
  getIpDisclosure: protectedProcedure
    .input(z.object({ disclosureId: z.string().uuid() }))
    .query(async ({ input }) => {
      console.log("Getting IP disclosure:", input);

      try {
        // Get the main IP disclosure record using raw SQL
        const disclosureResult = await db.execute(
          sql`SELECT * FROM ip_disclosure WHERE disclosure_id = ${input.disclosureId}`
        );

        if (!disclosureResult.length) {
          throw new Error("IP disclosure not found");
        }

        const disclosure = disclosureResult[0];

        // Log the raw selected_ip_types to debug
        console.log("Raw selected_ip_types from database:", {
          value: disclosure.selected_ip_types,
          type: typeof disclosure.selected_ip_types,
          isNull: disclosure.selected_ip_types === null,
          asString: JSON.stringify(disclosure.selected_ip_types),
        });

        // Ensure selected_ip_types is properly formatted
        let formattedIpTypes;

        try {
          // First try to parse if it's a string
          if (
            typeof disclosure.selected_ip_types === "string" &&
            disclosure.selected_ip_types.trim()
          ) {
            formattedIpTypes = JSON.parse(disclosure.selected_ip_types);
          } else {
            // Otherwise use the object directly
            formattedIpTypes = disclosure.selected_ip_types || {};
          }

          // Ensure it's an object
          if (
            typeof formattedIpTypes !== "object" ||
            formattedIpTypes === null
          ) {
            formattedIpTypes = {};
          }
        } catch (error) {
          console.error("Error parsing selected_ip_types:", error);
          formattedIpTypes = {};
        }

        // Ensure all expected fields exist with boolean values
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

        // Merge with defaults to ensure all fields exist
        const mergedIpTypes = {
          ...defaultIpTypes,
          ...formattedIpTypes,
        };

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

        // Log the formatted IP types
        console.log("Formatted selected_ip_types:", {
          original: formattedIpTypes,
          merged: mergedIpTypes,
          final: finalIpTypes,
          asJSON: JSON.stringify(finalIpTypes),
          hasTrue: Object.values(finalIpTypes).some((value) => value === true),
        });

        // Replace the original with formatted version
        disclosure.selected_ip_types = finalIpTypes;

        // Get applicants using raw SQL
        const applicantsResult = await db.execute(
          sql`SELECT * FROM ip_disclosure_applicant WHERE disclosure_id = ${input.disclosureId}`
        );

        // Get inventors using raw SQL
        const inventorsResult = await db.execute(
          sql`SELECT * FROM ip_disclosure_inventor WHERE disclosure_id = ${input.disclosureId}`
        );

        // Get copyright basic application using raw SQL
        const copyrightBasicAppResult = await db.execute(
          sql`SELECT * FROM copyright_basic_application WHERE disclosure_id = ${input.disclosureId}`
        );

        return {
          ...disclosure,
          applicants: applicantsResult,
          inventors: inventorsResult,
          copyright_basic_application:
            copyrightBasicAppResult.length > 0
              ? copyrightBasicAppResult[0]
              : null,
        };
      } catch (error) {
        console.error("Error getting IP disclosure:", error);
        throw new Error("Failed to get IP disclosure");
      }
    }),

  // Create or update trademark application
  saveTrademarkApplication: protectedProcedure
    .input(trademarkSchema)
    .mutation(async ({ input }) => {
      console.log(
        `Saving trademark application in tRPC router (registerForm=${input.registerForm}):`,
        input
      );

      try {
        // Get the current user's session ID for registry if needed
        let userId = null;
        if (input.registerForm) {
          const session = await auth();
          if (!session?.user?.id) {
            console.warn("No authenticated user found for registry creation");
          } else {
            userId = session.user.id;
          }
        }

        // Ensure nice_classifications is properly formatted as a PostgreSQL array
        const niceClassificationsArray = Array.isArray(
          input.niceClassifications
        )
          ? input.niceClassifications
          : [];

        // Ensure business_type is a valid JSON object
        const businessTypeJson = input.businessType || {
          company: false,
          soleProprietor: false,
        };

        // Format nice_classifications as a PostgreSQL array string
        const niceClassificationsString = `{${niceClassificationsArray
          .map((c) => `"${c}"`)
          .join(",")}}`;

        // Check if a trademark application already exists for this disclosure using raw SQL
        const existingResult = await db.execute(
          sql`SELECT * FROM trademark_application WHERE disclosure_id = ${input.disclosureId}`
        );

        const existing = existingResult.length > 0 ? existingResult[0] : null;
        console.log("Existing trademark application check result:", !!existing);
        console.log("Nice classifications:", niceClassificationsArray);
        console.log("Business type:", businessTypeJson);

        let trademarkId;

        if (existing) {
          // Update existing trademark application using raw SQL
          console.log(
            "Updating existing trademark application with ID:",
            existing.trademark_id
          );

          try {
            const updateResult = await db.execute(
              sql`
                UPDATE trademark_application 
                SET 
                  trademark_name = ${input.trademarkName}, 
                  description = ${input.description}, 
                  translation = ${input.translation || null}, 
                  nice_classifications = ${niceClassificationsString}::text[], 
                  business_type = ${JSON.stringify(businessTypeJson)}, 
                  legal_name = ${input.legalName}, 
                  updated_at = NOW()
                WHERE disclosure_id = ${input.disclosureId}
                RETURNING trademark_id as "trademarkId"
              `
            );

            console.log("Updated trademark application result:", updateResult);
            trademarkId = existing.trademark_id;
          } catch (updateError) {
            console.error("Error updating trademark application:", updateError);
            throw new Error("Failed to update trademark application");
          }
        } else {
          // Create new trademark application using raw SQL
          console.log("Creating new trademark application");

          try {
            trademarkId = uuidv4();
            const insertResult = await db.execute(
              sql`
                INSERT INTO trademark_application (
                  trademark_id,
                  disclosure_id, 
                  trademark_name, 
                  description, 
                  translation, 
                  nice_classifications, 
                  business_type, 
                  legal_name, 
                  created_at, 
                  updated_at
                ) VALUES (
                  ${trademarkId},
                  ${input.disclosureId}, 
                  ${input.trademarkName}, 
                  ${input.description}, 
                  ${input.translation || null}, 
                  ${niceClassificationsString}::text[], 
                  ${JSON.stringify(businessTypeJson)}, 
                  ${input.legalName}, 
                  NOW(), 
                  NOW()
                ) RETURNING trademark_id as "trademarkId"
              `
            );

            console.log("Created trademark application result:", insertResult);
          } catch (insertError: unknown) {
            console.error(
              "Error inserting trademark application:",
              insertError
            );
            throw new Error("Failed to insert trademark application");
          }
        }

        // Check if an IP application already exists for this disclosure
        const ipApplicationResult = await db.execute(
          sql`SELECT application_id FROM ip_disclosure WHERE disclosure_id = ${input.disclosureId}`
        );

        let applicationId = null;
        if (
          ipApplicationResult.length > 0 &&
          ipApplicationResult[0].application_id
        ) {
          applicationId = ipApplicationResult[0].application_id;
          console.log("Using existing application ID:", applicationId);
        } else {
          // Create a new IP application record
          applicationId = uuidv4();
          console.log("Creating new application ID:", applicationId);

          // Create the IP application record
          await db.execute(
            sql`
              INSERT INTO ip_application (
                id, 
                user_id,
                title,
                description,
                ip_type,
                status,
                created_at,
                updated_at
              ) VALUES (
                ${applicationId},
                (SELECT client_id FROM ip_disclosure WHERE disclosure_id = ${
                  input.disclosureId
                }),
                ${input.trademarkName || "Trademark Application"},
                ${input.description || "Trademark application submission"},
                'trademark',
                'draft',
                NOW(),
                NOW()
              )
            `
          );
          console.log(
            "Created new IP application record with ID:",
            applicationId
          );
        }

        // Update the ip_disclosure table with the application_id
        await db.execute(
          sql`
            UPDATE ip_disclosure
            SET 
              application_id = ${applicationId},
              updated_at = NOW()
            WHERE disclosure_id = ${input.disclosureId}
          `
        );
        console.log(
          "Updated ip_disclosure with application_id:",
          applicationId
        );

        // If registerForm is true, create/update an entry in the form_submission_registry
        if (input.registerForm && userId) {
          console.log(
            "Creating/updating form registry entry for trademark application"
          );

          try {
            // Check if an entry already exists
            const existingRegistry = await db.execute(
              sql`SELECT registry_id FROM form_submission_registry 
                  WHERE source_type = 'ip_disclosure' 
                  AND source_id = ${input.disclosureId}
                  LIMIT 1`
            );

            if (existingRegistry.length > 0) {
              console.log("Updating existing registry entry");
              // Update existing registry entry
              await db.execute(
                sql`UPDATE form_submission_registry
                    SET updated_at = NOW(), 
                        ip_application_id = ${applicationId},
                        title = 'IP Disclosure - Trademark'
                    WHERE registry_id = ${existingRegistry[0].registry_id}`
              );
            } else {
              console.log("Creating new registry entry for trademark");
              // Create new registry entry
              await db.execute(
                sql`INSERT INTO form_submission_registry (
                      user_id, source_type, source_id, ip_application_id,
                      status, title, created_at, updated_at
                    ) 
                    VALUES (
                      ${userId},
                      'ip_disclosure',
                      ${input.disclosureId},
                      ${applicationId},
                      'draft',
                      'IP Disclosure - Trademark',
                      NOW(),
                      NOW()
                    )`
              );
            }
          } catch (registryError) {
            console.error(
              "Error creating/updating registry entry:",
              registryError
            );
            // Don't fail the whole operation if registry creation fails
          }
        }

        return { success: true, trademarkId, applicationId };
      } catch (error) {
        console.error("Error saving trademark application:", error);
        throw new Error("Failed to save trademark application");
      }
    }),

  // Create or update trade secret application
  saveTradeSecretApplication: protectedProcedure
    .input(tradeSecretSchema)
    .mutation(async ({ input, ctx }) => {
      console.log(
        `Saving trade secret application (registerForm=${input.registerForm}):`,
        input
      );

      try {
        // Get the current user's session ID for registry if needed
        let userId = null;
        if (input.registerForm) {
          const session = await auth();
          if (!session?.user?.id) {
            console.warn("No authenticated user found for registry creation");
          } else {
            userId = session.user.id;
          }
        }

        // Check if a trade secret application already exists for this disclosure using raw SQL
        const existingResult = await db.execute(
          sql`SELECT * FROM trade_secret_application WHERE disclosure_id = ${input.disclosureId}`
        );

        let tradeSecretId;
        const existing = existingResult.length > 0 ? existingResult[0] : null;
        console.log(
          "Existing trade secret application check result:",
          !!existing
        );

        if (existing) {
          // Update existing trade secret application using raw SQL
          tradeSecretId = existing.trade_secret_id;
          console.log(
            "Updating existing trade secret application with ID:",
            existing.trade_secret_id
          );

          await db.execute(
            sql`
              UPDATE trade_secret_application 
              SET 
                description = ${input.description}, 
                confidentiality_measures = ${input.confidentialityMeasures}, 
                updated_at = NOW()
              WHERE disclosure_id = ${input.disclosureId}
              RETURNING trade_secret_id as "tradeSecretId"
            `
          );

          console.log("Updated trade secret application");
        } else {
          // Create new trade secret application using raw SQL
          console.log("Creating new trade secret application");

          tradeSecretId = uuidv4();
          await db.execute(
            sql`
              INSERT INTO trade_secret_application (
                trade_secret_id,
                disclosure_id, 
                description, 
                confidentiality_measures, 
                created_at, 
                updated_at
              ) 
              VALUES (
                ${tradeSecretId},
                ${input.disclosureId}, 
                ${input.description}, 
                ${input.confidentialityMeasures}, 
                NOW(), 
                NOW()
              )
            `
          );

          console.log(
            "Created trade secret application with ID:",
            tradeSecretId
          );
        }

        // If registerForm is true, create/update a registry entry
        if (input.registerForm && userId) {
          console.log(
            "Creating/updating form registry entry for trade secret application"
          );

          try {
            // Get the application ID from the disclosure
            const applicationResult = await db.execute(
              sql`SELECT application_id FROM ip_disclosure WHERE disclosure_id = ${input.disclosureId} LIMIT 1`
            );

            // This may be null for some disclosures
            const applicationId =
              applicationResult.length > 0
                ? applicationResult[0].application_id
                : null;

            // Check if an entry already exists
            const existingRegistry = await db.execute(
              sql`SELECT registry_id FROM form_submission_registry 
                  WHERE source_type = 'ip_disclosure' 
                  AND source_id = ${input.disclosureId}
                  LIMIT 1`
            );

            if (existingRegistry.length > 0) {
              console.log("Updating existing registry entry");
              // Update existing registry entry
              await db.execute(
                sql`UPDATE form_submission_registry
                    SET updated_at = NOW(), 
                        ip_application_id = ${applicationId},
                        title = 'IP Disclosure - Trade Secret'
                    WHERE registry_id = ${existingRegistry[0].registry_id}`
              );
            } else {
              console.log("Creating new registry entry for trade secret");
              // Create new registry entry
              await db.execute(
                sql`INSERT INTO form_submission_registry (
                      user_id, source_type, source_id, ip_application_id,
                      status, title, created_at, updated_at
                    ) 
                    VALUES (
                      ${userId},
                      'ip_disclosure',
                      ${input.disclosureId},
                      ${applicationId},
                      'draft',
                      'IP Disclosure - Trade Secret',
                      NOW(),
                      NOW()
                    )`
              );
            }
          } catch (registryError) {
            console.error(
              "Error creating/updating registry entry:",
              registryError
            );
            // Don't fail the whole operation if registry creation fails
          }
        }

        return { success: true, tradeSecretId };
      } catch (error) {
        console.error("Error saving trade secret application:", error);
        throw new Error("Failed to save trade secret application");
      }
    }),

  // Create or update disclosure confirmation
  saveDisclosureConfirmation: protectedProcedure
    .input(disclosureConfirmationSchema)
    .mutation(async ({ input }) => {
      console.log("Saving disclosure confirmation for ID:", input.disclosureId);
      console.log("Input data:", JSON.stringify(input, null, 2));

      try {
        // First verify the disclosure ID exists
        const disclosureExists = await db.execute(
          sql`SELECT disclosure_id FROM ip_disclosure WHERE disclosure_id = ${input.disclosureId}`
        );

        console.log("Disclosure check result:", disclosureExists);

        // Check result safely
        const disclosureFound =
          disclosureExists &&
          (Array.isArray(disclosureExists)
            ? disclosureExists.length > 0
            : false);

        if (!disclosureFound) {
          console.error("Disclosure not found:", input.disclosureId);
          throw new Error("Disclosure not found");
        }

        console.log(`Verified disclosure ID ${input.disclosureId} exists`);

        // Check if a disclosure confirmation already exists for this disclosure using raw SQL
        const existingResult = await db.execute(
          sql`SELECT * FROM disclosure_confirmation WHERE disclosure_id = ${input.disclosureId}`
        );

        const existing = existingResult.length > 0 ? existingResult[0] : null;
        console.log(
          "Existing disclosure confirmation check result:",
          !!existing
        );

        // Safely prepare the JSON data
        const writtenDisclosuresJson = JSON.stringify({
          past: input.writtenDisclosures.past || false,
          planned: input.writtenDisclosures.planned || false,
          notApplicable: input.writtenDisclosures.notApplicable || false,
        });

        const oralDisclosuresJson = JSON.stringify({
          past: input.oralDisclosures.past || false,
          planned: input.oralDisclosures.planned || false,
          notApplicable: input.oralDisclosures.notApplicable || false,
        });

        console.log("Prepared JSON data:", {
          writtenDisclosuresJson,
          oralDisclosuresJson,
        });

        if (existing) {
          // Update existing disclosure confirmation using raw SQL
          console.log(
            "Updating existing disclosure confirmation with ID:",
            existing.confirmation_id
          );

          try {
            const updateResult = await db.execute(
              sql`
                UPDATE disclosure_confirmation 
                SET 
                  written_disclosures = ${writtenDisclosuresJson}::jsonb, 
                  oral_disclosures = ${oralDisclosuresJson}::jsonb, 
                  future_work = ${input.futureWork || null}, 
                  confirmation_declaration = ${input.confirmationDeclaration}, 
                  updated_at = NOW()
                WHERE disclosure_id = ${input.disclosureId}
                RETURNING confirmation_id as "confirmationId"
              `
            );

            console.log("Update result:", updateResult);
            console.log("Updated disclosure confirmation successfully");
            return { success: true, confirmationId: existing.confirmation_id };
          } catch (updateError) {
            console.error(
              "Error updating disclosure confirmation:",
              updateError
            );
            if (updateError instanceof Error) {
              console.error(
                "Error details:",
                updateError.message,
                updateError.stack
              );
            }
            throw new Error(
              `Failed to update disclosure confirmation: ${
                updateError instanceof Error
                  ? updateError.message
                  : "Unknown error"
              }`
            );
          }
        } else {
          // Create new disclosure confirmation using raw SQL
          console.log("Creating new disclosure confirmation");

          try {
            const confirmationId = uuidv4();
            const insertResult = await db.execute(
              sql`
                INSERT INTO disclosure_confirmation (
                  confirmation_id,
                  disclosure_id, 
                  written_disclosures, 
                  oral_disclosures, 
                  future_work, 
                  confirmation_declaration, 
                  created_at, 
                  updated_at
                ) 
                VALUES (
                  ${confirmationId},
                  ${input.disclosureId}, 
                  ${writtenDisclosuresJson}::jsonb, 
                  ${oralDisclosuresJson}::jsonb, 
                  ${input.futureWork || null}, 
                  ${input.confirmationDeclaration}, 
                  NOW(), 
                  NOW()
                )
                RETURNING confirmation_id as "confirmationId"
              `
            );

            console.log("Insert result:", insertResult);
            console.log(
              "Created disclosure confirmation with ID:",
              confirmationId
            );
            return { success: true, confirmationId };
          } catch (insertError) {
            console.error(
              "Error inserting disclosure confirmation:",
              insertError
            );
            if (insertError instanceof Error) {
              console.error(
                "Error details:",
                insertError.message,
                insertError.stack
              );
            }
            throw new Error(
              `Failed to insert disclosure confirmation: ${
                insertError instanceof Error
                  ? insertError.message
                  : "Unknown error"
              }`
            );
          }
        }
      } catch (error) {
        console.error("Error saving disclosure confirmation:", error);
        if (error instanceof Error) {
          console.error("Error details:", error.message, error.stack);
        }
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to save disclosure confirmation"
        );
      }
    }),

  // Check if a trademark application exists for a disclosure ID
  checkTrademarkExists: protectedProcedure
    .input(z.object({ disclosureId: z.string().uuid() }))
    .query(async ({ input }) => {
      console.log("Checking if trademark application exists:", input);

      try {
        // Check if a trademark application exists for this disclosure using raw SQL
        const existingResult = await db.execute(
          sql`SELECT trademark_id FROM trademark_application WHERE disclosure_id = ${input.disclosureId}`
        );

        const exists = existingResult.length > 0;
        const trademarkId = exists ? existingResult[0].trademark_id : null;

        console.log("Trademark application check result:", exists);
        return { exists, trademarkId };
      } catch (error) {
        console.error("Error checking trademark application:", error);
        throw new Error("Failed to check trademark application");
      }
    }),

  // Check if a patent search report exists for a patent ID
  checkPatentSearchReportExists: protectedProcedure
    .input(
      z.object({
        patentId: z.string(),
      })
    )
    .query(async ({ input }) => {
      console.log(
        "TRPC: Input received for checkPatentSearchReportExists:",
        input
      );
      console.log(
        "TRPC: Checking if patent search report exists for ID:",
        input.patentId
      );

      if (!input.patentId) {
        console.error("TRPC: Patent ID is empty or undefined");
        return { exists: false, searchId: null, searchData: null };
      }

      try {
        // Log the SQL query we're about to execute
        console.log(
          `TRPC: Executing SQL query: SELECT search_id, search_strings, relevant_documents, search_databases, search_date, search_summary FROM patent_search_report WHERE patent_id = '${input.patentId}'`
        );

        // Check if a patent search report exists for this patent using raw SQL
        const existingResult = await db.execute(
          sql`SELECT search_id, search_strings, relevant_documents, search_databases, search_date, search_summary FROM patent_search_report WHERE patent_id = ${input.patentId}`
        );

        console.log(
          "TRPC: SQL query result:",
          JSON.stringify({
            resultLength: existingResult.length,
            firstRow:
              existingResult.length > 0
                ? {
                    search_id: existingResult[0].search_id,
                    has_search_strings: !!existingResult[0].search_strings,
                    has_relevant_documents:
                      !!existingResult[0].relevant_documents,
                    has_search_databases: !!existingResult[0].search_databases,
                    has_search_date: !!existingResult[0].search_date,
                    has_search_summary: !!existingResult[0].search_summary,
                  }
                : null,
          })
        );

        const exists = existingResult.length > 0;
        const searchId = exists ? existingResult[0].search_id : null;
        const searchData = exists ? existingResult[0] : null;

        console.log("TRPC: Patent search report check result:", exists);
        if (exists && searchData) {
          console.log("TRPC: Search report data from database:", {
            searchId,
            searchStringsLength: searchData.search_strings
              ? JSON.stringify(searchData.search_strings).length
              : 0,
            relevantDocumentsLength: searchData.relevant_documents
              ? JSON.stringify(searchData.relevant_documents).length
              : 0,
            searchDatabases: searchData.search_databases || [],
            searchDate: searchData.search_date || null,
            searchSummary:
              typeof searchData.search_summary === "string"
                ? searchData.search_summary.substring(0, 50) + "..."
                : "No summary available",
          });
        }

        return { exists, searchId, searchData };
      } catch (error) {
        console.error("TRPC: Error checking patent search report:", error);
        // Log more details about the error
        if (error instanceof Error) {
          console.error("TRPC: Error message:", error.message);
          console.error("TRPC: Error stack:", error.stack);
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to check patent search report: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        });
      }
    }),

  // Submit the entire IP disclosure form
  submitIpDisclosure: protectedProcedure
    .input(z.object({ disclosureId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      console.log("Submitting IP disclosure:", input);

      try {
        // Update the status of the IP disclosure to submitted using raw SQL
        // No submission_date column exists, so we only update status and updated_at
        await db.execute(
          sql`
            UPDATE ip_disclosure 
            SET 
              status = 'submitted', 
              updated_at = NOW()
            WHERE disclosure_id = ${input.disclosureId}
          `
        );

        console.log("Submitted IP disclosure");
        return { success: true };
      } catch (error) {
        console.error("Error submitting IP disclosure:", error);
        throw new Error("Failed to submit IP disclosure");
      }
    }),

  // Save copyright application and related data
  saveCopyrightApplication: protectedProcedure
    .input(
      z.object({
        disclosureId: z.string().uuid(),
        copyrightApplication: z
          .object({
            workTitle: z
              .string()
              .min(1)
              .transform((val) =>
                // Clean up any non-standard characters
                val.replace(/[^\x20-\x7E]/g, "")
              ),
            workDescription: z
              .string()
              .min(1)
              .transform((val) =>
                // Clean up any non-standard characters
                val.replace(/[^\x20-\x7E]/g, "")
              ),
            creationDate: z
              .string()
              .min(1)
              .transform((val) =>
                // Clean up the date and ensure it's properly formatted
                val.replace(/[^\x20-\x7E0-9\-]/g, "")
              ),
            category: z.string().optional(),
            publicationStatus: z.string().optional(),
            publicationDate: z.string().optional(),
            publicationCountry: z.string().optional(),
          })
          .nullish(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        console.log(
          "Processing copyright application with disclosure ID:",
          input.disclosureId
        );

        // Check if a copyright application already exists for this disclosure
        const existingCopyright = await db.execute(
          sql`SELECT copyright_id FROM copyright_basic_application WHERE disclosure_id = ${input.disclosureId}`
        );

        console.log("Copyright check result:", existingCopyright);

        // Check result safely
        const copyrightFound =
          existingCopyright &&
          (Array.isArray(existingCopyright)
            ? existingCopyright.length > 0
            : false);

        let copyrightId;

        if (input.copyrightApplication) {
          // Format the data for the database with proper sanitization
          const copyrightData = {
            workTitle: input.copyrightApplication.workTitle || "Untitled Work",
            workDescription:
              input.copyrightApplication.workDescription ||
              "No description provided",
            // Ensure the date is properly formatted - convert to ISO date format
            creationDate: input.copyrightApplication.creationDate
              ? new Date(input.copyrightApplication.creationDate)
                  .toISOString()
                  .split("T")[0]
              : new Date().toISOString().split("T")[0],
          };

          console.log("Formatted copyright data:", copyrightData);

          if (copyrightFound) {
            // Update existing copyright application
            copyrightId =
              Array.isArray(existingCopyright) && existingCopyright.length > 0
                ? existingCopyright[0].copyright_id
                : null;

            if (!copyrightId) {
              console.error("Failed to extract copyright ID from result");
              throw new Error("Failed to process copyright application");
            }

            console.log(
              "Updating existing copyright application with ID:",
              copyrightId
            );

            await db.execute(
              sql`
                UPDATE copyright_basic_application
                SET 
                  work_title = ${copyrightData.workTitle},
                  work_description = ${copyrightData.workDescription},
                  creation_date = ${copyrightData.creationDate},
                  updated_at = NOW()
                WHERE copyright_id = ${copyrightId}
              `
            );
            console.log("Copyright application updated successfully");
          } else {
            // Insert new copyright application
            console.log("Creating new copyright application");
            copyrightId = uuidv4(); // Generate new UUID for copyright_id

            await db.execute(
              sql`
                INSERT INTO copyright_basic_application (
                  copyright_id,
                  disclosure_id,
                  work_title,
                  work_description,
                  creation_date,
                  created_at,
                  updated_at
                )
                VALUES (
                  ${copyrightId},
                  ${input.disclosureId},
                  ${copyrightData.workTitle},
                  ${copyrightData.workDescription},
                  ${copyrightData.creationDate},
                  NOW(),
                  NOW()
                )
              `
            );

            console.log(
              "New copyright application created with ID:",
              copyrightId
            );
          }
        } else if (copyrightFound) {
          // Use existing copyright ID if application data not provided
          copyrightId =
            Array.isArray(existingCopyright) && existingCopyright.length > 0
              ? existingCopyright[0].copyright_id
              : null;

          if (!copyrightId) {
            console.error("Failed to extract copyright ID from result");
            throw new Error("Failed to process copyright application");
          }

          console.log("Using existing copyright ID:", copyrightId);
        } else {
          // Create a new basic application if none exists
          console.log("Creating a default copyright basic application");
          copyrightId = uuidv4();

          // Use a proper date format for the default value
          const todayFormatted = new Date().toISOString().split("T")[0];

          await db.execute(
            sql`
              INSERT INTO copyright_basic_application (
                copyright_id,
                disclosure_id,
                work_title,
                work_description,
                creation_date,
                created_at,
                updated_at
              )
              VALUES (
                ${copyrightId},
                ${input.disclosureId},
                ${"Untitled Work"},
                ${"No description provided"},
                ${todayFormatted},
                NOW(),
                NOW()
              )
            `
          );
          console.log(
            "Created default copyright basic application with ID:",
            copyrightId
          );
        }

        return {
          success: true,
          copyrightId,
          message: "Copyright application data saved successfully",
        };
      } catch (error: unknown) {
        console.error("Error saving copyright application:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to save copyright application: ${errorMessage}`,
        });
      }
    }),

  // Save patent/utility model application
  savePatentUtilityModelApplication: protectedProcedure
    .input(
      z.object({
        disclosureId: z.string(),
        title: z.string(),
        description: z.string().optional(),
        additionalData: z.record(z.any()).optional(),
        registerForm: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const {
        disclosureId,
        title,
        description,
        additionalData,
        registerForm = false,
      } = input;

      console.log("Saving patent/utility model application with input:", {
        disclosureId,
        title,
        description: description ? "Present" : "Not provided",
        additionalData: additionalData ? Object.keys(additionalData) : "None",
        registerForm,
      });

      // Get user ID for form registry if needed
      let userId = null;
      if (registerForm) {
        const session = await auth();
        if (!session?.user?.id) {
          console.warn("No authenticated user found for registry creation");
        } else {
          userId = session.user.id;
        }
      }

      try {
        // Check if a patent application already exists for this disclosure
        const existingPatentResult = await db.execute(
          sql`SELECT patent_id FROM patent_utility_model_application WHERE disclosure_id = ${disclosureId}`
        );

        let patentId;

        if (existingPatentResult.length > 0) {
          // Update existing patent application
          patentId = existingPatentResult[0].patent_id;
          console.log(`Updating existing patent with ID: ${patentId}`);

          await db.execute(
            sql`
              UPDATE patent_utility_model_application 
              SET title = ${title}, 
                  solution = ${description || ""}, 
                  problem = ${additionalData?.problem || ""},
                  comparison = ${additionalData?.comparison || ""},
                  novelty = ${additionalData?.novelty || ""},
                  variations = ${additionalData?.variations || null},
                  usage = ${additionalData?.usage || ""},
                  literature_references = ${
                    additionalData?.literature_references || null
                  },
                  own_publications = ${additionalData?.ownPublications || null},
                  technology_type = ${JSON.stringify(
                    additionalData?.technologyType || {}
                  )}::jsonb,
                  technology_field = ${JSON.stringify(
                    additionalData?.technologyField || {}
                  )}::jsonb,
                  files = ${JSON.stringify(additionalData || {})}::jsonb, 
                  updated_at = NOW() 
              WHERE patent_id = ${patentId}
            `
          );
        } else {
          // Insert new patent application
          console.log("Creating new patent application record");
          patentId = uuidv4();

          // Extract technology type and field from additionalData if available
          const technologyType = additionalData?.technologyType || {
            product: false,
            process: false,
            material: false,
            software: false,
          };

          const technologyField = additionalData?.technologyField || {
            chemical: false,
            mechanical: false,
            electrical: false,
            computer: false,
            pharmaceutical: false,
            biotechnology: false,
            other: false,
          };

          // Determine the type (patent or utility model)
          const type = additionalData?.isPatent ? "patent" : "utility_model";

          await db.execute(
            sql`
              INSERT INTO patent_utility_model_application 
              (patent_id, disclosure_id, title, type, technology_type, technology_field, 
               problem, solution, comparison, novelty, variations, usage, literature_references, 
               own_publications, files, created_at, updated_at) 
              VALUES (
                ${patentId},
                ${disclosureId},
                ${title},
                ${type},
                ${JSON.stringify(technologyType)}::jsonb,
                ${JSON.stringify(technologyField)}::jsonb,
                ${additionalData?.problem || ""},
                ${description || ""},
                ${additionalData?.comparison || ""},
                ${additionalData?.novelty || ""},
                ${additionalData?.variations || null},
                ${additionalData?.usage || ""},
                ${additionalData?.literature_references || null},
                ${additionalData?.ownPublications || null},
                ${JSON.stringify(additionalData || {})}::jsonb,
                NOW(),
                NOW()
              )
            `
          );
          console.log(`Created new patent with ID: ${patentId}`);
        }

        // If registerForm is true, create/update an entry in the form_submission_registry
        if (registerForm && userId) {
          console.log(
            "Creating/updating form registry entry for patent/utility model application"
          );

          try {
            // Check if an entry already exists
            const existingRegistry = await db.execute(
              sql`SELECT registry_id FROM form_submission_registry 
                  WHERE source_type = 'ip_disclosure' 
                  AND source_id = ${disclosureId}
                  LIMIT 1`
            );

            // Get the application ID
            const applicationResult = await db.execute(
              sql`SELECT application_id FROM ip_disclosure WHERE disclosure_id = ${disclosureId} LIMIT 1`
            );

            const applicationId =
              applicationResult.length > 0
                ? applicationResult[0].application_id
                : null;

            if (existingRegistry.length > 0) {
              console.log("Updating existing registry entry");
              // Update existing registry entry
              await db.execute(
                sql`UPDATE form_submission_registry
                    SET updated_at = NOW(), 
                        ip_application_id = ${applicationId},
                        title = ${
                          additionalData?.isPatent
                            ? "Patent Application"
                            : "Utility Model Application"
                        }
                    WHERE registry_id = ${existingRegistry[0].registry_id}`
              );
            } else {
              console.log(
                "Creating new registry entry for patent/utility model"
              );
              // Create new registry entry
              await db.execute(
                sql`INSERT INTO form_submission_registry (
                      user_id, source_type, source_id, ip_application_id,
                      status, title, created_at, updated_at
                    ) 
                    VALUES (
                      ${userId},
                      'ip_disclosure',
                      ${disclosureId},
                      ${applicationId},
                      'draft',
                      ${
                        additionalData?.isPatent
                          ? "Patent Application"
                          : "Utility Model Application"
                      },
                      NOW(),
                      NOW()
                    )`
              );
            }
          } catch (registryError) {
            console.error(
              "Error creating/updating registry entry:",
              registryError
            );
            // Don't fail the whole operation if registry creation fails
          }
        }

        // Handle matrix sample data if present
        if (additionalData?.matrixSample) {
          try {
            const matrixSample = additionalData.matrixSample;
            console.log("Processing matrix sample data:", {
              inventionTitle: matrixSample.inventionTitle
                ? "Present"
                : "Missing",
              priorArts: Array.isArray(matrixSample.priorArts)
                ? matrixSample.priorArts.length
                : "Not an array",
              features: Array.isArray(matrixSample.features)
                ? matrixSample.features.length
                : "Not an array",
            });

            // Check if a matrix sample already exists for this patent
            const existingMatrixResult = await db.execute(
              sql`SELECT matrix_id FROM patent_matrix_sample WHERE patent_id = ${patentId}`
            );

            if (existingMatrixResult.length > 0) {
              // Update existing matrix sample
              const matrixId = existingMatrixResult[0].matrix_id;
              console.log(
                `Updating existing matrix sample with ID: ${matrixId}`
              );

              await db.execute(
                sql`
                  UPDATE patent_matrix_sample 
                  SET invention_title = ${matrixSample.inventionTitle || ""}, 
                      prior_arts = ${JSON.stringify(
                        matrixSample.priorArts || []
                      )}::jsonb, 
                      features = ${JSON.stringify(
                        matrixSample.features || []
                      )}::jsonb, 
                      matrix_data = ${JSON.stringify(
                        matrixSample.matrixData || {}
                      )}::jsonb,
                      analysis_summary = ${matrixSample.analysisSummary || ""},
                      conclusion = ${matrixSample.conclusion || ""},
                      updated_at = NOW() 
                  WHERE matrix_id = ${matrixId}
                `
              );
            } else {
              // Insert new matrix sample
              console.log("Creating new matrix sample record");
              const matrixId = uuidv4();
              await db.execute(
                sql`
                  INSERT INTO patent_matrix_sample 
                  (matrix_id, patent_id, disclosure_id, invention_title, prior_arts, features, matrix_data, analysis_summary, conclusion, created_at, updated_at) 
                  VALUES (
                    ${matrixId},
                    ${patentId},
                    ${disclosureId},
                    ${matrixSample.inventionTitle || ""},
                    ${JSON.stringify(matrixSample.priorArts || [])}::jsonb,
                    ${JSON.stringify(matrixSample.features || [])}::jsonb,
                    ${JSON.stringify(matrixSample.matrixData || {})}::jsonb,
                    ${matrixSample.analysisSummary || ""},
                    ${matrixSample.conclusion || ""},
                    NOW(),
                    NOW()
                  )
                `
              );
            }
            console.log("Matrix sample data saved successfully");
          } catch (matrixError) {
            console.error("Error saving matrix sample data:", matrixError);
            console.error(
              "Error details:",
              matrixError instanceof Error
                ? matrixError.message
                : "Unknown error"
            );
            // Don't throw, allow the main operation to continue
          }
        }

        // Handle search report data if present
        if (additionalData?.searchReport) {
          try {
            const searchReport = additionalData.searchReport;
            console.log("Processing search report data:", {
              title: searchReport.title ? "Present" : "Missing",
              dateCompleted: searchReport.dateCompleted ? "Present" : "Missing",
              searchStrings: Array.isArray(searchReport.searchStrings)
                ? searchReport.searchStrings.length
                : "Not an array",
              documents: Array.isArray(searchReport.documents)
                ? searchReport.documents.length
                : "Not an array",
            });

            // Prepare certification data
            const certification = searchReport.certification || {
              technicalExpert: "",
              reviewedBy: "",
              submittedTo: {
                name: "",
                position: "Director, TILO Manager, ITSO",
              },
            };

            // Prepare search databases as a properly formatted PostgreSQL array string
            let searchDatabasesStr = "{}"; // Default empty array
            if (
              Array.isArray(searchReport.searchStrings) &&
              searchReport.searchStrings.length > 0
            ) {
              // Extract unique database names from searchStrings
              const databaseSet = new Set<string>();
              searchReport.searchStrings.forEach(
                (s: { database?: string; customDatabase?: string }) => {
                  if (s.database && s.database !== "Other") {
                    databaseSet.add(s.database);
                  } else if (s.customDatabase) {
                    databaseSet.add(s.customDatabase);
                  }
                }
              );

              const databases = Array.from(databaseSet);
              if (databases.length > 0) {
                searchDatabasesStr =
                  "{" +
                  databases
                    .map((database: string) => `"${database}"`)
                    .join(",") +
                  "}";
                console.log("Extracted search databases:", searchDatabasesStr);
              }
            }

            // Check if a search report already exists for this patent
            const existingReportResult = await db.execute(
              sql`SELECT search_id FROM patent_search_report WHERE patent_id = ${patentId}`
            );

            if (existingReportResult.length > 0) {
              // Update existing search report
              const reportId = existingReportResult[0].search_id;
              console.log(
                `Updating existing search report with ID: ${reportId}`
              );

              await db.execute(
                sql`
                  UPDATE patent_search_report 
                  SET search_date = ${
                    searchReport.dateCompleted
                      ? typeof searchReport.dateCompleted === "string"
                        ? searchReport.dateCompleted
                        : searchReport.dateCompleted instanceof Date
                        ? searchReport.dateCompleted.toISOString().split("T")[0]
                        : new Date().toISOString().split("T")[0]
                      : new Date().toISOString().split("T")[0]
                  }::date, 
                      search_strings = ${JSON.stringify(
                        searchReport.searchStrings || []
                      )}::jsonb, 
                      search_databases = ${searchDatabasesStr}::text[], 
                      relevant_documents = ${JSON.stringify(
                        searchReport.documents || []
                      )}::jsonb, 
                      search_summary = ${searchReport.abstract || ""}, 
                      certification = ${JSON.stringify(certification)}::jsonb, 
                      updated_at = NOW() 
                  WHERE search_id = ${reportId}
                `
              );
              console.log("Updated search report successfully");
            } else {
              // Insert new search report
              console.log("Creating new search report record");
              const searchId = uuidv4();
              await db.execute(
                sql`
                  INSERT INTO patent_search_report (
                    search_id,
                    patent_id,
                    disclosure_id,
                    search_date,
                    search_strings,
                    search_databases,
                    relevant_documents,
                    search_summary,
                    certification,
                    created_at,
                    updated_at
                  ) 
                  VALUES (
                    ${searchId},
                    ${patentId},
                    ${disclosureId},
                    ${
                      searchReport.dateCompleted
                        ? typeof searchReport.dateCompleted === "string"
                          ? searchReport.dateCompleted
                          : searchReport.dateCompleted instanceof Date
                          ? searchReport.dateCompleted
                              .toISOString()
                              .split("T")[0]
                          : new Date().toISOString().split("T")[0]
                        : new Date().toISOString().split("T")[0]
                    }::date,
                    ${JSON.stringify(searchReport.searchStrings || [])}::jsonb,
                    ${searchDatabasesStr}::text[],
                    ${JSON.stringify(searchReport.documents || [])}::jsonb,
                    ${searchReport.abstract || ""},
                    ${JSON.stringify(certification)}::jsonb,
                    NOW(),
                    NOW()
                  )
                `
              );
              console.log("Created search report with ID:", searchId);
            }
            console.log("Search report data saved successfully");
          } catch (reportError) {
            console.error("Error saving search report data:", reportError);
            console.error(
              "Error details:",
              reportError instanceof Error
                ? reportError.message
                : "Unknown error"
            );
            // Don't throw, allow the main operation to continue
          }
        }

        return {
          success: true,
          patentId: patentId,
        };
      } catch (error) {
        console.error("Error saving patent/utility model application:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to save patent/utility model application: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        });
      }
    }),

  // Check if a disclosure ID exists in the database
  checkDisclosureExists: protectedProcedure
    .input(z.object({ disclosureId: z.string().uuid() }))
    .query(async ({ input }) => {
      console.log("Checking if disclosure ID exists:", input.disclosureId);

      try {
        // Check if the disclosure exists in the database
        const result = await db.execute(
          sql`SELECT disclosure_id FROM ip_disclosure WHERE disclosure_id = ${input.disclosureId}`
        );

        const exists = result.length > 0;
        console.log(`Disclosure ID ${input.disclosureId} exists: ${exists}`);

        return { exists };
      } catch (error) {
        console.error("Error checking if disclosure exists:", error);
        return { exists: false };
      }
    }),

  // Add the getUserDisclosures endpoint to fetch all disclosures for a user
  getUserDisclosures: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
      })
    )
    .query(async ({ input }) => {
      console.log("Getting IP disclosures for user:", input.userId);

      try {
        // Get all IP disclosure records for this user using raw SQL
        // Order by created_at desc to get the most recent first
        const disclosureResults = await db.execute(
          sql`
            SELECT 
              disclosure_id as "disclosureId", 
              client_id as "clientId",
              status,
              created_at as "createdAt",
              updated_at as "updatedAt" 
            FROM ip_disclosure 
            WHERE client_id = ${input.userId}
            ORDER BY created_at DESC
          `
        );

        console.log(
          `Found ${disclosureResults.length} disclosure(s) for user ${input.userId}`
        );

        return disclosureResults;
      } catch (error) {
        console.error("Error getting user IP disclosures:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get user IP disclosures",
        });
      }
    }),

  // Get trademark application for a disclosure ID
  getTrademarkApplication: protectedProcedure
    .input(z.object({ disclosureId: z.string().uuid() }))
    .query(async ({ input }) => {
      console.log(
        "Getting trademark application for disclosure ID:",
        input.disclosureId
      );

      try {
        // Query the trademark_application table directly
        const result = await db.execute(
          sql`SELECT * FROM trademark_application WHERE disclosure_id = ${input.disclosureId}`
        );

        if (result.length === 0) {
          console.log(
            "No trademark application found for disclosure ID:",
            input.disclosureId
          );
          return null;
        }

        console.log("Found trademark application:", result[0]);
        return result[0];
      } catch (error) {
        console.error("Error getting trademark application:", error);
        throw new Error("Failed to get trademark application");
      }
    }),
});
