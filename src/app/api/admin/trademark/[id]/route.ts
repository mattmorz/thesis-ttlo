import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
  trademarkApplication,
  ipDisclosure,
  ipDisclosureApplicant,
} from "@/drizzle/schema";
import { auth } from "@/auth";

function isAdminOrStaff(role?: string | null) {
  return role === "admin" || role === "ttlo_staff";
}

export const dynamic = "force-dynamic";

// GET endpoint to fetch a single trademark record
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdminOrStaff(session.user.role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const trademarkId = params.id;

    // Get the trademark record
    const data = await db
      .select({
        trademark: trademarkApplication,
        disclosure: ipDisclosure,
      })
      .from(trademarkApplication)
      .leftJoin(
        ipDisclosure,
        eq(trademarkApplication.disclosureId, ipDisclosure.disclosureId)
      )
      .where(eq(trademarkApplication.trademarkId, trademarkId));

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Trademark record not found" },
        { status: 404 }
      );
    }

    // Get associated applicants
    const applicants = data[0]?.disclosure?.disclosureId
      ? await db
          .select()
          .from(ipDisclosureApplicant)
          .where(
            eq(
              ipDisclosureApplicant.disclosureId,
              data[0].disclosure.disclosureId
            )
          )
      : [];

    // Return complete record
    return NextResponse.json({
      trademark: data[0]?.trademark,
      disclosure: data[0]?.disclosure,
      applicants: applicants,
    });
  } catch (error) {
    console.error("Error fetching trademark record:", error);
    return NextResponse.json(
      { error: "Failed to fetch trademark record" },
      { status: 500 }
    );
  }
}

// PUT endpoint to update a trademark record
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdminOrStaff(session.user.role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const trademarkId = params.id;
    const updateData = await request.json();

    // Verify that the record exists
    const existingRecord = await db
      .select()
      .from(trademarkApplication)
      .where(eq(trademarkApplication.trademarkId, trademarkId));

    if (!existingRecord || existingRecord.length === 0) {
      return NextResponse.json(
        { error: "Trademark record not found" },
        { status: 404 }
      );
    }

    // Update the trademark record
    if (updateData.trademark) {
      await db
        .update(trademarkApplication)
        .set({
          trademarkName: updateData.trademark.trademarkName,
          description: updateData.trademark.description,
          translation: updateData.trademark.translation,
          legalName: updateData.trademark.legalName,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(trademarkApplication.trademarkId, trademarkId));
    }

    // Update the disclosure status if provided
    if (updateData.disclosure?.status && existingRecord[0].disclosureId) {
      await db
        .update(ipDisclosure)
        .set({
          status: updateData.disclosure.status,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(ipDisclosure.disclosureId, existingRecord[0].disclosureId));
    }

    return NextResponse.json({
      success: true,
      message: "Trademark updated successfully",
    });
  } catch (error) {
    console.error("Error updating trademark record:", error);
    return NextResponse.json(
      { error: "Failed to update trademark record" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to delete a trademark record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdminOrStaff(session.user.role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const trademarkId = params.id;

    // Check if the record exists
    const existingRecord = await db
      .select()
      .from(trademarkApplication)
      .where(eq(trademarkApplication.trademarkId, trademarkId));

    if (!existingRecord || existingRecord.length === 0) {
      return NextResponse.json(
        { error: "Trademark record not found" },
        { status: 404 }
      );
    }

    // Delete the trademark record
    await db
      .delete(trademarkApplication)
      .where(eq(trademarkApplication.trademarkId, trademarkId));

    return NextResponse.json({
      success: true,
      message: "Trademark deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting trademark record:", error);
    return NextResponse.json(
      { error: "Failed to delete trademark record" },
      { status: 500 }
    );
  }
}
