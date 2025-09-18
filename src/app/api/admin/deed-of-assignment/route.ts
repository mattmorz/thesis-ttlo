import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/drizzle/db";
import { deedOfAssignment, ipApplication } from "@/drizzle/migrations/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * API endpoint for Deed of Assignment data retrieval
 * Returns deed of assignment data for document generation
 */
export async function GET(req: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      console.error("❌ No user session found");
      return NextResponse.json(
        { error: "Unauthorized: No user session" },
        { status: 401 }
      );
    }

    // Get the applicationId from query params
    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get("applicationId");

    if (!applicationId) {
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 }
      );
    }

    console.log(
      `🔍 Fetching deed of assignment for application: ${applicationId}`
    );

    // Check if there's a deed of assignment for this application
    const deed = await db.query.deedOfAssignment.findFirst({
      where: eq(deedOfAssignment.applicationId, applicationId),
    });

    // Get application details for the title
    const application = await db.query.ipApplication.findFirst({
      where: eq(ipApplication.id, applicationId),
    });

    if (!deed && !application) {
      console.log(
        `❌ No deed of assignment or application found for ID: ${applicationId}`
      );
      return NextResponse.json(
        { error: "No deed of assignment or application found with this ID" },
        { status: 404 }
      );
    }

    // Format data for deed of assignment document
    const deedOfAssignmentData = {
      documentType: "Deed of Assignment",
      applicationId: applicationId,
      applicationTitle: application?.title || "Untitled Application",
      // Check multiple possible field names for application type
      applicationType: application?.ipType || application?.ipType || "patent", // Default to patent if none found
      existingDeed: deed || null,
      generatedDate: new Date().toISOString(),
    };

    console.log(
      `✅ Deed of Assignment data prepared successfully for application ${applicationId}`
    );

    // Return the formatted data for the deed of assignment
    return NextResponse.json(deedOfAssignmentData);
  } catch (error) {
    console.error("❌ Error fetching data for deed of assignment:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch deed of assignment data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
