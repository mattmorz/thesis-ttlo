import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/drizzle/db";
import { otherDocuments } from "@/drizzle/schema";
import { eq, and, SQL, desc } from "drizzle-orm";
import { validate as validateUuid } from "uuid";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  console.log("[API/documents/other] Received GET request");
  try {
    const session = await auth();

    if (!session?.user?.id) {
      console.error("[API/documents/other] Unauthorized - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const formId = searchParams.get("formId");
    const ipApplicationId = searchParams.get("ipApplicationId");

    if (!ipApplicationId) {
      console.error(
        "[API/documents/other] Missing required ipApplicationId parameter"
      );
      return NextResponse.json(
        { error: "IP Application ID is required" },
        { status: 400 }
      );
    }

    if (!validateUuid(ipApplicationId)) {
      console.error(
        "[API/documents/other] Invalid UUID format for ipApplicationId:",
        ipApplicationId
      );
      return NextResponse.json(
        { error: "IP Application ID must be a valid UUID" },
        { status: 400 }
      );
    }

    let conditions: SQL<unknown> = eq(
      otherDocuments.ipApplicationId,
      ipApplicationId
    );

    if (formId) {
      const formIdIsValid =
        validateUuid(formId) || /^[a-zA-Z0-9-_]+$/.test(formId);

      if (!formIdIsValid) {
        console.error(
          "[API/documents/other] Invalid format for formId:",
          formId
        );
        return NextResponse.json(
          { error: "Form ID must be a valid format" },
          { status: 400 }
        );
      }

      const formCondition: SQL<unknown> = eq(otherDocuments.formId, formId);
      conditions = and(conditions, formCondition) as SQL<unknown>;
    }

    const documents = await db
      .select()
      .from(otherDocuments)
      .where(conditions)
      .orderBy(desc(otherDocuments.uploadedAt));

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("[API/documents/other] Error fetching documents:", error);

    if (error instanceof Error) {
      console.error("[API/documents/other] Error message:", error.message);
      console.error("[API/documents/other] Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Failed to fetch documents",
        documents: [],
      },
      { status: 500 }
    );
  }
}
