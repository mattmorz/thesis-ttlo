import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/drizzle/db";
import { clientProfile as liveClientProfile } from "@/drizzle/schema";
import {
  formSubmissionRegistry,
  ipApplication,
} from "@/drizzle/migrations/schema";
import { eq, and } from "drizzle-orm";
import { checkPermission, bypassPermissions } from "@/lib/auth/permissions";

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
  isAffiliated: liveClientProfile.isAffiliated,
  institutionName: liveClientProfile.institutionName,
  department: liveClientProfile.department,
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

async function getClientProfileById(clientId: string) {
  const rows = await db
    .select(CLIENT_PROFILE_FIELDS)
    .from(liveClientProfile)
    .where(eq(liveClientProfile.clientId, clientId))
    .limit(1);

  return rows[0] ?? null;
}

async function getClientProfileByUserId(userId: string) {
  const rows = await db
    .select(CLIENT_PROFILE_FIELDS)
    .from(liveClientProfile)
    .where(eq(liveClientProfile.userId, userId))
    .limit(1);

  return rows[0] ?? null;
}

const HIGHEST_DEGREE_DB_VALUES = new Set([
  "bachelor",
  "master",
  "doctorate",
  "other",
]);

const HIGHEST_DEGREE_LEGACY_VALUES = new Set([
  "associate",
  "vocational",
  "highschool",
]);

function normalizeHighestDegree(
  highestDegree: { value?: unknown; otherValue?: unknown } | undefined,
  subType?: unknown,
) {
  if (!highestDegree || typeof highestDegree !== "object") {
    return { value: "bachelor", otherValue: null };
  }

  const rawValue =
    typeof highestDegree.value === "string"
      ? highestDegree.value.toLowerCase()
      : "";

  if (rawValue === "other") {
    return {
      value: "other",
      otherValue:
        typeof highestDegree.otherValue === "string"
          ? highestDegree.otherValue
          : "",
    };
  }

  if (HIGHEST_DEGREE_LEGACY_VALUES.has(rawValue)) {
    return {
      value: "other",
      otherValue:
        typeof subType === "string" && subType.trim() ? subType : rawValue,
    };
  }

  if (HIGHEST_DEGREE_DB_VALUES.has(rawValue)) {
    return { value: rawValue, otherValue: null };
  }

  return { value: "bachelor", otherValue: null };
}

function denormalizeHighestDegree(
  highestDegree: { value?: unknown; otherValue?: unknown } | null | undefined,
) {
  if (!highestDegree || typeof highestDegree !== "object") return highestDegree;
  if (highestDegree.value !== "other") return highestDegree;

  const otherValue =
    typeof highestDegree.otherValue === "string"
      ? highestDegree.otherValue.toLowerCase()
      : "";

  if (HIGHEST_DEGREE_LEGACY_VALUES.has(otherValue)) {
    return { value: otherValue, otherValue: null };
  }

  return highestDegree;
}

