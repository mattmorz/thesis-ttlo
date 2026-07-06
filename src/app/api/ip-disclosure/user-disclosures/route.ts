import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { appRouter } from "@/trpc/router";
import { db } from "@/drizzle/db";
import { ipDisclosure, formSubmissionRegistry } from "@/drizzle/migrations/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Get the current user session
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      console.log("No authenticated user found in session");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if applicationId is provided in query params
    const applicationId = request.nextUrl.searchParams.get("applicationId");

    if (applicationId) {
      console.log(
        `Fetching IP disclosure for application ID: ${applicationId}`
      );

      const registryEntry = await db.query.formSubmissionRegistry.findFirst({
        where: and(
          eq(formSubmissionRegistry.ipApplicationId, applicationId),
          eq(formSubmissionRegistry.sourceType, "ip_disclosure")
        ),
      });

      if (!registryEntry?.sourceId) {
        console.log(`No disclosure found for application ID: ${applicationId}`);
        return NextResponse.json(
          { error: "Disclosure not found" },
          { status: 404 }
        );
      }

      const disclosures = await db
        .select()
        .from(ipDisclosure)
        .where(
          and(
            eq(ipDisclosure.disclosureId, registryEntry.sourceId),
            eq(ipDisclosure.clientId, userId)
          )
        )
        .limit(1);

      if (disclosures.length === 0) {
        console.log(`No disclosure found for application ID: ${applicationId}`);
        return NextResponse.json(
          { error: "Disclosure not found" },
          { status: 404 }
        );
      }

      const disclosure = disclosures[0];

      console.log(
        `Found disclosure for application ID: ${applicationId}, disclosure ID: ${disclosure.disclosureId}`
      );

      return NextResponse.json({
        disclosureId: disclosure.disclosureId,
        applicationId,
      });
    }

    // If no applicationId provided, continue with existing functionality
    console.log("Fetching all IP disclosures for user:", userId);

    // Call the tRPC procedure to get the user's disclosures
    const caller = appRouter.createCaller({
      session,
      req: request,
      res: undefined,
    });
    const disclosures = await caller.ipDisclosure.getUserDisclosures({
      userId,
    });

    console.log(`Found ${disclosures.length} disclosures for user ${userId}`);

    // Return the disclosures
    return NextResponse.json({
      data: disclosures.map((disclosure) => ({
        id: disclosure.disclosureId,
        clientId: disclosure.clientId,
        status: disclosure.status,
        createdAt: disclosure.createdAt,
        updatedAt: disclosure.updatedAt,
      })),
      count: disclosures.length,
    });
  } catch (error) {
    console.error("Error fetching user IP disclosures:", error);
    return NextResponse.json(
      { error: "Failed to fetch user IP disclosures" },
      { status: 500 }
    );
  }
}
