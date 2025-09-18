import { NextRequest, NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { ipApplicationEnrollment } from "@/drizzle/migrations/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

// DELETE - Remove enrollment
export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string; enrollmentId: string } }
) {
  try {
    // Validate authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin permissions
    if (session.user.role !== "admin" && session.user.role !== "ttlo_staff") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { projectId, enrollmentId } = params;

    // Delete the enrollment
    const result = await db
      .delete(ipApplicationEnrollment)
      .where(
        and(
          eq(ipApplicationEnrollment.enrollmentId, enrollmentId),
          eq(ipApplicationEnrollment.applicationId, projectId)
        )
      )
      .returning({ id: ipApplicationEnrollment.enrollmentId });

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Enrollment successfully removed",
      removed: result[0].id,
    });
  } catch (error) {
    console.error("Error removing enrollment:", error);
    return NextResponse.json(
      { error: "Failed to remove enrollment" },
      { status: 500 }
    );
  }
}
