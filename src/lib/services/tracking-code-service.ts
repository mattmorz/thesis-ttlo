import { db } from "@/drizzle/db";
import { trackingCode, userAccount } from "@/drizzle/migrations/schema";
import { and, eq, isNull } from "drizzle-orm";
import {
  generateTrackingCode,
  hashValue,
  normalizeTrackingCode,
} from "@/lib/tracking-utils";

export async function ensureTrackingCodeForApplication(
  applicationId: string,
  userId: string
) {
  const existing = await db.query.trackingCode.findFirst({
    where: and(
      eq(trackingCode.ipApplicationId, applicationId),
      isNull(trackingCode.revokedAt)
    ),
  });

  if (existing) {
    return { created: false, code: null };
  }

  const user = await db.query.userAccount.findFirst({
    where: eq(userAccount.id, userId),
    columns: { email: true, phoneNumber: true },
  });

  if (!user?.email) {
    throw new Error("User email not found for tracking code creation");
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const rawCode = generateTrackingCode();
    const codeHash = hashValue(normalizeTrackingCode(rawCode));

    const collision = await db.query.trackingCode.findFirst({
      where: eq(trackingCode.codeHash, codeHash),
      columns: { trackingId: true },
    });

    if (collision) {
      continue;
    }

    await db.insert(trackingCode).values({
      ipApplicationId: applicationId,
      userId,
      code: rawCode,
      codeHash,
      email: user.email,
      phoneNumber: user.phoneNumber || null,
    });

    return { created: true, code: rawCode };
  }

  throw new Error("Failed to generate a unique tracking code");
}
