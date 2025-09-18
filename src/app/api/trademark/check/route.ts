import { NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { disclosureId } = body;

    if (!disclosureId) {
      return NextResponse.json(
        { error: "Disclosure ID is required" },
        { status: 400 }
      );
    }

    // Query the trademark_application table directly
    const result = await db.execute(
      sql`SELECT trademark_id FROM trademark_application WHERE disclosure_id = ${disclosureId}`
    );

    return NextResponse.json({
      exists: result.length > 0,
      trademarkId: result.length > 0 ? result[0].trademark_id : null,
    });
  } catch (error) {
    console.error("Error checking trademark existence:", error);
    return NextResponse.json(
      { error: "Failed to check trademark existence" },
      { status: 500 }
    );
  }
}
