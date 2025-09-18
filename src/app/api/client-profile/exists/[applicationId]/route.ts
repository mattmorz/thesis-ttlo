import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/drizzle/db";
import { eq, and } from "drizzle-orm";
import { clientProfile, ipApplication } from "@/drizzle/migrations/schema";
import { formSubmissionRegistry } from "@/drizzle/migrations/schema";

export const dynamic = "force-dynamic";

/**
 * API endpoint to check if a client profile exists for a specific application
 * @param request - The NextRequest object
 * @param params - Route parameters, including applicationId
 * @returns JSON response indicating if a client profile exists for this application
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  try {
    console.log("📥 GET /api/client-profile/exists/[applicationId] - Start");
    console.log("📄 Request headers:", {
      referer: request.headers.get("referer"),
      userAgent: request.headers.get("user-agent"),
    });

    const session = await auth();
    if (!session?.user?.id) {
      console.error("❌ No user session found");
      return NextResponse.json(
        { error: "Unauthorized: No user session" },
        { status: 401 }
      );
    }

    const applicationId = params.applicationId;
    console.log(
      `🔍 Checking client profile for application ID: ${applicationId}, User ID: ${session.user.id}`
    );

    // VALIDATE APPLICATION ID: First check if the application exists in the database
    const applicationExists = await db.query.ipApplication.findFirst({
      where: eq(ipApplication.id, applicationId),
      columns: { id: true },
    });

    if (!applicationExists) {
      console.error(
        `❌ Application ID ${applicationId} does not exist in the database`
      );
      return NextResponse.json(
        {
          error: "Invalid application ID",
          detail: `Application ID ${applicationId} not found in the database`,
          exists: false,
          applicationValid: false,
        },
        { status: 404 }
      );
    }

    console.log(
      `✓ Verified application ID ${applicationId} exists in the database`
    );

    // FIRST METHOD: Check if there's a client profile directly linked to this IP application
    // This is the most direct and reliable method
    const directProfile = await db.query.clientProfile.findFirst({
      where: and(
        eq(clientProfile.ipApplicationId, applicationId),
        eq(clientProfile.userId, session.user.id)
      ),
    });

    if (directProfile) {
      console.log("👤 Direct profile check result:", {
        profileExists: true,
        profileId: directProfile.clientId,
        userId: directProfile.userId,
        profileStatus: directProfile.status,
      });

      const responseData = {
        exists: true,
        clientId: directProfile.clientId,
        userId: directProfile.userId,
        status: directProfile.status,
        // Look for registry entry as well for backward compatibility
        registryId: null as string | null,
        sourceId: directProfile.clientId,
        applicationValid: true,
      };

      // For backward compatibility, also check if there's a registry entry
      const registryEntry = await db.query.formSubmissionRegistry.findFirst({
        where: and(
          eq(formSubmissionRegistry.ipApplicationId, applicationId),
          eq(formSubmissionRegistry.sourceType, "client_profile"),
          eq(formSubmissionRegistry.sourceId, directProfile.clientId)
        ),
      });

      if (registryEntry) {
        responseData.registryId = registryEntry.registryId;
      }

      console.log(
        "✅ Returning profile exists response (direct):",
        responseData
      );
      return NextResponse.json(responseData);
    }

    // SECOND METHOD (backward compatibility): Check for registry-based mapping
    // First check if there's a form submission registry entry linking this application
    // to a client profile form submission
    const formRegistry = await db.query.formSubmissionRegistry.findFirst({
      where: and(
        eq(formSubmissionRegistry.ipApplicationId, applicationId),
        eq(formSubmissionRegistry.sourceType, "client_profile"),
        eq(formSubmissionRegistry.userId, session.user.id)
      ),
    });

    console.log("📋 Form registry check result:", {
      found: !!formRegistry,
      sourceId: formRegistry?.sourceId,
      registryId: formRegistry?.registryId,
      userId: formRegistry?.userId,
    });

    // If we found a registry entry for this application, check if the client profile exists
    if (formRegistry?.sourceId) {
      const profile = await db.query.clientProfile.findFirst({
        where: eq(clientProfile.clientId, formRegistry.sourceId),
      });

      console.log("👤 Registry-based profile check result:", {
        profileExists: !!profile,
        profileId: profile?.clientId,
        userId: profile?.userId,
        profileStatus: profile?.status,
      });

      const responseData = {
        exists: !!profile,
        registryId: formRegistry.registryId,
        sourceId: formRegistry.sourceId,
        userId: profile?.userId,
        status: profile?.status,
        applicationValid: true,
      };

      console.log(
        "✅ Returning profile exists response (registry):",
        responseData
      );
      return NextResponse.json(responseData);
    }

    // No profile found by either method
    console.log("📭 No client profile found for this application");
    const responseData = { exists: false, applicationValid: true };
    console.log("✅ Returning profile does not exist response:", responseData);
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("❌ Error checking client profile existence:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to check client profile existence",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
