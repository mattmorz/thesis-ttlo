"use server";

import { db } from "@/drizzle/db";
import {
  ipApplication,
  ipApplicationEnrollment,
  userAccount,
} from "@/drizzle/migrations/schema";
import { eq, count, and, ne, gt, lt, sql, isNull, gte } from "drizzle-orm";

export type InventoryStatsData = {
  totalProjects: number;
  unassignedProjects: number;
  completedProjects: number;
  pendingReviews: number;
};

export async function getInventoryStats(): Promise<InventoryStatsData> {
  try {
    // Get total projects
    const totalResult = await db.select({ count: count() }).from(ipApplication);

    // Get unassigned projects
    const unassignedResult = await db
      .select({ count: count() })
      .from(ipApplication)
      .leftJoin(
        ipApplicationEnrollment,
        eq(ipApplication.id, ipApplicationEnrollment.applicationId)
      )
      .where(isNull(ipApplicationEnrollment.enrollmentId));

    // Get completed projects
    const completedResult = await db
      .select({ count: count() })
      .from(ipApplication)
      .where(eq(ipApplication.status, "completed"));

    // Get projects requiring review (pending status)
    const pendingResult = await db
      .select({ count: count() })
      .from(ipApplication)
      .where(eq(ipApplication.status, "pending"));

    return {
      totalProjects: totalResult[0]?.count || 0,
      unassignedProjects: unassignedResult[0]?.count || 0,
      completedProjects: completedResult[0]?.count || 0,
      pendingReviews: pendingResult[0]?.count || 0,
    };
  } catch (error) {
    console.error("Error fetching inventory stats:", error);
    // Return default values in case of error
    return {
      totalProjects: 0,
      unassignedProjects: 0,
      completedProjects: 0,
      pendingReviews: 0,
    };
  }
}
