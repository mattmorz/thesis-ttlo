import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/drizzle/db";
import { ipApplication, trackingCode } from "@/drizzle/migrations/schema";
import { and, eq, isNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const applicationId = url.searchParams.get("applicationId");
    if (!applicationId) {
      return NextResponse.json(
        { success: false, error: "Application ID is required" },
        { status: 400 }
      );
    }

    const application = await db.query.ipApplication.findFirst({
      where: and(
        eq(ipApplication.id, applicationId),
        eq(ipApplication.userId, session.user.id)
      ),
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 }
      );
    }

    const tracking = await db.query.trackingCode.findFirst({
      where: and(
        eq(trackingCode.ipApplicationId, applicationId),
        isNull(trackingCode.revokedAt)
      ),
      columns: { code: true },
    });

    if (!tracking) {
      return NextResponse.json(
        { success: false, error: "Tracking code not available yet" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: tracking });
  } catch (error) {
    console.error("[Tracking Code] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tracking code" },
      { status: 500 }
    );
  }
}
