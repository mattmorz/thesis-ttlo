import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/drizzle/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { disclosureId: string } }
) {
  return NextResponse.json(
    {
      error:
        "Transaction form part 2 has been removed and this endpoint is deprecated.",
    },
    { status: 410 }
  );
  try {
    // Get the disclosure ID from the params
    const { disclosureId } = params;
    console.log(
      "Debug endpoint: checking transaction part 2 data for:",
      disclosureId
    );

    // Get current user session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get copyrightId parameter if available
    const searchParams = request.nextUrl.searchParams;
    const copyrightId = searchParams.get("copyrightId");

    const debugData: any = {
      endpoint: "debug-transaction-part2",
      disclosureId,
      copyrightId,
      timestamp: new Date().toISOString(),
      tableInfo: null,
      recordData: null,
      queryErrors: [],
    };

    // Check the table structure
    try {
      const tableInfo = await db.execute(
        sql`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'copyright_transaction_part2'
          ORDER BY ordinal_position
        `
      );
      debugData.tableInfo = tableInfo;
    } catch (tableError) {
      console.error("Error checking table structure:", tableError);
      debugData.queryErrors.push({
        type: "table-structure",
        message:
          tableError instanceof Error ? tableError.message : String(tableError),
      });
    }

    // Try to find the record
    try {
      let query = sql`
        SELECT * FROM copyright_transaction_part2
        WHERE disclosure_id = ${disclosureId}
      `;

      if (copyrightId) {
        query = sql`
          SELECT * FROM copyright_transaction_part2
          WHERE disclosure_id = ${disclosureId}
          AND copyright_id = ${copyrightId}
        `;
      }

      const records = await db.execute(query);

      if (records && Array.isArray(records) && records.length > 0) {
        debugData.recordData = records;
        debugData.recordCount = records.length;

        // Extract more readable form of transaction details if present
        const recordDetails = [];
        for (const record of records) {
          try {
            const transactionDetails = record.transaction_details || {};
            recordDetails.push({
              transactionPart2Id: record.transaction_part2_id,
              ipsoRegion: (transactionDetails as any).ipsoRegion,
              recordUpdatedAt: record.updated_at,
              hasTransactionDetails: !!record.transaction_details,
              transactionDetailsKeys: record.transaction_details
                ? Object.keys(record.transaction_details)
                : [],
              transactionDetailsSize: JSON.stringify(record.transaction_details)
                .length,
              applicantInfoKeys: record.applicant_info
                ? Object.keys(record.applicant_info)
                : [],
              authorInfoKeys: record.author_info
                ? Object.keys(record.author_info)
                : [],
            });
          } catch (e) {
            recordDetails.push({
              transactionPart2Id: record.transaction_part2_id,
              error: "Failed to parse record details",
              errorMessage: e instanceof Error ? e.message : String(e),
            });
          }
        }

        debugData.recordDetails = recordDetails;
      } else {
        debugData.recordData = null;
        debugData.recordCount = 0;
      }
    } catch (recordError) {
      console.error("Error finding records:", recordError);
      debugData.queryErrors.push({
        type: "record-query",
        message:
          recordError instanceof Error
            ? recordError.message
            : String(recordError),
      });
    }

    return NextResponse.json(debugData);
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      {
        error: "Debug endpoint failed",
        details: error instanceof Error ? error.message : "Unknown error",
        errorObject: String(error),
      },
      { status: 500 }
    );
  }
}
