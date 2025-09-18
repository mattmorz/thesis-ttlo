import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/drizzle/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { disclosureId: string } }
) {
  try {
    // Get the disclosure ID from the params
    const { disclosureId } = params;
    console.log(
      "Saving transaction form part 2 data for disclosure:",
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

    console.log("Transaction part 2 data structure:", {
      hasTransactionDetails: !!data?.transaction_details,
      hasApplicantInfo: !!data?.applicant_info,
      hasAuthorInfo: !!data?.author_info,
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

    // Extract the main sections of data for database storage
    let transactionDetails = data.transaction_details || {};

    // Log the transaction details for debugging
    console.log("Raw transaction details:", {
      keys: Object.keys(transactionDetails),
      hasIpsoRegion: !!transactionDetails.ipsoRegion,
      ipsoRegion: transactionDetails.ipsoRegion,
      transactionDetailsJson:
        JSON.stringify(transactionDetails).substring(0, 200) + "...", // Truncate for logging
    });

    // Handle nested transaction_details if present
    if (transactionDetails.transaction_details) {
      console.log("Found nested transaction_details, flattening structure");
      // Merge the nested structure
      transactionDetails = {
        ...transactionDetails,
        ...transactionDetails.transaction_details,
      };
      // Remove the nested property to avoid recursion
      delete transactionDetails.transaction_details;
    }

    const applicantInfo = data.applicant_info || {};
    const authorInfo = data.author_info || {};

    // If work_creation_form exists in the data, merge it into transaction_details
    if (
      data.work_creation_form &&
      typeof data.work_creation_form === "object"
    ) {
      transactionDetails = {
        ...transactionDetails,
        workCreationForm: data.work_creation_form,
      };
    }

    // Log the exact data that will be inserted/updated
    console.log("Database update details:", {
      disclosureId,
      copyrightId: effectiveCopyrightId,
      transactionDetailsKeys: Object.keys(transactionDetails),
      applicantInfoKeys: Object.keys(applicantInfo),
      authorInfoKeys: Object.keys(authorInfo),
    });

    // Determine if this is a copyright registration
    const isCopyrightRegistration =
      transactionDetails.transactionType?.copyrightRegistration === true;

    // Determine filing method
    const filingMethod = transactionDetails.submissionType?.filingMethod
      ?.electronicFiling
      ? "electronic"
      : transactionDetails.submissionType?.filingMethod?.throughIPSO
      ? "through_ipso"
      : null;

    // Determine filing type
    const filingType = transactionDetails.submissionType?.filingType
      ?.singleFiling
      ? "single"
      : transactionDetails.submissionType?.filingType?.bulkFiling
      ? "bulk"
      : null;

    try {
      // Check if a record already exists
      console.log(
        `Checking for existing record with disclosureId: ${disclosureId}, copyrightId: ${effectiveCopyrightId}`
      );

      const findResult = await db.execute(sql`
        SELECT * FROM copyright_transaction_part2
        WHERE disclosure_id = ${disclosureId} AND copyright_id = ${effectiveCopyrightId}
        LIMIT 1
      `);

      const existingRecord =
        Array.isArray(findResult) && findResult.length > 0
          ? findResult[0]
          : null;
      let result;

      if (existingRecord) {
        console.log("Updating existing transaction part 2 record:", {
          transactionPart2Id: existingRecord.transaction_part2_id,
          disclosureId,
          copyrightId: effectiveCopyrightId,
        });

        // Prepare detailed logging of the transaction data
        console.log("Update transaction details:", {
          ipsoRegion: transactionDetails.ipsoRegion,
          keysCount: Object.keys(transactionDetails).length,
          keys: Object.keys(transactionDetails).join(", "),
        });

        // Prepare the transaction details as JSON for database storage
        let transactionDetailsJson;
        try {
          transactionDetailsJson = JSON.stringify(transactionDetails);
          console.log(
            `Serialized transaction_details (${transactionDetailsJson.length} chars)`
          );
        } catch (error) {
          console.error("Error stringifying transaction_details:", error);
          return NextResponse.json(
            { error: "Invalid transaction details format" },
            { status: 400 }
          );
        }

        try {
          // Simple update that just handles the transaction_details column
          result = await db.execute(sql`
            UPDATE copyright_transaction_part2
            SET 
              transaction_details = ${transactionDetailsJson}::jsonb,
              updated_at = NOW()
            WHERE disclosure_id = ${disclosureId} 
              AND copyright_id = ${effectiveCopyrightId}
            RETURNING *
          `);

          console.log(
            `Main update completed for disclosure ${disclosureId}, copyright ${effectiveCopyrightId}`
          );

          // If there's applicant or author info, update those in a separate query
          if (
            Object.keys(applicantInfo).length > 0 ||
            Object.keys(authorInfo).length > 0
          ) {
            try {
              // Prepare JSON strings
              const applicantInfoJson =
                Object.keys(applicantInfo).length > 0
                  ? JSON.stringify(applicantInfo)
                  : null;

              const authorInfoJson =
                Object.keys(authorInfo).length > 0
                  ? JSON.stringify(authorInfo)
                  : null;

              // Only update columns that have data
              let updateSql = sql`
                UPDATE copyright_transaction_part2
                SET updated_at = NOW()
              `;

              if (applicantInfoJson) {
                updateSql = sql`${updateSql}, applicant_info = ${applicantInfoJson}::jsonb`;
              }

              if (authorInfoJson) {
                updateSql = sql`${updateSql}, author_info = ${authorInfoJson}::jsonb`;
              }

              updateSql = sql`
                ${updateSql}
                WHERE disclosure_id = ${disclosureId} 
                  AND copyright_id = ${effectiveCopyrightId}
                RETURNING *
              `;

              const secondaryResult = await db.execute(updateSql);
              console.log(
                "Secondary update for applicant/author info completed"
              );

              // Use the secondary result as it's more complete
              if (
                Array.isArray(secondaryResult) &&
                secondaryResult.length > 0
              ) {
                result = secondaryResult;
              }
            } catch (error) {
              console.error("Error during secondary update:", error);
              // We already have the main update result, so continue
            }
          }
        } catch (error) {
          console.error("Error updating existing record:", error);
          return NextResponse.json(
            { error: "Failed to update record" },
            { status: 500 }
          );
        }
      } else {
        // Create a new record
        console.log("Creating new transaction part 2 record");

        // Prepare data for insert
        let transactionDetailsJson;
        try {
          transactionDetailsJson = JSON.stringify(transactionDetails);
        } catch (error) {
          console.error("Error stringifying transaction_details:", error);
          return NextResponse.json(
            { error: "Invalid transaction details format" },
            { status: 400 }
          );
        }

        const applicantInfoJson =
          Object.keys(applicantInfo).length > 0
            ? JSON.stringify(applicantInfo)
            : null;

        const authorInfoJson =
          Object.keys(authorInfo).length > 0
            ? JSON.stringify(authorInfo)
            : null;

        try {
          // Insert a new record
          result = await db.execute(sql`
            INSERT INTO copyright_transaction_part2 (
              disclosure_id,
              copyright_id,
              transaction_details,
              applicant_info,
              author_info,
              created_at,
              updated_at
            ) VALUES (
              ${disclosureId},
              ${effectiveCopyrightId},
              ${transactionDetailsJson}::jsonb,
              ${applicantInfoJson}::jsonb,
              ${authorInfoJson}::jsonb,
              NOW(),
              NOW()
            )
            RETURNING *
          `);

          console.log("New transaction part 2 record created");
        } catch (error) {
          console.error("Error creating new record:", error);
          return NextResponse.json(
            { error: "Failed to create record" },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        message: "Transaction form part 2 updated successfully",
        disclosureId,
        copyrightId: effectiveCopyrightId,
      });
    } catch (dbError) {
      console.error("Database Error:", dbError);
      return NextResponse.json(
        {
          error: "Database operation failed",
          details: dbError instanceof Error ? dbError.message : "Unknown error",
          sqlError: String(dbError),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error saving transaction form part 2:", error);
    return NextResponse.json(
      {
        error: "Failed to save transaction form part 2",
        details: error instanceof Error ? error.message : "Unknown error",
        fullError: String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { disclosureId: string } }
) {
  const disclosureId = params.disclosureId;
  const session = await auth();

  // Check authentication
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the search params, which may include a copyrightId
    const searchParams = request.nextUrl.searchParams;

    // Build the query based on whether a copyrightId was provided
    const query = searchParams.get("copyrightId")
      ? sql`
        SELECT * FROM copyright_transaction_part2
        WHERE disclosure_id = ${disclosureId} AND copyright_id = ${searchParams.get(
          "copyrightId"
        )}
        LIMIT 1
      `
      : sql`
        SELECT * FROM copyright_transaction_part2
        WHERE disclosure_id = ${disclosureId}
        ORDER BY updated_at DESC
        LIMIT 1
      `;

    // Execute the query
    const result = await db.execute(query);
    const record =
      Array.isArray(result) && result.length > 0 ? result[0] : null;

    if (!record) {
      console.log(
        `No transaction part 2 record found for disclosure ${disclosureId}${
          searchParams.get("copyrightId")
            ? ` and copyright ${searchParams.get("copyrightId")}`
            : ""
        }`
      );
      return NextResponse.json({ data: null }, { status: 200 });
    }

    // Log the record format for debugging
    console.log("Found record structure:", {
      hasTransactionDetails: !!record.transaction_details,
      transactionDetailsType: typeof record.transaction_details,
      transactionDetailsKeys: record.transaction_details
        ? Object.keys(record.transaction_details)
        : [],
      recordKeys: Object.keys(record),
    });

    // Ensure transaction_details is valid JSON if it's a string
    let transactionDetails = record.transaction_details;
    if (typeof transactionDetails === "string" && transactionDetails) {
      try {
        transactionDetails = JSON.parse(transactionDetails);
      } catch (error) {
        console.error("Error parsing transaction_details JSON:", error);
        // Keep as string if parsing fails
      }
    }

    // Format the response with properly structured data
    const formattedRecord = {
      ...record,
      transaction_details: transactionDetails || {},
    };

    return NextResponse.json({ data: formattedRecord }, { status: 200 });
  } catch (error) {
    console.error("Error fetching transaction part 2 data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
