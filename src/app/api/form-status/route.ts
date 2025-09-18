import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/drizzle/db";
import { formSubmissionRegistry } from "@/drizzle/migrations/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * API route to get form submission status for an application
 *
 * Checks the form_submission_registry table for records with matching ip_application_id
 * Returns whether each form type (client_profile, ip_disclosure, etc.) has been submitted
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const applicationId = url.searchParams.get("applicationId");

    if (!applicationId) {
      return NextResponse.json(
        { success: false, error: "Application ID is required" },
        { status: 400 }
      );
    }

    console.log(
      `📊 FORM STATUS CHECK: Checking status for application ${applicationId}`
    );

    // Query the form_submission_registry table for records with this application ID
    const registryRecords = await db.query.formSubmissionRegistry.findMany({
      where: and(
        eq(formSubmissionRegistry.ipApplicationId, applicationId),
        eq(formSubmissionRegistry.status, "submitted")
      ),
    });

    console.log(
      `📋 FORM STATUS: Found ${registryRecords.length} registry records for application: ${applicationId}`
    );

    // Print detailed info about each record for debugging
    registryRecords.forEach((record, index) => {
      console.log(`📑 RECORD ${index + 1}:`, {
        sourceType: record.sourceType,
        sourceId: record.sourceId,
        status: record.status,
        createdAt: record.createdAt,
      });
    });

    // Initialize the response with all form types set to false
    const formStatus = {
      clientProfile: false,
      ipDisclosure: false,
      substantialUse: false,
      deedAssignment: false,
    };

    // Map the source_type values from the database records to our form status object
    registryRecords.forEach((record) => {
      // Map the sourceType enum values to our keys
      // The enum values in the DB schema are: 'client_profile', 'ip_disclosure', 'substantial_use', 'deed_of_assignment'
      if (record.sourceType === "client_profile") {
        formStatus.clientProfile = true;
        console.log("✅ Setting clientProfile to TRUE");
      } else if (record.sourceType === "ip_disclosure") {
        formStatus.ipDisclosure = true;
        console.log("✅ Setting ipDisclosure to TRUE");
      } else if (record.sourceType === "substantial_use") {
        formStatus.substantialUse = true;
        console.log("✅ Setting substantialUse to TRUE");
      } else if (record.sourceType === "deed_of_assignment") {
        formStatus.deedAssignment = true;
        console.log("✅ Setting deedAssignment to TRUE");
      } else {
        console.log(`❓ Unknown source type: ${record.sourceType}`);
      }
    });

    console.log("📈 Final form status response:", formStatus);
    console.log(
      "📊 Completed form count:",
      Object.values(formStatus).filter(Boolean).length
    );

    return NextResponse.json({
      success: true,
      data: formStatus,
      debug: {
        totalRecords: registryRecords.length,
        recordIds: registryRecords.map((r) => r.sourceId),
        sourceTypes: registryRecords.map((r) => r.sourceType),
        applicationId,
        timestamp: new Date().toISOString(),
        completedCount: Object.values(formStatus).filter(Boolean).length,
      },
    });
  } catch (error) {
    console.error("Error fetching form status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch form status" },
      { status: 500 }
    );
  }
}
