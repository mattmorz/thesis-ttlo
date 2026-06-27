import { NextRequest, NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { otherDocuments } from "@/drizzle/schema";
import { eq, and, SQL, desc } from "drizzle-orm";
import { validate as validateUuid } from "uuid";

export const dynamic = "force-dynamic";
// Mock data for development
const mockOtherDocuments = [
  {
    documentId: "c74f4cba-5071-4f1e-9fc2-6a9501dcc927",
    formId: "form-123",
    ipApplicationId: "app-123",
    userId: "user-123",
    fileName: "sample_document.pdf",
    originalName: "sample_document.pdf",
    filePath: "https://example.com/uploads/sample_document.pdf",
    fileSize: 1024 * 1024 * 2, // 2MB
    mimeType: "application/pdf",
    category: "other",
    description: "A sample document",
    uploadedAt: "2023-10-18T12:00:00Z",
    status: "active",
  },
  // Add more mock documents as needed
];

export async function GET(req: NextRequest) {
  console.log("[API/documents/other] Received GET request");
  try {
    // Mock authentication for development
    // In production, you would use actual auth
    const mockSession = {
      user: {
        id: "550e8400-e29b-41d4-a716-446655440000", // Valid UUID format instead of "user-123"
      },
    };
    const session = mockSession;

    if (!session) {
      console.error("[API/documents/other] Unauthorized - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(req.url);
    const searchParams = url.searchParams;

    // Extract and validate required parameters
    const formId = searchParams.get("formId");
    const ipApplicationId = searchParams.get("ipApplicationId");

    // ipApplicationId is now the primary required parameter
    if (!ipApplicationId) {
      console.error(
        "[API/documents/other] Missing required ipApplicationId parameter"
      );
      return NextResponse.json(
        { error: "IP Application ID is required" },
        { status: 400 }
      );
    }

    // Validate ipApplicationId is a valid UUID
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

    console.log(
      "[API/documents/other] Fetching documents for ipApplicationId:",
      ipApplicationId
    );

    // Build query conditions starting with ipApplicationId - explicitly define as SQL<unknown>
    let conditions: SQL<unknown> = eq(
      otherDocuments.ipApplicationId,
      ipApplicationId
    );

    // Add formId filter if provided
    if (formId) {
      // Format validation for formId
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

      // Create a new SQL condition by combining the two conditions
      const formCondition: SQL<unknown> = eq(otherDocuments.formId, formId);
      conditions = and(conditions, formCondition) as SQL<unknown>;

      console.log(
        "[API/documents/other] Added formId filter to query:",
        formId
      );
    } else {
      console.log(
        "[API/documents/other] No formId filter provided, fetching all documents for ipApplicationId"
      );
    }

    // Query the database - sort by uploadedAt in descending order (newest first)
    console.log("[API/documents/other] Executing database query...");
    const documents = await db
      .select()
      .from(otherDocuments)
      .where(conditions)
      .orderBy(desc(otherDocuments.uploadedAt));

    console.log(
      `[API/documents/other] Query returned ${documents.length} documents`
    );

    if (documents.length === 0) {
      console.log("[API/documents/other] No documents found, using mock data");
      // For development, you can return mock data if no documents are found
      return NextResponse.json({ documents: mockOtherDocuments });
    }

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("[API/documents/other] Error fetching documents:", error);

    // Log more detailed error information
    if (error instanceof Error) {
      console.error("[API/documents/other] Error message:", error.message);
      console.error("[API/documents/other] Error stack:", error.stack);
    }

    // For development, you can return mock data if an error occurs
    console.log("[API/documents/other] Returning mock data due to error");
    return NextResponse.json(
      {
        documents: mockOtherDocuments,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 200 } // Still returning 200 with mock data for development
    );
  }
}
