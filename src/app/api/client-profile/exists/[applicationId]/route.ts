import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/drizzle/db";
import { clientProfile as liveClientProfile } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { ipApplication, formSubmissionRegistry } from "@/drizzle/migrations/schema";

export const dynamic = "force-dynamic";

const CLIENT_PROFILE_FIELDS = {
  clientId: liveClientProfile.clientId,
  userId: liveClientProfile.userId,
  firstName: liveClientProfile.firstName,
  middleName: liveClientProfile.middleName,
  lastName: liveClientProfile.lastName,
  contactNumber: liveClientProfile.contactNumber,
  email: liveClientProfile.email,
  mailingAddress: liveClientProfile.mailingAddress,
  companyName: liveClientProfile.companyName,
  companyEmail: liveClientProfile.companyEmail,
  occupation: liveClientProfile.occupation,
  createdAt: liveClientProfile.createdAt,
  updatedAt: liveClientProfile.updatedAt,
  age: liveClientProfile.age,
  companyStreet: liveClientProfile.companyStreet,
  companyBarangay: liveClientProfile.companyBarangay,
  companyCityMunicipality: liveClientProfile.companyCityMunicipality,
  companyProvince: liveClientProfile.companyProvince,
  degree: liveClientProfile.degree,
  profession: liveClientProfile.profession,
  status: liveClientProfile.status,
  gender: liveClientProfile.gender,
  citizenship: liveClientProfile.citizenship,
  highestDegree: liveClientProfile.highestDegree,
  familiarWithIpRights: liveClientProfile.familiarWithIpRights,
  ipExperience: liveClientProfile.ipExperience,
} as const;

async function safeFindFirst<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    console.error(`❌ ${label} failed:`, error);
    return null;
  }
}

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
    if (!applicationId || typeof applicationId !== "string") {
      return NextResponse.json(
        {
          error: "Invalid application ID",
          detail: "applicationId is required",
          exists: false,
          applicationValid: false,
        },
        { status: 400 }
      );
    }
    console.log(
      `🔍 Checking client profile for application ID: ${applicationId}, User ID: ${session.user.id}`
    );

    // VALIDATE APPLICATION ID: First check if the application exists in the database
    const applicationExists = await safeFindFirst(
      "Application existence check",
      () =>
        db.query.ipApplication.findFirst({
          where: eq(ipApplication.id, applicationId),
          columns: { id: true },
        })
    );

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

    // Registry-based lookup is the source of truth for application linking.
    const formRegistry = await safeFindFirst("Registry lookup", () =>
      db.query.formSubmissionRegistry.findFirst({
        where: and(
          eq(formSubmissionRegistry.ipApplicationId, applicationId),
          eq(formSubmissionRegistry.sourceType, "client_profile"),
          eq(formSubmissionRegistry.userId, session.user.id)
        ),
      })
    );

    console.log("📋 Form registry check result:", {
      found: !!formRegistry,
      sourceId: formRegistry?.sourceId,
      registryId: formRegistry?.registryId,
      userId: formRegistry?.userId,
    });

    // If we found a registry entry for this application, check if the client profile exists
    if (formRegistry?.sourceId) {
      const profile = await safeFindFirst("Registry profile lookup", () =>
        db
          .select(CLIENT_PROFILE_FIELDS)
          .from(liveClientProfile)
          .where(eq(liveClientProfile.clientId, formRegistry.sourceId))
          .limit(1)
          .then((rows) => rows[0] ?? null)
      );

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

    // No profile found
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
