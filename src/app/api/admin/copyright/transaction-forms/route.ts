import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/drizzle/db";
import {
  copyrightBasicApplication,
  copyrightTransactionPart1,
  copyrightTransactionPart2,
  ipDisclosure,
  ipApplication,
} from "@/drizzle/migrations/schema";
import { eq, and, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET: Fetch copyright data for the current user
export async function GET(req: NextRequest) {
  try {
    console.log("[API:GET] Starting current user copyright data fetch");
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      console.log("[API:GET] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log(
      `[API:GET] Fetching copyright data for current user: ${userId}`
    );

    // Get application ID from URL query params if provided
    const url = new URL(req.url);
    const applicationIdParam = url.searchParams.get("applicationId");

    // Get the user's IP application based on the criteria
    let ipApplications;
    if (applicationIdParam) {
      console.log(
        `[API:GET] Using provided applicationId: ${applicationIdParam}`
      );
      ipApplications = await db
        .select({
          id: ipApplication.id,
        })
        .from(ipApplication)
        .where(
          and(
            eq(ipApplication.userId, userId),
            eq(ipApplication.id, applicationIdParam)
          )
        );
      console.log(
        `[API:GET] IP applications query result:`,
        JSON.stringify(ipApplications, null, 2)
      );
    } else {
      console.log(
        "[API:GET] No applicationId provided, fetching most recent copyright application"
      );
      ipApplications = await db
        .select({
          id: ipApplication.id,
        })
        .from(ipApplication)
        .where(
          and(
            eq(ipApplication.userId, userId),
            eq(ipApplication.ipType, "copyright")
          )
        )
        .orderBy(desc(ipApplication.createdAt))
        .limit(1);
      console.log(
        `[API:GET] Most recent IP application query result:`,
        JSON.stringify(ipApplications, null, 2)
      );
    }

    if (ipApplications.length === 0) {
      console.log(
        `[API:GET] No copyright applications found for user: ${userId}`
      );
      return NextResponse.json(
        {
          success: false,
          error: "No copyright applications found for current user",
          data: null,
        },
        { status: 404 }
      );
    }

    const applicationId = ipApplications[0].id;
    console.log(`[API:GET] Found application ID: ${applicationId}`);

    try {
      // First we need to find the disclosure that's associated with this application
      const disclosures = await db
        .select({
          disclosureId: ipDisclosure.disclosureId,
        })
        .from(ipDisclosure)
        .where(eq(ipDisclosure.applicationId, applicationId));
      console.log(
        `[API:GET] Disclosure query result:`,
        JSON.stringify(disclosures, null, 2)
      );

      if (disclosures.length === 0) {
        console.log(
          `[API:GET] No disclosure found for application: ${applicationId}`
        );
        return NextResponse.json(
          {
            success: false,
            error: "No disclosure found for this application",
            data: null,
          },
          { status: 404 }
        );
      }

      const disclosureId = disclosures[0].disclosureId;
      console.log(`[API:GET] Found disclosure ID: ${disclosureId}`);

      // Now fetch the copyright basic application data using the disclosure ID
      const basicApplications = await db
        .select()
        .from(copyrightBasicApplication)
        .where(eq(copyrightBasicApplication.disclosureId, disclosureId));

      console.log(
        "[API:GET] Basic applications query result:",
        JSON.stringify(basicApplications, null, 2)
      );

      // If we don't find any copyright applications, return early
      if (basicApplications.length === 0) {
        console.log(
          `[API:GET] No copyright applications found for disclosure: ${disclosureId}`
        );
        return NextResponse.json(
          {
            success: false,
            error: "No copyright applications found for this disclosure",
            data: null,
          },
          { status: 404 }
        );
      }

      const copyrightId = basicApplications[0].copyrightId;
      console.log(`[API:GET] Found copyright ID: ${copyrightId}`);

      // Fetch transaction part 1 data
      const transactionPart1Data = await db
        .select()
        .from(copyrightTransactionPart1)
        .where(eq(copyrightTransactionPart1.copyrightId, copyrightId));
      console.log(
        "[API:GET] Transaction part 1 raw data:",
        JSON.stringify(transactionPart1Data, null, 2)
      );

      // Extract transactionData from transactionPart1 and flatten it
      let transactionPart1 = {};
      if (transactionPart1Data.length > 0) {
        const transactionData = transactionPart1Data[0].transactionData;
        // If transactionData is a JSON object, merge it into the result
        if (transactionData && typeof transactionData === "object") {
          transactionPart1 = { ...transactionData };
          console.log(
            "[API:GET] Extracted transaction part 1 data:",
            JSON.stringify(transactionPart1, null, 2)
          );
        } else {
          console.log(
            "[API:GET] Transaction part 1 data is not an object:",
            typeof transactionData
          );
        }
      } else {
        console.log("[API:GET] No transaction part 1 data found");
      }

      // Fetch transaction part 2 data
      const transactionPart2Data = await db
        .select()
        .from(copyrightTransactionPart2)
        .where(eq(copyrightTransactionPart2.copyrightId, copyrightId));
      console.log(
        "[API:GET] Transaction part 2 data:",
        JSON.stringify(transactionPart2Data, null, 2)
      );

      // Transform data to ensure consistent structure
      const transformedData = {
        basicApplication: basicApplications[0] || null,
        transactionPart1: transactionPart1 || null,
        transactionPart2: transactionPart2Data[0] || null,
        // Add metadata
        metadata: {
          applicationId,
          disclosureId,
          copyrightId,
          fetchedAt: new Date().toISOString(),
        },
      };

      // Print the full transformed data structure in nice JSON format
      console.log(
        `[API:GET] FULL DATA OUTPUT START ==========================================`
      );
      console.log(JSON.stringify(transformedData, null, 2));
      console.log(
        `[API:GET] FULL DATA OUTPUT END ============================================`
      );

      console.log(
        `[API:GET] Successfully fetched copyright data for application: ${applicationId}`
      );

      // Return the combined data
      return NextResponse.json(
        {
          success: true,
          data: transformedData,
        },
        { status: 200 }
      );
    } catch (schemaError: unknown) {
      // If there was a schema error, log it and return a helpful error
      console.error(
        "[API:GET] Schema error in copyright data fetch:",
        schemaError
      );
      return NextResponse.json(
        {
          success: false,
          error:
            "Database schema error - column names may not match expected structure",
          details:
            schemaError instanceof Error
              ? schemaError.message
              : String(schemaError),
          data: null,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(
      "[API:GET] Error fetching current user's copyright application data:",
      error
    );
    return NextResponse.json(
      { success: false, error: "Database error", data: null },
      { status: 500 }
    );
  }
}
