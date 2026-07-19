import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/drizzle/db";
import { otherDocuments } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// DELETE endpoint to remove a document
export async function DELETE(
  req: NextRequest,
  { params }: { params: { documentId: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = params;

  try {
    const result = await db
      .delete(otherDocuments)
      .where(eq(otherDocuments.documentId, documentId))
      .returning({ id: otherDocuments.documentId });

    const deleted = result.length > 0;

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
