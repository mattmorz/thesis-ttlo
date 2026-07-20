import { protectedProcedure, router } from "@/trpc/init";
import { z } from "zod";
import { and, desc, eq, sql, notInArray } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
  activityLog,
  applicationPhase,
  ipApplication,
  phaseTask,
  userAccount,
} from "@/drizzle/migrations/schema";
import { ipApplicationEnrollment } from "@/drizzle/schema";

export const applicationRouter = router({
  // Get application details
  getApplicationDetails: protectedProcedure
    .input(
      z.object({
        applicationId: z.string().uuid(),
      })
    )
    .query(async ({ input }) => {
      const { applicationId } = input;

      const application = await db.query.ipApplication.findFirst({
        where: eq(ipApplication.id, applicationId),
      });

      return application;
    }),

  // Get application phases
  getApplicationPhases: protectedProcedure
    .input(
      z.object({
        applicationId: z.string().uuid(),
      })
    )
    .query(async ({ input }) => {
      const { applicationId } = input;

      const phases = await db.query.applicationPhase.findMany({
        where: eq(applicationPhase.applicationId, applicationId),
        with: {
          phaseTasks: true,
        },
        orderBy: applicationPhase.startDate,
      });

      return phases;
    }),

  // Get activity logs
  getActivityLogs: protectedProcedure
    .input(
      z.object({
        applicationId: z.string().uuid(),
      })
    )
    .query(async ({ input }) => {
      const { applicationId } = input;

      const logs = await db.query.activityLog.findMany({
        where: eq(activityLog.applicationId, applicationId),
        with: {
          userAccount: {
            columns: {
              name: true,
            },
          },
        },
        orderBy: [desc(activityLog.createdAt)],
        limit: 10,
      });

      return logs;
    }),

  // Get phase tasks
  getPhaseTasks: protectedProcedure
    .input(
      z.object({
        phaseId: z.string().uuid(),
      })
    )
    .query(async ({ input }) => {
      const { phaseId } = input;

      const tasks = await db.query.phaseTask.findMany({
        where: eq(phaseTask.phaseId, phaseId),
        orderBy: [
          // Order by status (completed last), then by priority (high first), then by due date
          desc(eq(phaseTask.status, "completed")),
          desc(eq(phaseTask.priority, "high")),
          phaseTask.dueDate,
        ],
      });

      return tasks;
    }),

  // Get all applications for dashboard stats
  getAllApplications: protectedProcedure.query(async () => {
    const res = await db.select({ count: sql<number>`count(*)` }).from(ipApplication);
    return res;
  }),

  // Get unassigned applications
  getUnassignedApplications: protectedProcedure.query(async () => {
    // Get all application IDs that have enrollments
    const enrolledApplications = await db
      .select({ id: ipApplicationEnrollment.applicationId })
      .from(ipApplicationEnrollment);

    // Extract the IDs into an array
    const enrolledIds = enrolledApplications.map((app) => app.id);

    // Find applications that don't have enrollments
    if (enrolledIds.length === 0) {
      // If no enrollments exist, return all applications
      return db.select({ count: sql<number>`count(*)` }).from(ipApplication);
    } else {
      // Otherwise, use the SQL not-in query to filter
      return db
        .select({ count: sql<number>`count(*)` })
        .from(ipApplication)
        .where(notInArray(ipApplication.id, enrolledIds));
    }
  }),

  // Get application status statistics
  getApplicationStatusStats: protectedProcedure.query(async () => {
    // Use proper count queries for each status
    const [draft, pending, inProgress, approved, rejected, completed] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(ipApplication).where(eq(ipApplication.status, "draft")),
      db.select({ count: sql<number>`count(*)` }).from(ipApplication).where(eq(ipApplication.status, "pending")),
      db.select({ count: sql<number>`count(*)` }).from(ipApplication).where(eq(ipApplication.status, "in_progress")),
      db.select({ count: sql<number>`count(*)` }).from(ipApplication).where(eq(ipApplication.status, "approved")),
      db.select({ count: sql<number>`count(*)` }).from(ipApplication).where(eq(ipApplication.status, "rejected")),
      db.select({ count: sql<number>`count(*)` }).from(ipApplication).where(eq(ipApplication.status, "completed")),
    ]);

    return {
      draft: Number(draft[0]?.count || 0),
      pending: Number(pending[0]?.count || 0),
      inProgress: Number(inProgress[0]?.count || 0),
      approved: Number(approved[0]?.count || 0),
      rejected: Number(rejected[0]?.count || 0),
      completed: Number(completed[0]?.count || 0),
    };
  }),

  // Get application type statistics
  getApplicationTypeStats: protectedProcedure.query(async () => {
    // Use proper count queries for each type
    const [patent, copyright, trademark, utilityModel] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(ipApplication).where(eq(ipApplication.ipType, "patent")),
      db.select({ count: sql<number>`count(*)` }).from(ipApplication).where(eq(ipApplication.ipType, "copyright")),
      db.select({ count: sql<number>`count(*)` }).from(ipApplication).where(eq(ipApplication.ipType, "trademark")),
      db.select({ count: sql<number>`count(*)` }).from(ipApplication).where(eq(ipApplication.ipType, "utility_model")),
    ]);

    return {
      patent: Number(patent[0]?.count || 0),
      copyright: Number(copyright[0]?.count || 0),
      trademark: Number(trademark[0]?.count || 0),
      utilityModel: Number(utilityModel[0]?.count || 0),
    };
  }),
});
