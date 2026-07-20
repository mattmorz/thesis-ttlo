import { router, publicProcedure, protectedProcedure } from "@/trpc/init";
import { z } from "zod";
import { db } from "@/drizzle/db";
import {
  ipApplication,
  userAccount,
} from "@/drizzle/migrations/schema";
import { ipApplicationEnrollment } from "@/drizzle/schema";
import { eq, and, inArray, notInArray, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Input schema for enrolling in an IP application
const enrollmentInputSchema = z.object({
  applicationId: z.string().uuid(),
  userId: z.string().uuid(),
});

// Input schema for fetching enrollments
const getEnrollmentsInputSchema = z.object({
  applicationId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
});

export const ipApplicationEnrollmentRouter = router({
  // Create a new enrollment
  enroll: protectedProcedure
    .input(enrollmentInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Check if the enrollment already exists
        const existingEnrollment = await db
          .select()
          .from(ipApplicationEnrollment)
          .where(
            and(
              eq(ipApplicationEnrollment.applicationId, input.applicationId),
              eq(ipApplicationEnrollment.userId, input.userId)
            )
          )
          .limit(1);

        if (existingEnrollment.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "User is already enrolled in this application",
          });
        }

        // Create new enrollment
        const newEnrollment = await db
          .insert(ipApplicationEnrollment)
          .values({
            applicationId: input.applicationId,
            userId: input.userId,
          })
          .returning();

        console.log(
          `User ${input.userId} enrolled in application ${input.applicationId}`
        );
        return newEnrollment[0];
      } catch (error) {
        console.error("Error enrolling user:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to enroll in application",
        });
      }
    }),

  // Get enrollments with optional filters
  getEnrollments: protectedProcedure
    .input(getEnrollmentsInputSchema)
    .query(async ({ input }) => {
      let query = db
        .select({
          enrollment: ipApplicationEnrollment,
          application: {
            id: ipApplication.id,
            title: ipApplication.title,
            ipType: ipApplication.ipType,
            status: ipApplication.status,
          },
          user: {
            id: userAccount.id,
            name: userAccount.name,
            email: userAccount.email,
            role: userAccount.role,
          },
        })
        .from(ipApplicationEnrollment)
        .innerJoin(
          ipApplication,
          eq(ipApplicationEnrollment.applicationId, ipApplication.id)
        )
        .innerJoin(
          userAccount,
          eq(ipApplicationEnrollment.userId, userAccount.id)
        )
        .orderBy(desc(ipApplicationEnrollment.createdAt));

      // Apply filters if provided
      if (input.applicationId) {
        return query.where(
          eq(ipApplicationEnrollment.applicationId, input.applicationId)
        );
      }

      if (input.userId) {
        if (input.applicationId) {
          return query.where(
            and(
              eq(ipApplicationEnrollment.applicationId, input.applicationId),
              eq(ipApplicationEnrollment.userId, input.userId)
            )
          );
        }
        return query.where(eq(ipApplicationEnrollment.userId, input.userId));
      }

      return query;
    }),

  // Get all enrollments (for admin dashboard)
  getAllEnrollments: protectedProcedure.query(async () => {
    const allEnrollments = await db.select().from(ipApplicationEnrollment);

    return allEnrollments;
  }),

  // Unenroll from an application
  unenroll: protectedProcedure
    .input(enrollmentInputSchema)
    .mutation(async ({ input }) => {
      try {
        const deleted = await db
          .delete(ipApplicationEnrollment)
          .where(
            and(
              eq(ipApplicationEnrollment.applicationId, input.applicationId),
              eq(ipApplicationEnrollment.userId, input.userId)
            )
          )
          .returning();

        if (deleted.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Enrollment not found",
          });
        }

        console.log(
          `User ${input.userId} unenrolled from application ${input.applicationId}`
        );
        return deleted[0];
      } catch (error) {
        console.error("Error unenrolling user:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to unenroll from application",
        });
      }
    }),

  // Get available applications for enrollment
  getAvailableApplications: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        limit: z.number().min(1).max(50).default(10),
        status: z
          .array(
            z.enum([
              "draft",
              "pending",
              "in_progress",
              "approved",
              "rejected",
              "completed",
            ])
          )
          .optional(),
      })
    )
    .query(async ({ input }) => {
      // Fetch only the IDs this user is already enrolled in
      const enrolledApplications = await db
        .select({ applicationId: ipApplicationEnrollment.applicationId })
        .from(ipApplicationEnrollment)
        .where(eq(ipApplicationEnrollment.userId, input.userId));

      const enrolledIds = enrolledApplications.map(
        (enroll) => enroll.applicationId
      );

      // Build SQL-level WHERE conditions
      const conditions = [];

      // Exclude already-enrolled applications at the database level
      if (enrolledIds.length > 0) {
        conditions.push(notInArray(ipApplication.id, enrolledIds));
      }

      // Apply status filter at the database level
      if (input.status && input.status.length > 0) {
        conditions.push(inArray(ipApplication.status, input.status));
      }

      // Single query: filter and paginate entirely in SQL
      const availableApplications = await db
        .select({
          id: ipApplication.id,
          title: ipApplication.title,
          description: ipApplication.description,
          ipType: ipApplication.ipType,
          status: ipApplication.status,
          progress: ipApplication.progress,
          createdAt: ipApplication.createdAt,
          updatedAt: ipApplication.updatedAt,
        })
        .from(ipApplication)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(ipApplication.createdAt))
        .limit(input.limit);

      return availableApplications;
    }),
});