function normalizeHasCompany(personalInfo: any) {
  const raw = personalInfo?.hasCompany;
  if (typeof raw === "boolean") return raw;
  if (raw === "false") return false;
  if (raw === "true") return true;

  const hasCollegeData =
    (typeof personalInfo?.collegeName === "string" &&
      personalInfo.collegeName.trim() !== "") ||
    (typeof personalInfo?.departmentName === "string" &&
      personalInfo.departmentName.trim() !== "");

  const hasCompanyData =
    (typeof personalInfo?.companyName === "string" &&
      personalInfo.companyName.trim() !== "") ||
    (typeof personalInfo?.companyEmail === "string" &&
      personalInfo.companyEmail.trim() !== "") ||
    (typeof personalInfo?.companyStreet === "string" &&
      personalInfo.companyStreet.trim() !== "") ||
    (typeof personalInfo?.companyBarangay === "string" &&
      personalInfo.companyBarangay.trim() !== "") ||
    (typeof personalInfo?.companyCityMunicipality === "string" &&
      personalInfo.companyCityMunicipality.trim() !== "") ||
    (typeof personalInfo?.companyProvince === "string" &&
      personalInfo.companyProvince.trim() !== "");

  if (hasCollegeData) return false;
  if (hasCompanyData) return true;
  return true;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.error("❌ No user session found");
      return NextResponse.json(
        { error: "Unauthorized: No user session" },
        { status: 401 },
      );
    }

    // Development bypass for admin
    if (bypassPermissions(session)) {
      console.log("[POST] Admin bypass active in development mode");
    } else {
      // Check permissions
      const canSubmit = checkPermission(session, "canSubmit");
      if (!canSubmit) {
        console.log("[POST] Permission denied: User cannot submit form");
        return NextResponse.json(
          { error: "Permission denied: Cannot submit form" },
          { status: 403 },
        );
      }
    }

    // Initialize registry variables that will be used throughout the function
    let registryId = null;
    let registrySuccess = false;
    let registryMessage = "No registry operation attempted";

    const data = await req.json();
    console.log("📦 Received form data:", JSON.stringify(data, null, 2));

    // Add specific logging for hasCompany and college fields
    console.log("🔍 AFFILIATION DATA CHECK:", {
      hasCompany: data.personalInfo?.hasCompany,
      hasCompanyType: typeof data.personalInfo?.hasCompany,
      collegeFields: {
        collegeName: data.personalInfo?.collegeName,
        departmentName: data.personalInfo?.departmentName,
      },
    });

    // Extract data from form sections
    const {
      personalInfo,
      educationalBackground,
      backgroundIP,
      status = "draft",
      applicationId, // Add application ID for form registry
      registerForm = false, // Default to false if not provided
    } = data;
    console.log("🔍 Processing form sections:", {
      personalInfo: !!personalInfo,
      educationalBackground: !!educationalBackground,
      backgroundIP: !!backgroundIP,
      status: status,
      applicationId: applicationId,
      registerForm: registerForm,
    });

    // Format data for database insertion
    const formattedData = {
      userId: session.user.id,
      // Personal Information
      firstName: personalInfo?.firstName?.trim(),
      lastName: personalInfo?.lastName?.trim(),
      middleName: personalInfo?.middleName?.trim() || null,
      gender: personalInfo?.gender || { value: "male" },
      age: personalInfo?.age ? Number(personalInfo.age) : null,
      citizenship: personalInfo?.citizenship || {
        value: "filipino",
        otherValue: null,
      },

      // Contact Information
      email: personalInfo?.email?.trim(),
      contactNumber: personalInfo?.contactNumber?.trim(),
      mailingAddress: personalInfo?.mailingAddress?.trim(),

      // Company Information - only save if hasCompany is true
      companyName: personalInfo?.companyName?.trim() || null,
      companyStreet: personalInfo?.companyStreet?.trim() || null,
      companyBarangay: personalInfo?.companyBarangay?.trim() || null,
      companyCityMunicipality:
        personalInfo?.companyCityMunicipality?.trim() || null,
      companyProvince: personalInfo?.companyProvince?.trim() || null,
      companyEmail: personalInfo?.companyEmail?.trim() || null,

      occupation: personalInfo?.occupation?.trim() || null,

     // Affiliation fields
isAffiliated:
  typeof personalInfo?.isCSUAffiliated === "boolean"
    ? personalInfo.isCSUAffiliated
    : false,

institutionName:
  personalInfo?.institutionName?.trim() ||
  personalInfo?.collegeName?.trim() ||
  personalInfo?.institution?.trim() ||
  null,

department:
  personalInfo?.department?.trim() ||
  personalInfo?.departmentName?.trim() ||
  null,

      // Educational Background
      highestDegree: educationalBackground?.highestDegree || {
        value: "bachelor",
        otherValue: null,
      },
      degree: educationalBackground?.degree?.trim(),
      profession: educationalBackground?.profession?.trim(),

      // Background IP
      familiarWithIpRights: backgroundIP?.familiarWithIPRights || {
        value: "no",
      },
      ipExperience: backgroundIP?.ipExperience || {
        hasExperience: "no",
        types: {
          patent: false,
          copyright: false,
          trademark: false,
          industrialDesign: false,
          utilityModel: false,
          other: false,
        },
        otherSpecify: "",
      },

      // Status and Metadata
      status: status,
      updatedAt: new Date().toISOString(),
    };

    // Normalize highest degree to align with DB constraints
    formattedData.highestDegree = normalizeHighestDegree(
      educationalBackground?.highestDegree,
      educationalBackground?.subType,
    );

    // Right after formattedData is created, update the validation for citizenship
    // Fix citizenship format to ensure it meets database constraints
    if (typeof formattedData.citizenship === "object") {
      // Ensure we only have one of "filipino" or "other" with proper otherValue
      if (formattedData.citizenship.value === "filipino") {
        // For Filipino citizenship, ensure otherValue is null
        formattedData.citizenship.otherValue = null;
      } else if (formattedData.citizenship.value === "other") {
        // For other citizenship, ensure otherValue exists (at least empty string)
        if (!formattedData.citizenship.otherValue) {
          formattedData.citizenship.otherValue = "";
        }
      } else {
        // For invalid values, default to Filipino
        formattedData.citizenship = {
          value: "filipino",
          otherValue: null,
        };
      }
    }

    console.log(
      "📝 Formatted data for database:",
      JSON.stringify(formattedData, null, 2),
    );

    let result;
    let existingProfileId = null;

    // If an applicationId is provided, check the registry first.
    // The live client_profile table may not have a direct ip_application_id column,
    // so the registry entry is the source of truth for application linking.
    if (applicationId) {
      console.log(`🔍 Checking registry for application: ${applicationId}`);
      const registryEntry = await db.query.formSubmissionRegistry.findFirst({
        where: and(
          eq(formSubmissionRegistry.ipApplicationId, applicationId),
          eq(formSubmissionRegistry.sourceType, "client_profile"),
        ),
      });

      if (registryEntry?.sourceId) {
        console.log(
          `✓ Found registry entry for application ${applicationId}, sourceId=${registryEntry.sourceId}`,
        );
        // If there's a registry entry, check if the profile exists
        const profileForThisApp = await getClientProfileById(
          registryEntry.sourceId,
        );

        if (profileForThisApp) {
          existingProfileId = profileForThisApp.clientId;
          console.log(
            `✓ Found existing profile for this application: ${existingProfileId}`,
          );
        }
      }
    } else {
      console.log(
        "ℹ️ No applicationId provided; creating an unlinked client profile",
      );
    }

    // If we have an existing profile for this application, update it
    if (existingProfileId) {
      console.log(
        `🔄 Updating existing profile for application: ${existingProfileId}`,
      );

      // If only updating status, just update the status field
      if (Object.keys(data).length === 1 && data.status) {
        // Check if user has permission to approve
        if (
          (data.status === "approved" || data.status === "rejected") &&
          !bypassPermissions(session) &&
          !checkPermission(session, "canApprove")
        ) {
          return NextResponse.json(
            { error: "Permission denied: Cannot approve/reject forms" },
            { status: 403 },
          );
        }

        result = await db
          .update(liveClientProfile)
          .set({
            status: data.status,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(liveClientProfile.clientId, existingProfileId))
          .returning({ clientId: liveClientProfile.clientId });

        console.log("✅ Profile status updated successfully");
      } else {
        // Full update for this application's profile
        result = await db
          .update(liveClientProfile)
          .set(formattedData)
          .where(eq(liveClientProfile.clientId, existingProfileId))
          .returning({ clientId: liveClientProfile.clientId });
        console.log("✅ Profile updated successfully for this application");
      }
    } else {
      // No existing profile for this application, create a new one
      console.log("🆕 Creating new profile");
      result = await db
        .insert(liveClientProfile)
        .values({
          ...formattedData,
          createdAt: new Date().toISOString(),
        })
        .returning({ clientId: liveClientProfile.clientId });
      console.log("✅ New profile created successfully");
    }

    const savedProfile = await getClientProfileById(result[0].clientId);
    if (!savedProfile) {
      return NextResponse.json(
        { error: "Failed to load saved client profile" },
        { status: 500 },
      );
    }

    // If an application ID was provided, register this profile in the form submission registry
    if (applicationId && result[0].clientId) {
      console.log(
        `🔗 Registering client profile for application ${applicationId} with registerForm=${registerForm}`,
      );

      // First, try to handle registry within the same transaction
      try {
        // Check if a registry entry already exists for this application and source type
        const existingRegistry =
          await db.query.formSubmissionRegistry.findFirst({
            where: and(
              eq(formSubmissionRegistry.ipApplicationId, applicationId),
              eq(formSubmissionRegistry.sourceType, "client_profile"),
              eq(formSubmissionRegistry.userId, session.user.id),
            ),
          });

        if (!existingRegistry) {
          // Create a new registry entry
          const registryData = {
            userId: session.user.id,
            sourceType: "client_profile" as const,
            sourceId: result[0].clientId,
            ipApplicationId: applicationId,
            status: status, // Use the same status as the profile
            title: `Client Profile - ${formattedData.firstName} ${formattedData.lastName}`,
            description: "Client Profile form submission",
            inventorsCreators: JSON.stringify([
              {
                name: `${formattedData.firstName} ${formattedData.lastName}`,
                role: "Applicant",
              },
            ]),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            submittedAt:
              status === "submitted" ? new Date().toISOString() : null,
          };

          console.log("📝 Creating new registry entry with data:", {
            userId: registryData.userId,
            sourceType: registryData.sourceType,
            sourceId: registryData.sourceId,
            ipApplicationId: registryData.ipApplicationId,
            status: registryData.status,
          });

          const registryResult = await db
            .insert(formSubmissionRegistry)
            .values(registryData)
            .returning();

          if (registryResult[0]) {
            registryId = registryResult[0].registryId;
            registrySuccess = true;
            registryMessage = "Form registry created successfully";
            console.log(
              "✅ Created form submission registry entry:",
              registryId,
            );
          }
        } else {
          // Always update the registry entry to ensure it has the correct source ID
          const updateData = {
            sourceId: result[0].clientId,
            status: status, // Update registry status to match profile status
            title: `Client Profile - ${formattedData.firstName} ${formattedData.lastName}`,
            description: "Client Profile form submission",
            inventorsCreators: JSON.stringify([
              {
                name: `${formattedData.firstName} ${formattedData.lastName}`,
                role: "Applicant",
              },
            ]),
            updatedAt: new Date().toISOString(),
            submittedAt:
              status === "submitted" ? new Date().toISOString() : null,
          };

          console.log("🔄 Updating registry entry:", {
            registryId: existingRegistry.registryId,
            oldSourceId: existingRegistry.sourceId,
            newSourceId: result[0].clientId,
            status: status,
          });

          const registryResult = await db
            .update(formSubmissionRegistry)
            .set(updateData)
            .where(
              eq(
                formSubmissionRegistry.registryId,
                existingRegistry.registryId,
              ),
            )
            .returning();

          if (registryResult[0]) {
            registryId = registryResult[0].registryId;
            registrySuccess = true;
            registryMessage = "Form registry updated successfully";
            console.log(
              "✅ Updated form submission registry entry:",
              registryId,
            );
          }
        }
      } catch (registryError) {
        console.error("⚠️ Error updating form registry:", registryError);
        registrySuccess = false;
        registryMessage = `Registry error: ${
          registryError instanceof Error
            ? registryError.message
            : "Unknown error"
        }`;

        // Try the fallback direct API call if the main approach fails
        try {
          console.log("Attempting direct form registry API call as fallback");

          // Using the internal API endpoint directly
          const directRegistryResponse = await fetch(
            new URL("/api/form-registry", req.url).toString(),
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                sourceType: "client_profile",
                sourceId: result[0].clientId,
                ipApplicationId: applicationId,
                status: status,
                title: `Client Profile - ${formattedData.firstName} ${formattedData.lastName}`,
                description: "Client Profile form submission",
                inventorsCreators: [
                  {
                    name: `${formattedData.firstName} ${formattedData.lastName}`,
                    role: "Applicant",
                  },
                ],
              }),
            },
          );

          if (directRegistryResponse.ok) {
            const directRegistryResult = await directRegistryResponse.json();
            if (directRegistryResult?.data?.registryId) {
              console.log(
                "Direct registry API call successful:",
                directRegistryResult,
              );
              registryId = directRegistryResult.data.registryId;
              registrySuccess = true;
              registryMessage =
                "Form registry created successfully via direct API";
            }
          } else {
            console.error(
              "Direct registry API call failed with status:",
              directRegistryResponse.status,
            );
          }
        } catch (directRegError) {
          console.error("Error with direct registry API call:", directRegError);
          // Continue with submission regardless
          registryMessage = `Registry fallback error: ${
            directRegError instanceof Error
              ? directRegError.message
              : "Unknown error"
          }`;
        }
      }
    } else if (applicationId) {
      console.log(`⚠️ Cannot register form - missing client profile ID`);
    }

    // Transform the result to camelCase to match frontend expectations
    const compatibilityProfile = {
      hasCompany: normalizeHasCompany({
        ...savedProfile,
        collegeName: savedProfile?.institutionName?.trim() || null,
        departmentName: savedProfile?.department?.trim() || null,
      }),
      collegeName: savedProfile?.institutionName?.trim() || null,
      departmentName: savedProfile?.department?.trim() || null,
      isAffiliated:
        typeof savedProfile?.isAffiliated === "boolean"
          ? savedProfile.isAffiliated
          : Boolean(
              savedProfile?.institutionName?.trim() ||
              savedProfile?.department?.trim(),
            ),
    };

    const camelCaseResult = {
      ...savedProfile,
      ...compatibilityProfile,
      // Add registry information to the response
      registryId: registryId || null,
    };

    // Log the final stored values for debugging
    console.log("📊 STORED AFFILIATION VALUES:", {
      hasCompany: camelCaseResult.hasCompany,
      collegeFields: {
        collegeName: camelCaseResult.collegeName,
        departmentName: camelCaseResult.departmentName,
      },
      companyFields: {
        companyName: camelCaseResult.companyName,
        companyEmail: camelCaseResult.companyEmail,
      },
    });

    console.log(
      "🎉 Operation completed. Result:",
      JSON.stringify(camelCaseResult, null, 2),
    );

    // Return success with registry information
    return NextResponse.json({
      success: true,
      data: camelCaseResult,
      registry: {
        success: registrySuccess,
        registryId: registryId,
        message: registryMessage,
      },
    });
  } catch (error) {
    console.error("❌ Error in POST /api/client-profile:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to save client profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  try {
    console.log("📥 GET /api/client-profile - Start");
    const session = await auth();
    if (!session?.user?.id) {
      console.error("❌ No user session found");
      return NextResponse.json(
        { error: "Unauthorized: No user session" },
        { status: 401 },
      );
    }

    // Check if an applicationId was provided in the URL parameters
    const url = new URL(req.url);
    const applicationId = url.searchParams.get("applicationId");
    // Check if this is a form load (not a submission) to avoid registry creation
    const isFormLoad = url.searchParams.get("formLoad") === "true";
    // Initialize registryId variable for use throughout the function
    let registryId: string | null = null;

    console.log("🔍 Request parameters:", {
      applicationId: applicationId || "not provided",
      userId: session.user.id,
      isFormLoad: isFormLoad,
    });

    // If an applicationId is provided, fetch the profile associated with this application
    if (applicationId) {
      // Find the form registry entry for this application and client profile
      const formRegistry = await db.query.formSubmissionRegistry.findFirst({
        where: and(
          eq(formSubmissionRegistry.ipApplicationId, applicationId),
          eq(formSubmissionRegistry.sourceType, "client_profile"),
          eq(formSubmissionRegistry.userId, session.user.id),
        ),
      });

      if (!formRegistry || !formRegistry.sourceId) {
        console.log("❌ No profile registry found for this application");

        // If this is just loading the form (not submitting), don't create an error
        // Just return null data so the form can be filled out fresh
        if (isFormLoad) {
          console.log(
            "📝 Form load without existing profile - returning empty data",
          );
          return NextResponse.json({
            success: true,
            exists: false,
            message: "No client profile found for this application - new form",
          });
        }

        return NextResponse.json({
          success: false,
          exists: false,
          message: "No client profile found for this application",
        });
      }

      // Now fetch the client profile using the sourceId
      const profile = await getClientProfileById(formRegistry.sourceId);

      if (!profile) {
        console.log(
          "❌ Profile not found for registry",
          formRegistry.registryId,
          "sourceId:",
          formRegistry.sourceId,
        );

        // Add additional debug info to help diagnose the problem
        console.log("🔍 Registry entry details:", {
          registryId: formRegistry.registryId,
          sourceId: formRegistry.sourceId,
          applicationId: formRegistry.ipApplicationId,
          userId: formRegistry.userId,
          createdAt: formRegistry.createdAt,
        });

        return NextResponse.json({
          success: false,
          exists: false,
          message: "Profile registered but not found",
        });
      }

      // Format and return the profile
      const camelCaseProfile = {
        clientId: profile.clientId,
        userId: profile.userId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        middleName: profile.middleName,
        gender: profile.gender,
        age: profile.age,
        citizenship: profile.citizenship,
        email: profile.email,
        contactNumber: profile.contactNumber,
        mailingAddress: profile.mailingAddress,
        companyName: profile.companyName,
        companyStreet: profile.companyStreet,
        companyBarangay: profile.companyBarangay,
        companyCityMunicipality: profile.companyCityMunicipality,
        companyProvince: profile.companyProvince,
        companyEmail: profile.companyEmail,
        occupation: profile.occupation,
        highestDegree: denormalizeHighestDegree(profile.highestDegree),
        degree: profile.degree,
        profession: profile.profession,
        publishedResearch: profile.publishedResearch,
        developedMaterials: profile.developedMaterials,
        familiarWithIpRights: profile.familiarWithIpRights,
        ipExperience: profile.ipExperience,
        status: profile.status,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        registryId: formRegistry.registryId,
        formLoad: isFormLoad,
      };

      console.log("✅ Profile found for application:", applicationId);
      return NextResponse.json({
        success: true,
        exists: true,
        data: camelCaseProfile,
        formLoad: isFormLoad,
      });
    }

    // If no applicationId is provided, fall back to the default behavior
    // of fetching the profile by user ID
    console.log("🔍 Fetching profile for user:", session.user.id);
    const profile = await getClientProfileByUserId(session.user.id);

    if (!profile) {
      console.log("❌ No profile found for user");
      return NextResponse.json({
        success: false,
        exists: false,
        message: "Profile not found",
      });
    }

    // Transform the data to camelCase to match frontend expectations
    const camelCaseProfile = {
      clientId: profile.clientId,
      userId: profile.userId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      middleName: profile.middleName,
      gender: profile.gender,
      age: profile.age,
      citizenship: profile.citizenship,
      email: profile.email,
      contactNumber: profile.contactNumber,
      mailingAddress: profile.mailingAddress,
      companyName: profile.companyName,
      companyStreet: profile.companyStreet,
      companyBarangay: profile.companyBarangay,
      companyCityMunicipality: profile.companyCityMunicipality,
      companyProvince: profile.companyProvince,
      companyEmail: profile.companyEmail,
      occupation: profile.occupation,
      highestDegree: denormalizeHighestDegree(profile.highestDegree),
      degree: profile.degree,
      profession: profile.profession,
      publishedResearch: profile.publishedResearch,
      developedMaterials: profile.developedMaterials,
      familiarWithIpRights: profile.familiarWithIpRights,
      ipExperience: profile.ipExperience,
      status: profile.status,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };

    console.log("✅ Profile found by user ID");
    return NextResponse.json({
      success: true,
      exists: true,
      data: camelCaseProfile,
    });
  } catch (error) {
    console.error("❌ Error in GET /api/client-profile:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to fetch client profile",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

/**
 * PUT handler specifically for updating existing client profiles
 * This avoids the common pattern of using POST for both create and update
 */
export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.error("❌ No user session found");
      return NextResponse.json(
        { error: "Unauthorized: No user session" },
        { status: 401 },
      );
    }

    // Initialize registry variables
    let registryId = null;
    let registrySuccess = false;
    let registryMessage = "No registry operations performed";

    // Development bypass for admin
    if (bypassPermissions(session)) {
      console.log("[PUT] Admin bypass active in development mode");
    } else {
      // Check permissions
      const canSubmit = checkPermission(session, "canSubmit");
      if (!canSubmit) {
        console.log("[PUT] Permission denied: User cannot submit form");
        return NextResponse.json(
          { error: "Permission denied: Cannot submit form" },
          { status: 403 },
        );
      }
    }

    const data = await req.json();
    console.log("📦 Received form update data:", JSON.stringify(data, null, 2));

    // Add specific logging for hasCompany and college fields
    console.log("🔍 UPDATE AFFILIATION DATA CHECK:", {
      hasCompany: data.personalInfo?.hasCompany,
      hasCompanyType: typeof data.personalInfo?.hasCompany,
      collegeFields: {
        collegeName: data.personalInfo?.collegeName,
        departmentName: data.personalInfo?.departmentName,
      },
    });

    // Extract data from form sections
    const {
      personalInfo,
      educationalBackground,
      backgroundIP,
      status = "draft",
      applicationId, // Add application ID for form registry
      registerForm = false, // Default to not registering on update unless specified
    } = data;

    if (!applicationId) {
      return NextResponse.json(
        { error: "Bad request: applicationId is required for updates" },
        { status: 400 },
      );
    }

    console.log("🔍 Processing form update sections:", {
      personalInfo: !!personalInfo,
      educationalBackground: !!educationalBackground,
      backgroundIP: !!backgroundIP,
      status: status,
      applicationId: applicationId,
      registerForm: registerForm,
    });

    // Format data for database insertion
    const formattedData: any = {
      userId: session.user.id,
      status: status,
      updatedAt: new Date().toISOString(),
    };

    // Only include fields that are provided in the request
    if (personalInfo) {
      // Personal Information
      formattedData.firstName = personalInfo.firstName?.trim();
      formattedData.lastName = personalInfo.lastName?.trim();
      formattedData.middleName = personalInfo.middleName?.trim() || null;

      // Ensure gender is in the correct format
      if (personalInfo.gender) {
        // Validate gender value is one of the allowed values
        const validGenderValues = ["male", "female", "prefer_not_to_say"];
        const genderValue = personalInfo.gender.value || "male"; // Default to male if not provided

        formattedData.gender = {
          value: validGenderValues.includes(genderValue) ? genderValue : "male",
        };
      } else {
        // If no gender is provided, set a default valid value
        formattedData.gender = { value: "male" };
      }

      formattedData.age = personalInfo.age ? Number(personalInfo.age) : null;

      // Ensure citizenship is properly formatted
      if (personalInfo.citizenship) {
        formattedData.citizenship = {
          value:
            personalInfo.citizenship.value === "other" ? "other" : "filipino",
          otherValue:
            personalInfo.citizenship.value === "other"
              ? personalInfo.citizenship.otherValue || ""
              : null,
        };
      } else {
        formattedData.citizenship = { value: "filipino", otherValue: null };
      }

      // Contact Information
      formattedData.email = personalInfo.email?.trim();
      formattedData.contactNumber = personalInfo.contactNumber?.trim();
      formattedData.mailingAddress = personalInfo.mailingAddress?.trim();

      // Company Information - only save if hasCompany is true
      formattedData.companyName = personalInfo.companyName?.trim() || null;
      formattedData.companyStreet = personalInfo.companyStreet?.trim() || null;
      formattedData.companyBarangay =
        personalInfo.companyBarangay?.trim() || null;
      formattedData.companyCityMunicipality =
        personalInfo.companyCityMunicipality?.trim() || null;
      formattedData.companyProvince =
        personalInfo.companyProvince?.trim() || null;
      formattedData.companyEmail = personalInfo.companyEmail?.trim() || null;

      formattedData.occupation = personalInfo.occupation?.trim() || null;
      formattedData.isAffiliated =
        typeof personalInfo.isAffiliated === "boolean"
          ? personalInfo.isAffiliated
          : Boolean(
              personalInfo.affiliationType === "academic" ||
              personalInfo.isCSUAffiliated === true ||
              personalInfo.isCSUAffiliated === false ||
              personalInfo.institutionName?.trim() ||
              personalInfo.departmentName?.trim() ||
              personalInfo.department?.trim(),
            );
      formattedData.institutionName =
        personalInfo.institutionName?.trim() ||
        personalInfo.institution?.trim() ||
        null;
      formattedData.department =
        personalInfo.department?.trim() ||
        personalInfo.departmentName?.trim() ||
        null;
    }

    if (educationalBackground) {
      // Educational Background
      formattedData.highestDegree = normalizeHighestDegree(
        educationalBackground.highestDegree,
        educationalBackground.subType,
      );
      formattedData.degree = educationalBackground.degree?.trim();
      formattedData.profession = educationalBackground.profession?.trim();
    }

    if (backgroundIP) {
      // Background IP
      formattedData.familiarWithIpRights =
        backgroundIP.familiarWithIPRights || {
          value: "no",
        };
      formattedData.ipExperience = backgroundIP.ipExperience || {
        hasExperience: "no",
        types: {
          patent: false,
          copyright: false,
          trademark: false,
          industrialDesign: false,
          utilityModel: false,
          other: false,
        },
        otherSpecify: "",
      };
    }

    console.log(
      "📝 Formatted data for update:",
      JSON.stringify(formattedData, null, 2),
    );

    console.log("🔍 Looking for existing profile via registry");
    const registryEntry = await db.query.formSubmissionRegistry.findFirst({
      where: and(
        eq(formSubmissionRegistry.ipApplicationId, applicationId),
        eq(formSubmissionRegistry.sourceType, "client_profile"),
      ),
    });

    if (!registryEntry?.sourceId) {
      console.log("❌ No registry entry found for this application");
      return NextResponse.json(
        { error: "No client profile found for this application" },
        { status: 404 },
      );
    }

    const profileId = registryEntry.sourceId;

    // Get existing profile to avoid overwriting fields that aren't being updated
    const existingProfile = await getClientProfileById(profileId);

    if (!existingProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Ensure we don't lose existing data for fields not included in the update
    if (personalInfo && !formattedData.gender && existingProfile?.gender) {
      formattedData.gender = existingProfile.gender || { value: "male" };
    }

    if (
      personalInfo &&
      !formattedData.citizenship &&
      existingProfile?.citizenship
    ) {
      formattedData.citizenship = existingProfile.citizenship || {
        value: "filipino",
        otherValue: null,
      };
    }

    // Update the existing profile
    console.log(`🔄 Updating profile with ID: ${profileId}`);
    const result = await db
      .update(liveClientProfile)
      .set(formattedData)
      .where(eq(liveClientProfile.clientId, profileId))
      .returning({ clientId: liveClientProfile.clientId });

    if (!result.length) {
      console.log(`❌ Failed to update profile with ID: ${profileId}`);
      return NextResponse.json(
        { error: "Failed to update client profile" },
        { status: 500 },
      );
    }

    console.log("✅ Profile updated successfully");

    // Handle form registry entry if it exists or if registerForm is true
    if (registryEntry?.registryId) {
      // Update existing registry entry status to match
      const registryUpdate = await db
        .update(formSubmissionRegistry)
        .set({
          status: status, // Update registry status to match profile status
          title: `Client Profile - ${existingProfile.firstName} ${existingProfile.lastName}`,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(formSubmissionRegistry.registryId, registryEntry.registryId))
        .returning();

      if (registryUpdate[0]) {
        registryId = registryUpdate[0].registryId;
        registrySuccess = true;
        registryMessage = "Form registry updated successfully";
      }
      console.log("✅ Registry entry updated to match profile status");
    } else if (registerForm === true) {
      // Create new registry entry if requested explicitly
      console.log("🔄 Creating new registry entry as requested");

      // Check if a registry entry already exists
      const existingRegistry = await db.query.formSubmissionRegistry.findFirst({
        where: and(
          eq(formSubmissionRegistry.ipApplicationId, applicationId),
          eq(formSubmissionRegistry.sourceType, "client_profile"),
        ),
      });

      if (!existingRegistry) {
        const registryData = {
          userId: session.user.id,
          sourceType: "client_profile" as const,
          sourceId: result[0].clientId,
          status: status,
          title: `Client Profile - ${existingProfile.firstName} ${existingProfile.lastName}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const registryResult = await db
          .insert(formSubmissionRegistry)
          .values(registryData)
          .returning();

        if (registryResult[0]) {
          registryId = registryResult[0].registryId;
          registrySuccess = true;
          registryMessage = "Form registry created successfully";
        }
        console.log("✅ Created new form registry entry");
      }
    }

    // Transform the result to camelCase to match frontend expectations
    const camelCaseResult = {
      ...result[0],
    };

    // Log the final stored values for debugging
    console.log("📊 STORED AFFILIATION VALUES:", {
      hasCompany: camelCaseResult.hasCompany,
      collegeFields: {
        collegeName: camelCaseResult.collegeName,
        departmentName: camelCaseResult.departmentName,
      },
      companyFields: {
        companyName: camelCaseResult.companyName,
        companyEmail: camelCaseResult.companyEmail,
      },
    });

    console.log(
      "🎉 Update operation completed. Result:",
      JSON.stringify(camelCaseResult, null, 2),
    );

    // Return with registry information, matching the POST handler's response format
    return NextResponse.json({
      success: true,
      data: camelCaseResult,
      registry: {
        success: registrySuccess,
        registryId: registryId,
        message: registryMessage,
      },
    });
  } catch (error) {
    console.error("❌ Error in PUT /api/client-profile:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to update client profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
