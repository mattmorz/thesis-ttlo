import { NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { sql } from "drizzle-orm";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { disclosureId, trademarkData, registerForm = true } = body;

    if (!disclosureId) {
      return NextResponse.json(
        { error: "Disclosure ID is required" },
        { status: 400 }
      );
    }

    if (!trademarkData) {
      return NextResponse.json(
        { error: "Trademark data is required" },
        { status: 400 }
      );
    }

    // Always require authentication before any DB operation
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // Check if trademark application already exists for this disclosure
    const existingResult = await db.execute(
      sql`SELECT trademark_id FROM trademark_application WHERE disclosure_id = ${disclosureId}`
    );

    let result;
    let trademarkId;

    // Prepare database fields from the trademark data
    const dbFields = {
      disclosure_id: disclosureId,
      trademark_name: trademarkData.trademarkName || "",
      description: trademarkData.description || "",
      translation: trademarkData.translation || "",
      nice_classifications: Array.isArray(trademarkData.niceClassifications)
        ? JSON.stringify(trademarkData.niceClassifications)
        : "[]",
      business_type: JSON.stringify(trademarkData.businessType || {}),
      legal_name: trademarkData.legalName || "",
      updated_at: new Date().toISOString(),
    };

    if (existingResult.length > 0) {
      // Update existing record
      trademarkId = existingResult[0].trademark_id;
      console.log("Updating existing trademark record:", trademarkId);

      result = await db.execute(
        sql`UPDATE trademark_application SET 
          trademark_name = ${dbFields.trademark_name},
          description = ${dbFields.description},
          translation = ${dbFields.translation},
          nice_classifications = ${dbFields.nice_classifications},
          business_type = ${dbFields.business_type},
          legal_name = ${dbFields.legal_name},
          updated_at = ${dbFields.updated_at}
          WHERE trademark_id = ${trademarkId}`
      );
    } else {
      // Create new record with generated UUID
      trademarkId = crypto.randomUUID();
      console.log("Creating new trademark record with ID:", trademarkId);

      result = await db.execute(
        sql`INSERT INTO trademark_application (
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
          ${dbFields.disclosure_id},
          ${dbFields.trademark_name},
          ${dbFields.description},
          ${dbFields.translation},
          ${dbFields.nice_classifications},
          ${dbFields.business_type},
          ${dbFields.legal_name},
          ${dbFields.updated_at},
          ${dbFields.updated_at}
        )`
      );
    }

    // If registerForm is true, register this form in the form_submission_registry
    if (registerForm && userId) {
      console.log(
        "Creating/updating form registry entry for trademark application"
      );

      try {
        // Get the application ID from the disclosure
        const applicationResult = await db.execute(
          sql`SELECT application_id FROM ip_disclosure WHERE disclosure_id = ${disclosureId} LIMIT 1`
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
                  ${disclosureId},
                  ${applicationId},
                  'draft',
                  'IP Disclosure - Trademark',
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
      message:
        existingResult.length > 0
          ? "Trademark updated successfully"
          : "Trademark created successfully",
      trademarkId,
    });
  } catch (error) {
    console.error("Error saving trademark data:", error);
    return NextResponse.json(
      {
        error: "Failed to save trademark data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
