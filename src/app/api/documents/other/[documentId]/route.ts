import { NextRequest, NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { otherDocuments } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Mock database data for development fallback
// This will be used only if database query fails
let mockDocuments = [
  {
    documentId: "doc-1",
    formId: "demo-form-id",
    userId: "user-123",
    ipApplicationId: "demo-app-id",
    fileName: "research-proposal.pdf",
    originalName: "Research Proposal.pdf",
    filePath: "https://example.com/files/research-proposal.pdf",
    fileSize: 1024 * 1024 * 2.5, // 2.5 MB
    mimeType: "application/pdf",
    category: "proposal",
    uploadedAt: new Date().toISOString(),
    status: "active",
  },
  {
    documentId: "doc-2",
    formId: "demo-form-id",
    userId: "user-123",
    ipApplicationId: "demo-app-id",
    fileName: "financial-plan.xlsx",
    originalName: "Financial Plan.xlsx",
    filePath: "https://example.com/files/financial-plan.xlsx",
    fileSize: 1024 * 1024 * 1.8, // 1.8 MB
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    category: "financial",
    uploadedAt: new Date().toISOString(),
    status: "active",
  },
];

// DELETE endpoint to remove a document
export async function DELETE(
  req: NextRequest,
  { params }: { params: { documentId: string } }
) {
  // Mock authentication for development
  // In production, you would use actual auth
  const mockSession = { user: { id: "user-123" } };
  const session = mockSession;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = params;

  try {
    // First, try to delete the document from the database
    let deleted = false;

    try {
      const result = await db
        .delete(otherDocuments)
        .where(eq(otherDocuments.documentId, documentId))
        .returning({ id: otherDocuments.documentId });

      deleted = result.length > 0;
    } catch (dbError) {
      console.error("Database error:", dbError);
      // Fallback to mock data if database query fails
      const documentIndex = mockDocuments.findIndex(
        (doc) => doc.documentId === documentId
      );

      if (documentIndex !== -1) {
        mockDocuments.splice(documentIndex, 1);
        deleted = true;
      }
    }

    if (!deleted) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
