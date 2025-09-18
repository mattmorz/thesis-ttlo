import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/drizzle/db";
import {
  clientProfile,
  formSubmissionRegistry,
} from "@/drizzle/migrations/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";
/**
 * Dedicated endpoint for PDF generation that returns client profile data
 * in a clean format directly consumable by the PDF generator
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

    console.log(`🔍 Fetching client profile for application: ${applicationId}`);

    let profile = null;

    // FIRST METHOD: Try to find the profile directly by ipApplicationId
    profile = await db.query.clientProfile.findFirst({
      where: eq(clientProfile.ipApplicationId, applicationId),
    });

    // If not found directly, check via registry
    if (!profile) {
      console.log(
        `📋 No direct profile match for application ${applicationId}, checking via registry`
      );

      // Find the form registry entry for this application and client profile
      const formRegistry = await db.query.formSubmissionRegistry.findFirst({
        where: and(
          eq(formSubmissionRegistry.ipApplicationId, applicationId),
          eq(formSubmissionRegistry.sourceType, "client_profile")
        ),
      });

      if (formRegistry?.sourceId) {
        console.log(
          `📄 Found registry entry with sourceId: ${formRegistry.sourceId}`
        );
        profile = await db.query.clientProfile.findFirst({
          where: eq(clientProfile.clientId, formRegistry.sourceId),
        });
      }
    }

    if (!profile) {
      console.log(`❌ No profile found for application ${applicationId}`);
      return NextResponse.json(
        { error: "No client profile found for this application" },
        { status: 404 }
      );
    }

    console.log(
      `✅ Profile retrieved successfully for application ${applicationId}`
    );

    // Return the profile data directly (not wrapped in any objects)
    // This matches what the PDF generator expects
    return NextResponse.json(profile);
  } catch (error) {
    console.error("❌ Error fetching client profile for PDF:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch client profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
