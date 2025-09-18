import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/drizzle/db";
import { ipDisclosure, ipApplication } from "@/drizzle/migrations/schema";
import { and, eq, isNull, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Get the user session
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("You must be logged in", { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const disclosureId = url.searchParams.get("disclosureId");
    const applicationId = url.searchParams.get("applicationId");

    // We need at least one identifier
    if (!disclosureId && !applicationId) {
      return new NextResponse("Missing disclosureId or applicationId", {
        status: 400,
      });
    }

    // Build conditions for the query based on available parameters
    let conditions = [];

    if (disclosureId) {
      conditions.push(eq(ipDisclosure.disclosureId, disclosureId));
    } else if (applicationId) {
      conditions.push(eq(ipDisclosure.applicationId, applicationId));
    }

    // Execute the query to get the disclosure
    const disclosures = await db
      .select()
      .from(ipDisclosure)
      .where(and(...conditions))
      .limit(1);

    if (disclosures.length === 0) {
      // If no disclosure is found, check if we need to create one for the application
      if (applicationId) {
        // Verify the application exists
        const application = await db
          .select()
          .from(ipApplication)
          .where(eq(ipApplication.id, applicationId))
          .limit(1);

        if (application.length === 0) {
          return new NextResponse("Application not found", { status: 404 });
        }

        // Create a new disclosure for this application
        const newDisclosure = await db
          .insert(ipDisclosure)
          .values({
            clientId: session.user.id,
            applicationId: applicationId,
            selectedIpTypes: JSON.stringify({
              applicantsInfo: null,
              disclosureConfirmation: null,
            }),
          })
          .returning();

        // Return the new empty disclosure
        return NextResponse.json({
          disclosureId: newDisclosure[0].disclosureId,
          applicationId: applicationId,
          applicantsInfo: null,
          disclosureConfirmation: null,
        });
      }

      return new NextResponse("Disclosure not found", { status: 404 });
    }

    const disclosure = disclosures[0];

    // Ensure the disclosure belongs to the current user
    if (disclosure.clientId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Parse the JSON data
    let parsedData = {};
    try {
      parsedData = disclosure.selectedIpTypes
        ? JSON.parse(disclosure.selectedIpTypes as string)
        : {};
    } catch (error) {
      console.error("Error parsing disclosure JSON:", error);
      parsedData = {};
    }

    // Return the disclosure data with IDs
    return NextResponse.json({
      disclosureId: disclosure.disclosureId,
      applicationId: disclosure.applicationId,
      ...parsedData,
    });
  } catch (error) {
    console.error("Error fetching disclosure:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Get the user session
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("You must be logged in", { status: 401 });
    }

    // Get query parameters for the target disclosure
    const url = new URL(request.url);
    const disclosureId = url.searchParams.get("disclosureId");
    const applicationId = url.searchParams.get("applicationId");

    // Parse the request body
    const requestBody = await request.json();

    // We need at least the applicationId to save data
    if (!applicationId && !disclosureId) {
      return new NextResponse("Missing applicationId or disclosureId", {
        status: 400,
      });
    }

    // Check if we need to create a new disclosure or update an existing one
    let disclosure;

    if (disclosureId) {
      // Find the existing disclosure
      const existingDisclosures = await db
        .select()
        .from(ipDisclosure)
        .where(eq(ipDisclosure.disclosureId, disclosureId))
        .limit(1);

      if (existingDisclosures.length === 0) {
        return new NextResponse("Disclosure not found", { status: 404 });
      }

      disclosure = existingDisclosures[0];

      // Ensure the disclosure belongs to the current user
      if (disclosure.clientId !== session.user.id) {
        return new NextResponse("Unauthorized", { status: 403 });
      }
    } else if (applicationId) {
      // Find or create a disclosure for this application
      const existingDisclosures = await db
        .select()
        .from(ipDisclosure)
        .where(
          and(
            eq(ipDisclosure.applicationId, applicationId),
            eq(ipDisclosure.clientId, session.user.id as string)
          )
        )
        .limit(1);

      if (existingDisclosures.length > 0) {
        // Use the existing disclosure
        disclosure = existingDisclosures[0];
      } else {
        // Verify the application exists
        const application = await db
          .select()
          .from(ipApplication)
          .where(eq(ipApplication.id, applicationId))
          .limit(1);

        if (application.length === 0) {
          return new NextResponse("Application not found", { status: 404 });
        }

        // Create a new disclosure for this application
        const newDisclosures = await db
          .insert(ipDisclosure)
          .values({
            clientId: session.user.id,
            applicationId: applicationId,
            selectedIpTypes: JSON.stringify({}),
          })
          .returning();

        disclosure = newDisclosures[0];
      }
    }

    if (!disclosure) {
      return new NextResponse("Failed to find or create disclosure", {
        status: 500,
      });
    }

    // Prepare data for update
    const currentData = disclosure.selectedIpTypes
      ? JSON.parse(disclosure.selectedIpTypes as string)
      : {};

    // Update with the new data
    let updatedData = { ...currentData };

    // Check for each section in the request body and update accordingly
    if (requestBody.applicantsInfo) {
      updatedData.applicantsInfo = {
        ...currentData.applicantsInfo,
        ...requestBody.applicantsInfo,
      };
    }

    if (requestBody.disclosureConfirmation) {
      updatedData.disclosureConfirmation = {
        ...currentData.disclosureConfirmation,
        ...requestBody.disclosureConfirmation,
      };
    }

    if (requestBody.copyrightApplication) {
      updatedData.copyrightApplication = {
        ...currentData.copyrightApplication,
        ...requestBody.copyrightApplication,
      };
    }

    if (requestBody.patentUtilityModelApplication) {
      updatedData.patentUtilityModelApplication = {
        ...currentData.patentUtilityModelApplication,
        ...requestBody.patentUtilityModelApplication,
      };
    }

    if (requestBody.trademarkApplication) {
      updatedData.trademarkApplication = {
        ...currentData.trademarkApplication,
        ...requestBody.trademarkApplication,
      };
    }

    if (requestBody.tradeSecretApplication) {
      updatedData.tradeSecretApplication = {
        ...currentData.tradeSecretApplication,
        ...requestBody.tradeSecretApplication,
      };
    }

    if (requestBody.transactionFormPart1) {
      updatedData.transactionFormPart1 = {
        ...currentData.transactionFormPart1,
        ...requestBody.transactionFormPart1,
      };
    }

    if (requestBody.transactionFormPart2) {
      updatedData.transactionFormPart2 = {
        ...currentData.transactionFormPart2,
        ...requestBody.transactionFormPart2,
      };
    }

    // Update the disclosure in the database
    const updatedDisclosure = await db
      .update(ipDisclosure)
      .set({
        selectedIpTypes: JSON.stringify(updatedData),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(ipDisclosure.disclosureId, disclosure.disclosureId))
      .returning();

    // Return the updated disclosure
    return NextResponse.json({
      success: true,
      disclosureId: updatedDisclosure[0].disclosureId,
      applicationId: updatedDisclosure[0].applicationId, // Include applicationId in the response
    });
  } catch (error) {
    console.error("Error updating disclosure:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
