import { NextRequest, NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { trackingCode, trackingOtp } from "@/drizzle/migrations/schema";
import { and, desc, eq, isNull } from "drizzle-orm";
import {
  generateOtp,
  hashValue,
  maskEmail,
  maskPhone,
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

    if (!rawCode || !channel || !identifierInput) {
      return NextResponse.json(
        { success: false, error: "Tracking code and destination required" },
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

    const recentOtp = await db.query.trackingOtp.findFirst({
      where: and(
        eq(trackingOtp.trackingId, tracking.trackingId),
        eq(trackingOtp.channel, channel),
        eq(trackingOtp.identifier, identifier)
      ),
      orderBy: [desc(trackingOtp.createdAt)],
    });

    if (recentOtp?.lastSentAt) {
      const lastSent = new Date(recentOtp.lastSentAt).getTime();
      if (Date.now() - lastSent < 60_000) {
        return NextResponse.json(
          { success: false, error: "Please wait before requesting a new OTP" },
          { status: 429 }
        );
      }
    }

    const otp = generateOtp();
    const otpHash = hashValue(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await db.insert(trackingOtp).values({
      trackingId: tracking.trackingId,
      channel,
      identifier,
      otpHash,
      expiresAt,
      attempts: 0,
      lastSentAt: new Date().toISOString(),
    });

    if (channel === "email") {
      console.log(`[Tracking OTP] Email OTP to ${identifier}: ${otp}`);
    } else {
      console.log(`[Tracking OTP] SMS OTP to ${identifier}: ${otp}`);
    }

    return NextResponse.json({
      success: true,
      data: {
        channel,
        destination:
          channel === "email" ? maskEmail(identifier) : maskPhone(identifier),
        ...(process.env.NODE_ENV !== "production" ? { otp } : {}),
      },
    });
  } catch (error) {
    console.error("[Tracking OTP] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}
