import { NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import {
  formSubmissionRegistry,
  ipDisclosure,
  ipApplication,
  applicationType,
} from "@/drizzle/migrations/schema";
import { eq, sql, and } from "drizzle-orm";
import { auth } from "@/auth";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { disclosureId: string } }
) {
  try {
    // Get the disclosure ID from the URL params
    const { disclosureId } = params;

    // Validate the disclosure ID
    if (!disclosureId || typeof disclosureId !== "string") {
      return NextResponse.json(
        { error: "Invalid disclosure ID provided" },
        { status: 400 }
      );
    }

    // Get session to check authorization
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    // Find the disclosure to get the applicationId
    const disclosures = await db
      .select({
        disclosureId: ipDisclosure.disclosureId,
        clientId: ipDisclosure.clientId,
        applicationId: ipDisclosure.applicationId,
        selectedIpTypes: ipDisclosure.selectedIpTypes,
      })
      .from(ipDisclosure)
      .where(eq(ipDisclosure.disclosureId, disclosureId))
      .limit(1);

    if (disclosures.length === 0) {
      return NextResponse.json(
        { error: "Disclosure not found" },
        { status: 404 }
      );
    }

    const disclosure = disclosures[0];

    // Check if user owns this disclosure
    if (disclosure.clientId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to submit this disclosure" },
        { status: 403 }
      );
    }

    // Extract IP types and other data needed for submission registry
    let ipTypes: Record<string, any> = {};
    try {
      ipTypes =
        typeof disclosure.selectedIpTypes === "string"
          ? JSON.parse(disclosure.selectedIpTypes)
          : disclosure.selectedIpTypes || {};
    } catch (error) {
      console.error("Error parsing selectedIpTypes:", error);
      ipTypes = {};
    }

    // Create a title based on the IP types
    const getTitle = () => {
      const types = [];

      // Use optional chaining for safer property access
      if (ipTypes?.applicantsInfo?.ipTypes?.copyright) types.push("Copyright");
      if (ipTypes?.applicantsInfo?.ipTypes?.patent) types.push("Patent");
      if (ipTypes?.applicantsInfo?.ipTypes?.utilityModel)
        types.push("Utility Model");
      if (ipTypes?.applicantsInfo?.ipTypes?.trademark) types.push("Trademark");
      if (ipTypes?.applicantsInfo?.ipTypes?.tradeSecret)
        types.push("Trade Secret");

      return types.length > 0
        ? `IP Disclosure - ${types.join(", ")}`
        : "IP Disclosure Submission";
    };

    // Ensure we have an application_id before proceeding
    let applicationId = disclosure.applicationId;

    if (!applicationId) {
      console.log("No application ID found, creating one...");

      // Create a new application ID
      applicationId = uuidv4();

      // Determine which IP type to use
      let ipType = "copyright"; // Default
      if (ipTypes?.applicantsInfo?.ipTypes) {
        if (ipTypes.applicantsInfo.ipTypes.trademark) ipType = "trademark";
        else if (ipTypes.applicantsInfo.ipTypes.patent) ipType = "patent";
        else if (ipTypes.applicantsInfo.ipTypes.utilityModel)
          ipType = "utility_model";
      }

      // Create an IP application record using raw SQL to avoid type issues
      await db.execute(
        sql`
          INSERT INTO ip_application (
            id, 
            user_id,
            title,
            description,
            ip_type,
            status,
            created_at,
            updated_at
          ) VALUES (
            ${applicationId},
            ${session.user.id},
            ${getTitle()},
            ${"IP Disclosure application"},
            ${ipType}::application_type,
            'draft',
            NOW(),
            NOW()
          )
        `
      );

      console.log("Created new application record with ID:", applicationId);
    }

    // Update the IP disclosure status and application_id
    await db
      .update(ipDisclosure)
      .set({
        status: "submitted",
        applicationId: applicationId, // Ensure applicationId is set
        updatedAt: new Date().toISOString(),
      })
      .where(eq(ipDisclosure.disclosureId, disclosureId));

    // Create a form submission registry entry
    // First check if a registry entry already exists for this disclosure
    const existingRegistry = await db
      .select({ registryId: formSubmissionRegistry.registryId })
      .from(formSubmissionRegistry)
      .where(
        and(
          eq(formSubmissionRegistry.sourceType, "ip_disclosure"),
          eq(formSubmissionRegistry.sourceId, disclosureId)
        )
      );

    if (existingRegistry && existingRegistry.length > 0) {
      console.log("Registry entry already exists, updating it");
      // Update existing registry entry
      const registry = await db
        .update(formSubmissionRegistry)
        .set({
          status: "submitted",
          title: getTitle(),
          description: "IP Disclosure submission",
          updatedAt: new Date().toISOString(),
          submittedAt: new Date().toISOString(),
          // Make sure the application ID is updated if it wasn't before
          ipApplicationId: applicationId,
        })
        .where(
          eq(formSubmissionRegistry.registryId, existingRegistry[0].registryId)
        )
        .returning();

      return NextResponse.json(
        {
          success: true,
          message: "IP disclosure successfully submitted",
          disclosureId,
          applicationId,
          registryId: registry[0].registryId,
        },
        { status: 200 }
      );
    } else {
      console.log("Creating new registry entry");
      // Create a new registry entry
      const registry = await db
        .insert(formSubmissionRegistry)
        .values({
          userId: session.user.id,
          sourceType: "ip_disclosure",
          sourceId: disclosureId,
          ipApplicationId: applicationId,
          status: "submitted",
          title: getTitle(),
          description: "IP Disclosure submission",
          submittedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();

      return NextResponse.json(
        {
          success: true,
          message: "IP disclosure successfully submitted",
          disclosureId,
          applicationId,
          registryId: registry[0].registryId,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error submitting IP disclosure:", error);

    return NextResponse.json(
      {
        error: "Failed to submit IP disclosure",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
