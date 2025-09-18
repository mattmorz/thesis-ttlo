import { NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { sql } from "drizzle-orm";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { disclosureId, tradeSecretData } = body;

    if (!disclosureId) {
      return NextResponse.json(
        { error: "Disclosure ID is required" },
        { status: 400 }
      );
    }

    if (!tradeSecretData) {
      return NextResponse.json(
        { error: "Trade secret data is required" },
        { status: 400 }
      );
    }

    // Check if we should register this form in the registry
    const registerForm = tradeSecretData.registerForm === true;
    console.log(
      `Saving trade secret data for disclosure ID: ${disclosureId} (registerForm=${registerForm})`
    );

    // Get authentication session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Extract data from the request
    const description = tradeSecretData.description || "";
    const confidentialityMeasures =
      tradeSecretData.confidentialityMeasures || "";

    // Validate required fields
    if (!description || !confidentialityMeasures) {
      return NextResponse.json(
        { error: "Description and confidentiality measures are required" },
        { status: 400 }
      );
    }

    // First check if the disclosure exists and belongs to the current user
    const disclosureResult = await db.execute(
      sql`SELECT disclosure_id, client_id, application_id FROM ip_disclosure 
          WHERE disclosure_id = ${disclosureId} AND client_id = ${userId}`
    );

    if (disclosureResult.length === 0) {
      return NextResponse.json(
        {
          error:
            "Disclosure not found or you don't have permission to access it",
        },
        { status: 404 }
      );
    }

    // Get the application ID for potential registry creation
    const applicationId = disclosureResult[0].application_id;

    // Check if a trade secret application already exists for this disclosure
    const existingResult = await db.execute(
      sql`SELECT trade_secret_id FROM trade_secret_application WHERE disclosure_id = ${disclosureId}`
    );

    let tradeSecretId;
    let isNew = false;

    if (existingResult.length > 0) {
      // Update existing record
      tradeSecretId = existingResult[0].trade_secret_id;
      console.log("Updating existing trade secret record:", tradeSecretId);

      await db.execute(
        sql`UPDATE trade_secret_application SET 
          description = ${description},
          confidentiality_measures = ${confidentialityMeasures},
          updated_at = NOW()
          WHERE trade_secret_id = ${tradeSecretId}`
      );
    } else {
      // Create new record with generated UUID
      tradeSecretId = crypto.randomUUID();
      isNew = true;
      console.log("Creating new trade secret record with ID:", tradeSecretId);

      await db.execute(
        sql`INSERT INTO trade_secret_application (
          trade_secret_id,
          disclosure_id,
          description,
          confidentiality_measures,
          created_at,
          updated_at
        ) VALUES (
          ${tradeSecretId},
          ${disclosureId},
          ${description},
          ${confidentialityMeasures},
          NOW(),
          NOW()
        )`
      );
    }

    // If registerForm is true, create/update an entry in the form_submission_registry
    if (registerForm) {
      console.log(
        "Creating/updating form registry entry for trade secret application"
      );

      try {
        // Check if an entry already exists
        const existingRegistry = await db.execute(
          sql`SELECT registry_id FROM form_submission_registry 
              WHERE source_type = 'ip_disclosure' 
              AND source_id = ${disclosureId}
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
                  ${disclosureId},
                  ${applicationId},
                  'draft',
                  'IP Disclosure - Trade Secret',
                  NOW(),
                  NOW()
                )`
          );
        }
      } catch (registryError) {
        console.error("Error creating/updating registry entry:", registryError);
        // Don't fail the whole operation if registry creation fails
      }
    }

    return NextResponse.json({
      success: true,
      message: isNew
        ? "Trade secret created successfully"
        : "Trade secret updated successfully",
      tradeSecretId,
    });
  } catch (error) {
    console.error("Error saving trade secret data:", error);
    return NextResponse.json(
      {
        error: "Failed to save trade secret data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
