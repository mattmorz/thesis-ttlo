import { auth } from "@/auth";
import { db } from "@/drizzle/db";
import {
  applicationPhase,
  documents,
  documentsValidation,
  userAccount,
} from "@/drizzle/migrations/schema";
import { archives, ipApplicationEnrollment } from "@/drizzle/schema";
import { protectedProcedure, router } from "@/trpc/init";
import { eq, and } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

const dtzApplicationPhaseSchema = createInsertSchema(applicationPhase);

export const projectsRouter = router({
  get: protectedProcedure.query(async () => {
    const res = await db.query.ipApplication.findMany({
      columns: {
        id: true,
        title: true,
        description: true,
        ipType: true,
        status: true,
      },
      where: (ipApplication, { eq, not, exists }) => {
        // run subquery to filter out archived applications
        const archiveExists = exists(
          db
            .select()
            .from(archives)
            .where(eq(archives.applicationId, ipApplication.id))
        );
        return not(archiveExists);
      },
      with: {
        applicationPhases: {
          columns: {},
          with: {
            phaseTasks: {
              columns: {
                taskId: true,
                status: true,
              },
            },
          },
        },
        ipApplicationEnrollments: {
          with: {
            userAccount: { columns: { id: true, name: true, image: true } },
          },
        },
      },
    });
    console.log(res);
    return res;
  }),
  enrollProject: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input }) => {
      if (ctx.session?.user?.id && input) {
        const res = await db.insert(ipApplicationEnrollment).values({
          applicationId: input,
          userId: ctx.session.user.id,
        });
        console.log("HELP", res);
        return res;
      } else throw new Error("Invalid Request");
    }),

  assignStaff: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        staffId: z.string().uuid(),
        role: z.enum(["project_manager", "reviewer"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session?.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can assign staff to projects",
        });
      }

      try {
        const staffMember = await db
          .select()
          .from(userAccount)
          .where(eq(userAccount.id, input.staffId))
          .limit(1);

        if (staffMember.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Staff member not found",
          });
        }

        const existingEnrollment = await db
          .select()
          .from(ipApplicationEnrollment)
          .where(
            and(
              eq(ipApplicationEnrollment.applicationId, input.projectId),
              eq(ipApplicationEnrollment.userId, input.staffId)
            )
          )
          .limit(1);

        if (existingEnrollment.length > 0) {
          const updated = await db
            .update(ipApplicationEnrollment)
            .set({ role: input.role })
            .where(
              and(
                eq(ipApplicationEnrollment.applicationId, input.projectId),
                eq(ipApplicationEnrollment.userId, input.staffId)
              )
            )
            .returning();

          console.log(
            `Updated role for staff ${input.staffId} in project ${input.projectId} to ${input.role}`
          );
          return updated[0];
        }

        const result = await db
          .insert(ipApplicationEnrollment)
          .values({
            applicationId: input.projectId,
            userId: input.staffId,
            role: input.role,
          })
          .returning();

        console.log(
          `Assigned staff ${input.staffId} to project ${input.projectId} with role ${input.role}`
        );
        return result[0];
      } catch (error) {
        console.error("Error assigning staff:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to assign staff to project",
        });
      }
    }),

  addPhase: protectedProcedure
    .input(dtzApplicationPhaseSchema)
    .mutation(async ({ input }) => {
      const res = await db.insert(applicationPhase).values(input);
      return res;
    }),

  getDocuments: protectedProcedure
    .input(z.string().uuid())
    .query(async ({ input }) => {
      return await db.query.documents.findMany({
        where: (documents, { eq }) => eq(documents.applicationId, input),
        with: {
          userAccount: { columns: { name: true } },
          documentsValidations: {
            with: {
              userAccount: { columns: { name: true } },
            },
          },
        },
      });
    }),
  uploadDocument: protectedProcedure
    .input(
      z.object({
        applicationId: z.string().uuid(),
        title: z.string().min(1),
        type: z.string(),
        description: z.string().optional(),
        category: z.enum(["forms", "attachments", "requirements"]),
        fileName: z.string(),
        fileSize: z.number(),
        fileType: z.string(),
        requires_validation: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      const session = await auth();

      const formatInsert = {
        applicationId: input.applicationId,
        title: input.title,
        fileName: input.fileName,
        fileSize: input.fileSize,
        fileType: input.fileType,
        category: input.category,
        uploadedBy: session?.user?.id ?? "",
        requiresValidation: input.requires_validation,
        description: input.description,
        type: input.type,
      } satisfies typeof documents.$inferInsert;
      const res = await db.insert(documents).values(formatInsert);

      return res;
    }),
  validateDocument: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        remarks: z.string(),
        fileName: z.string(),
        fileSize: z.number(),
        fileType: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const session = await auth();

      const formatInsert = {
        validationStatus: "approved",
        validationRemarks: input.remarks,
        validatedBy: session?.user?.id ?? "",
        validatedAt: new Date().toISOString(),
        fileName: input.fileName,
        fileSize: input.fileSize,
        fileType: input.fileType,
      } satisfies Partial<typeof documentsValidation.$inferInsert>;
      const res = await db
        .update(documentsValidation)
        .set(formatInsert)
        .where(eq(documentsValidation.id, input.id))
        .returning({ id: documentsValidation.id });
      if (res.length === 0) {
        throw new Error("No rows affected.");
      }
    }),
  rejectValidationDocument: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const res = await db
        .update(documentsValidation)
        .set({ validatedBy: userId, validationStatus: "rejected" })
        .where(eq(documentsValidation.id, input))
        .returning({ id: documentsValidation.id });
      if (res.length === 0) {
        throw new Error("No rows affected.");
      }
    }),
});
