import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/drizzle/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { disclosureId: string } }
) {
  return NextResponse.json(
    {
      error:
        "Transaction form part 1 has been removed and this endpoint is deprecated.",
    },
    { status: 410 }
  );
  try {
    // Get the disclosure ID from the params
    const { disclosureId } = params;
    console.log(
      "Saving transaction form part 1 data for disclosure:",
      disclosureId
    );

    // Get the current user session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    const { data, copyrightId } = body;

    console.log("Transaction part 1 data structure:", {
      hasTransactionData: !!data?.transaction_data,
      hasCoAuthors: !!data?.transaction_data?.coAuthors,
      coAuthorsLength: data?.transaction_data?.coAuthors?.length || 0,
      copyrightId: copyrightId || data?.copyrightId,
    });

    // Validate required data
    if (!data) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    // Use copyrightId from the body or from the data object
    const effectiveCopyrightId = copyrightId || data.copyrightId;
    if (!effectiveCopyrightId) {
      return NextResponse.json(
        { error: "Copyright ID is required" },
        { status: 400 }
      );
    }

    // Flatten transaction_data if needed to avoid deep nesting
    let flattenedData = { ...data };
    if (data.transaction_data?.transaction_data) {
      console.log("Flattening nested transaction_data structure");
      // Find the deepest level with valid coAuthors data
      let deepestCoAuthors = null;
      let currentObj = data.transaction_data;

      while (currentObj?.transaction_data) {
        if (
          currentObj.transaction_data.coAuthors &&
          Array.isArray(currentObj.transaction_data.coAuthors) &&
          currentObj.transaction_data.coAuthors.length > 0
        ) {
          deepestCoAuthors = currentObj.transaction_data.coAuthors;
        }
        currentObj = currentObj.transaction_data;
      }

      // Use the deepest level coAuthors if found, otherwise use the top level
      if (deepestCoAuthors) {
        flattenedData.transaction_data = {
          ...flattenedData.transaction_data,
          coAuthors: deepestCoAuthors,
        };
      }
    }

    // Check if record already exists
    const existingRecord = await db.execute(
      sql`
        SELECT transaction_part1_id 
        FROM copyright_transaction_part1
        WHERE disclosure_id = ${disclosureId}
        AND copyright_id = ${effectiveCopyrightId}
      `
    );

    if (
      existingRecord &&
      Array.isArray(existingRecord) &&
      existingRecord.length > 0
    ) {
      // Update existing record
      console.log("Updating existing transaction part 1 record");

      await db.execute(
        sql`
          UPDATE copyright_transaction_part1
          SET transaction_data = ${JSON.stringify(flattenedData)}::jsonb,
              updated_at = NOW()
          WHERE disclosure_id = ${disclosureId}
          AND copyright_id = ${effectiveCopyrightId}
        `
      );

      return NextResponse.json({
        success: true,
        message: "Transaction form part 1 updated successfully",
        disclosureId,
        copyrightId: effectiveCopyrightId,
      });
    } else {
      // Create new record
      console.log("Creating new transaction part 1 record");

      await db.execute(
        sql`
          INSERT INTO copyright_transaction_part1 (
            disclosure_id,
            copyright_id,
            transaction_data,
            created_at,
            updated_at
          )
          VALUES (
            ${disclosureId},
            ${effectiveCopyrightId},
            ${JSON.stringify(flattenedData)}::jsonb,
            NOW(),
            NOW()
          )
        `
      );

      return NextResponse.json({
        success: true,
        message: "Transaction form part 1 created successfully",
        disclosureId,
        copyrightId: effectiveCopyrightId,
      });
    }
  } catch (error) {
    console.error("Error saving transaction form part 1:", error);
    return NextResponse.json(
      {
        error: "Failed to save transaction form part 1",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { disclosureId: string } }
) {
  return NextResponse.json(
    {
      error:
        "Transaction form part 1 has been removed and this endpoint is deprecated.",
    },
    { status: 410 }
  );
  try {
    // Get the disclosure ID from the params
    const { disclosureId } = params;
    console.log(
      "Fetching transaction form part 1 data for disclosure:",
      disclosureId
    );

    // Get current user session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Fetch the transaction part 1 data
    const result = await db.execute(
      sql`
        SELECT * FROM copyright_transaction_part1
        WHERE disclosure_id = ${disclosureId}
        ORDER BY updated_at DESC
        LIMIT 1
      `
    );

    if (!result || !Array.isArray(result) || result.length === 0) {
      return NextResponse.json(
        {
          error: "No transaction form part 1 data found",
          data: null,
        },
        { status: 404 }
      );
    }

    const data = result[0];
    console.log("Found transaction form part 1 data:", {
      hasData: !!data,
      transactionPart1Id: data.transaction_part1_id,
      copyrightId: data.copyright_id,
      hasTransactionData: !!data.transaction_data,
    });

    return NextResponse.json({
      success: true,
      data: data.transaction_data,
    });
  } catch (error) {
    console.error("Error fetching transaction form part 1:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch transaction form part 1",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
