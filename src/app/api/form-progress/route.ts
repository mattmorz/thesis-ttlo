import { NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { sql } from "drizzle-orm";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

/**
 * API endpoint to check form progress status from the form_submission_registry
 * This is a dedicated read-only endpoint that won't create any entries
 */
export async function GET(request: Request) {
  try {
    // Get the application ID from query parameters
    const url = new URL(request.url);
    const applicationId = url.searchParams.get("applicationId");

    if (!applicationId) {
      return NextResponse.json(
        { success: false, error: "Application ID is required" },
        { status: 400 }
      );
    }

    // Authenticate the user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log(`Checking form progress for application ID: ${applicationId}`);

    // Query the form_submission_registry table for all forms related to this application
    const formStatusResults = await db.execute(
      sql`SELECT 
            source_type, 
            status
          FROM form_submission_registry 
          WHERE ip_application_id = ${applicationId}
          AND user_id = ${session.user.id}`
    );

    console.log(
      `Found ${formStatusResults.length} form registrations for application ${applicationId}`
    );

    // Initialize form status object
    const formStatus = {
      clientProfile: false,
      ipDisclosure: false,
      substantialUse: false,
      deedAssignment: false,
      applicationTitle: false,
    };

    // Process the results
    formStatusResults.forEach((record: any) => {
      const sourceType = record.source_type?.toLowerCase();

      // Map source_type to our form status keys
      if (sourceType === "client_profile") {
        formStatus.clientProfile = true;
      } else if (sourceType === "ip_disclosure") {
        formStatus.ipDisclosure = true;
      } else if (sourceType === "substantial_use") {
        formStatus.substantialUse = true;
      } else if (sourceType === "deed_of_assignment") {
        formStatus.deedAssignment = true;
      }
    });

    console.log("Form progress status results:", formStatus);

    // Check application title status from ip_application
    const appResult = await db.execute(
      sql`SELECT title, ip_type
          FROM ip_application
          WHERE id = ${applicationId}
          AND user_id = ${session.user.id}
          LIMIT 1`
    );

    if (appResult.length > 0) {
      const appRow: any = appResult[0];
      const title =
        typeof appRow?.title === "string" ? appRow.title.trim() : "";
      const ipType = appRow?.ip_type ?? appRow?.ipType;

      formStatus.applicationTitle =
        Boolean(title) &&
        title.toLowerCase() !== "untitled application" &&
        Boolean(ipType);
    }

    // Return the form status results
    return NextResponse.json({
      success: true,
      data: formStatus,
    });
  } catch (error) {
    console.error("Error checking form progress:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error checking form progress",
      },
      { status: 500 }
    );
  }
}
