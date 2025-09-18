import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/drizzle/db"; // Import the database connection directly
import { sql } from "drizzle-orm"; // Import sql template tag for safe queries

export const dynamic = "force-dynamic";

// GET handler for retrieving confirmation data for a specific disclosure
export async function GET(
  request: NextRequest,
  { params }: { params: { disclosureId: string } }
) {
  try {
    // Get the disclosure ID from the params
    const { disclosureId } = params;
    console.log("Fetching confirmation data for disclosure ID:", disclosureId);

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

    // Check if the user is authenticated
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // First check if the disclosure exists in the database
    try {
      console.log("Checking if disclosure exists with ID:", disclosureId);
      const disclosureCheck = await db.execute(
        sql`SELECT disclosure_id FROM ip_disclosure WHERE disclosure_id = ${disclosureId} LIMIT 1`
      );

      if (!disclosureCheck || disclosureCheck.length === 0) {
        console.log("No disclosure found with ID:", disclosureId);
        return NextResponse.json(
          { error: "Disclosure not found" },
          { status: 404 }
        );
      }

      console.log("Disclosure exists, proceeding to fetch confirmation data");
    } catch (checkError) {
      console.error("Error checking if disclosure exists:", checkError);
      return NextResponse.json(
        { error: "Error verifying disclosure" },
        { status: 500 }
      );
    }

    // Direct database query to get confirmation data
    try {
      console.log(
        "Querying disclosure_confirmation table for ID:",
        disclosureId
      );

      // Execute a direct SQL query to get confirmation data
      const rawConfirmation = await db.execute(
        sql`SELECT * FROM disclosure_confirmation WHERE disclosure_id = ${disclosureId}`
      );

      console.log("Raw confirmation query result:", rawConfirmation);

      if (rawConfirmation && rawConfirmation.length > 0) {
        console.log("Found confirmation data:", rawConfirmation[0]);

        // Parse JSON fields if they're stored as strings
        let writtenDisclosures = rawConfirmation[0].written_disclosures;
        let oralDisclosures = rawConfirmation[0].oral_disclosures;

        // Parse JSON if needed
        if (typeof writtenDisclosures === "string") {
          try {
            writtenDisclosures = JSON.parse(writtenDisclosures);
          } catch (e) {
            console.error("Error parsing written_disclosures:", e);
            writtenDisclosures = {
              past: false,
              planned: false,
              notApplicable: false,
            };
          }
        }

        if (typeof oralDisclosures === "string") {
          try {
            oralDisclosures = JSON.parse(oralDisclosures);
          } catch (e) {
            console.error("Error parsing oral_disclosures:", e);
            oralDisclosures = {
              past: false,
              planned: false,
              notApplicable: false,
            };
          }
        }

        // Create a structured response
        const confirmationData = {
          written_disclosures: writtenDisclosures || {
            past: false,
            planned: false,
            notApplicable: false,
          },
          oral_disclosures: oralDisclosures || {
            past: false,
            planned: false,
            notApplicable: false,
          },
          future_work: rawConfirmation[0].future_work || "",
          confirmation_declaration: Boolean(
            rawConfirmation[0].confirmation_declaration
          ),
          confirmation_id: rawConfirmation[0].confirmation_id,
          disclosure_id: rawConfirmation[0].disclosure_id,
        };

        console.log("Formatted confirmation data:", confirmationData);
        return NextResponse.json({ data: confirmationData });
      }

      // Also try a different table name if the first query returns no results
      if (!rawConfirmation || rawConfirmation.length === 0) {
        console.log(
          "No data in disclosure_confirmation, trying confirmation table..."
        );

        const altConfirmation = await db.execute(
          sql`SELECT * FROM confirmation WHERE disclosure_id = ${disclosureId}`
        );

        if (altConfirmation && altConfirmation.length > 0) {
          console.log(
            "Found confirmation data in alternative table:",
            altConfirmation[0]
          );

          // Parse JSON fields if they're stored as strings
          let writtenDisclosures = altConfirmation[0].written_disclosures;
          let oralDisclosures = altConfirmation[0].oral_disclosures;

          // Parse JSON if needed
          if (typeof writtenDisclosures === "string") {
            try {
              writtenDisclosures = JSON.parse(writtenDisclosures);
            } catch (e) {
              console.error("Error parsing written_disclosures:", e);
              writtenDisclosures = {
                past: false,
                planned: false,
                notApplicable: false,
              };
            }
          }

          if (typeof oralDisclosures === "string") {
            try {
              oralDisclosures = JSON.parse(oralDisclosures);
            } catch (e) {
              console.error("Error parsing oral_disclosures:", e);
              oralDisclosures = {
                past: false,
                planned: false,
                notApplicable: false,
              };
            }
          }

          // Create a structured response
          const confirmationData = {
            written_disclosures: writtenDisclosures || {
              past: false,
              planned: false,
              notApplicable: false,
            },
            oral_disclosures: oralDisclosures || {
              past: false,
              planned: false,
              notApplicable: false,
            },
            future_work: altConfirmation[0].future_work || "",
            confirmation_declaration: Boolean(
              altConfirmation[0].confirmation_declaration
            ),
            confirmation_id:
              altConfirmation[0].id || altConfirmation[0].confirmation_id,
            disclosure_id: altConfirmation[0].disclosure_id,
          };

          console.log(
            "Formatted confirmation data from alternative table:",
            confirmationData
          );
          return NextResponse.json({ data: confirmationData });
        }
      }
    } catch (dbError) {
      console.error("Error querying database for confirmation data:", dbError);
      // Continue to fallback - don't return error yet
    }

    // If we get here, we couldn't find confirmation data through any method
    console.log("No confirmation data found for disclosure ID:", disclosureId);
    return NextResponse.json(
      { message: "No confirmation data found for this disclosure" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error fetching confirmation data:", error);
    return NextResponse.json(
      { error: "Error fetching confirmation data" },
      { status: 500 }
    );
  }
}

// POST handler for saving confirmation data
export async function POST(
  request: NextRequest,
  { params }: { params: { disclosureId: string } }
) {
  try {
    // Parse the request body
    const body = await request.json();
    const { disclosureId } = params;

    // Check if we should register this form in the registry
    const registerForm = body.registerForm === true;
    console.log(`Saving confirmation data with registerForm=${registerForm}`, {
      disclosureId,
      bodyKeys: Object.keys(body),
    });

    // Get the session for authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Extract data from the request body with validation
    // Format data for database insertion with snake_case keys
    const confirmationData = {
      disclosure_id: disclosureId,
      written_disclosures: JSON.stringify(
        body.writtenDisclosures || {
          past: false,
          planned: false,
          notApplicable: false,
        }
      ),
      oral_disclosures: JSON.stringify(
        body.oralDisclosures || {
          past: false,
          planned: false,
          notApplicable: false,
        }
      ),
      future_work: body.futureWork || "",
      confirmation_declaration: Boolean(body.confirmationDeclaration),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log("Formatted confirmation data for database:", confirmationData);

    // Check if a confirmation record already exists
    const existingConfirmation = await db.execute(
      sql`SELECT confirmation_id FROM disclosure_confirmation 
          WHERE disclosure_id = ${disclosureId} LIMIT 1`
    );

    let result;
    if (existingConfirmation && existingConfirmation.length > 0) {
      console.log("Updating existing confirmation record");

      // Update existing record
      result = await db.execute(
        sql`UPDATE disclosure_confirmation 
            SET written_disclosures = ${confirmationData.written_disclosures},
                oral_disclosures = ${confirmationData.oral_disclosures},
                future_work = ${confirmationData.future_work},
                confirmation_declaration = ${confirmationData.confirmation_declaration},
                updated_at = ${confirmationData.updated_at}
            WHERE disclosure_id = ${disclosureId}
            RETURNING *`
      );
    } else {
      console.log("Creating new confirmation record");

      // Insert new record
      result = await db.execute(
        sql`INSERT INTO disclosure_confirmation (
              disclosure_id, written_disclosures, oral_disclosures, 
              future_work, confirmation_declaration, created_at, updated_at
            ) 
            VALUES (
              ${confirmationData.disclosure_id},
              ${confirmationData.written_disclosures},
              ${confirmationData.oral_disclosures},
              ${confirmationData.future_work},
              ${confirmationData.confirmation_declaration},
              ${confirmationData.created_at},
              ${confirmationData.updated_at}
            )
            RETURNING *`
      );
    }

    console.log("Database operation result:", result);

    // If registerForm is true, register the form in the form_submission_registry
    if (registerForm) {
      console.log("Registering form in form_submission_registry");
      try {
        // Get application ID from the disclosure
        const disclosureRecord = await db.execute(
          sql`SELECT application_id FROM ip_disclosure WHERE disclosure_id = ${disclosureId} LIMIT 1`
        );

        let applicationId = null;
        if (disclosureRecord && disclosureRecord.length > 0) {
          applicationId = disclosureRecord[0].application_id;
        }

        if (!applicationId) {
          console.log(
            "No application ID found for disclosure, registry will be updated later"
          );
        }

        // First check if a registry entry already exists
        const existingRegistry = await db.execute(
          sql`SELECT registry_id FROM form_submission_registry 
              WHERE source_type = 'ip_disclosure' 
              AND source_id = ${disclosureId}
              LIMIT 1`
        );

        if (existingRegistry && existingRegistry.length > 0) {
          console.log("Registry entry already exists, updating it");
          // Update existing registry entry
          if (applicationId) {
            await db.execute(
              sql`UPDATE form_submission_registry
                  SET updated_at = NOW(), ip_application_id = ${applicationId}
                  WHERE registry_id = ${existingRegistry[0].registry_id}`
            );
          } else {
            await db.execute(
              sql`UPDATE form_submission_registry
                  SET updated_at = NOW()
                  WHERE registry_id = ${existingRegistry[0].registry_id}`
            );
          }
        } else {
          console.log("Creating new registry entry");

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
                  'IP Disclosure Form',
                  NOW(),
                  NOW()
                )`
          );
        }
        console.log("Successfully registered/updated form in registry");
      } catch (registryError) {
        console.error("Error registering form in registry:", registryError);
        // Continue with the response, don't fail the entire operation
      }
    } else {
      console.log("Skipping form registry creation as registerForm=false");
    }

    return NextResponse.json({
      success: true,
      message: "Confirmation data saved successfully",
      data: result && result.length > 0 ? result[0] : null,
    });
  } catch (error) {
    console.error("Error saving confirmation data:", error);
    return NextResponse.json(
      { error: "Error saving confirmation data" },
      { status: 500 }
    );
  }
}
