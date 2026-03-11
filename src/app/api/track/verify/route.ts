import { NextRequest, NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import {
  activityLog,
  applicationPhase,
  formSubmissionRegistry,
  ipApplication,
  trackingCode,
  trackingOtp,
} from "@/drizzle/migrations/schema";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import {
  hashValue,
  normalizePhone,
  normalizeTrackingCode,
} from "@/lib/tracking-utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawCode = String(body?.trackingCode || "");
    const channel = String(body?.channel || "").toLowerCase();
    const identifierInput = String(body?.identifier || "");
    const otpInput = String(body?.otp || "");

    if (!rawCode || !channel || !identifierInput || !otpInput) {
      return NextResponse.json(
        { success: false, error: "Tracking code, destination, and OTP required" },
        { status: 400 }
      );
    }

    if (channel !== "email" && channel !== "sms") {
      return NextResponse.json(
        { success: false, error: "Invalid channel" },
        { status: 400 }
      );
    }

    const normalizedCode = normalizeTrackingCode(rawCode);
    const codeHash = hashValue(normalizedCode);
    const identifier =
      channel === "email"
        ? identifierInput.trim().toLowerCase()
        : normalizePhone(identifierInput);

    const tracking = await db.query.trackingCode.findFirst({
      where: and(eq(trackingCode.codeHash, codeHash), isNull(trackingCode.revokedAt)),
    });

    if (!tracking) {
      return NextResponse.json(
        { success: false, error: "Invalid tracking details" },
        { status: 404 }
      );
    }

    const expectedIdentifier =
      channel === "email"
        ? tracking.email.toLowerCase()
        : normalizePhone(tracking.phoneNumber || "");

    if (!expectedIdentifier || expectedIdentifier !== identifier) {
      return NextResponse.json(
        { success: false, error: "Invalid tracking details" },
        { status: 404 }
      );
    }

    const latestOtp = await db.query.trackingOtp.findFirst({
      where: and(
        eq(trackingOtp.trackingId, tracking.trackingId),
        eq(trackingOtp.channel, channel),
        eq(trackingOtp.identifier, identifier),
        gt(trackingOtp.expiresAt, new Date().toISOString())
      ),
      orderBy: [desc(trackingOtp.createdAt)],
    });

    if (!latestOtp) {
      return NextResponse.json(
        { success: false, error: "OTP expired or not found" },
        { status: 400 }
      );
    }

    const otpHash = hashValue(otpInput);

    if (latestOtp.attempts && latestOtp.attempts >= 5) {
      return NextResponse.json(
        { success: false, error: "OTP attempts exceeded" },
        { status: 429 }
      );
    }

    if (latestOtp.otpHash !== otpHash) {
      await db
        .update(trackingOtp)
        .set({ attempts: (latestOtp.attempts || 0) + 1 })
        .where(eq(trackingOtp.otpId, latestOtp.otpId));

      return NextResponse.json(
        { success: false, error: "Invalid OTP" },
        { status: 400 }
      );
    }

    await db
      .update(trackingCode)
      .set({ lastUsedAt: new Date().toISOString() })
      .where(eq(trackingCode.trackingId, tracking.trackingId));

    const application = await db.query.ipApplication.findFirst({
      where: eq(ipApplication.id, tracking.ipApplicationId),
    });

    const phases = await db.query.applicationPhase.findMany({
      where: eq(applicationPhase.applicationId, tracking.ipApplicationId),
      with: {
        phaseTasks: true,
      },
      orderBy: applicationPhase.startDate,
    });

    const registryEntries = await db.query.formSubmissionRegistry.findMany({
      where: eq(formSubmissionRegistry.ipApplicationId, tracking.ipApplicationId),
      orderBy: [desc(formSubmissionRegistry.updatedAt)],
    });

    const activities = await db.query.activityLog.findMany({
      where: eq(activityLog.applicationId, tracking.ipApplicationId),
      with: {
        userAccount: {
          columns: { name: true },
        },
      },
      orderBy: [desc(activityLog.createdAt)],
      limit: 10,
    });

    return NextResponse.json({
      success: true,
      data: {
        application,
        phases,
        forms: registryEntries,
        activities,
      },
    });
  } catch (error) {
    console.error("[Tracking Verify] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify tracking details" },
      { status: 500 }
    );
  }
}
