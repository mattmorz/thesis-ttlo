import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/drizzle/db";
import { trackingCode, userAccount } from "@/drizzle/migrations/schema";
import { and, eq, isNull } from "drizzle-orm";
import { normalizePhone } from "@/lib/tracking-utils";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const rawPhone = String(body?.phoneNumber || "");
    const phoneNumber = normalizePhone(rawPhone);

    if (!phoneNumber || phoneNumber.length < 8) {
      return NextResponse.json(
        { success: false, error: "Invalid phone number" },
        { status: 400 }
      );
    }

    const existing = await db.query.userAccount.findFirst({
      where: eq(userAccount.phoneNumber, phoneNumber),
      columns: { id: true },
    });

    if (existing && existing.id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Phone number already in use" },
        { status: 409 }
      );
    }

    await db
      .update(userAccount)
      .set({ phoneNumber })
      .where(eq(userAccount.id, session.user.id));

    await db
      .update(trackingCode)
      .set({ phoneNumber })
      .where(
        and(
          eq(trackingCode.userId, session.user.id),
          isNull(trackingCode.revokedAt)
        )
      );

    return NextResponse.json({ success: true, data: { phoneNumber } });
  } catch (error) {
    console.error("[Account Phone] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update phone number" },
      { status: 500 }
    );
  }
}
