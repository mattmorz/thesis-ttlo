import { NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { sql } from "drizzle-orm";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { disclosureId } = body;

    if (!disclosureId) {
      return NextResponse.json(
        { error: "Disclosure ID is required" },
        { status: 400 }
      );
    }

    // First check if the disclosure exists
    const disclosureResult = await db.execute(
      sql`SELECT disclosure_id FROM ip_disclosure WHERE disclosure_id = ${disclosureId}`
    );

    if (disclosureResult.length === 0) {
      return NextResponse.json({
        exists: false,
        error: "Disclosure not found",
      });
    }

    // Then check for trademark application
    const trademarkResult = await db.execute(
      sql`SELECT COUNT(*) as count FROM trademark_application WHERE disclosure_id = ${disclosureId}`
    );

    // Type assertion for the count property
    const count = (trademarkResult[0] as { count: number })?.count ?? 0;
    const exists = count > 0;

    return NextResponse.json({ exists });
  } catch (error) {
    console.error("Error checking trademark existence:", error);
    return NextResponse.json(
      { error: "Failed to check trademark existence" },
      { status: 500 }
    );
  }
}
