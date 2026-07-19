import { db } from "@/drizzle/db";
import { edge } from "@/drizzle/edge";
import {
  applicationPhase,
  archives,
  externalCollaboration,
  internalValidation,
  internalValidationAssignee,
  phaseTask,
  phaseReminder,
  phaseTaskAssignee,
} from "@/drizzle/migrations/schema";
import { protectedProcedure, publicProcedure, router } from "@/trpc/init";
import { and, eq, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const dtzApplicationPhaseSchema = createInsertSchema(applicationPhase);
const dtzPhaseTaskSchema = createInsertSchema(phaseTask).partial();
const dtzPhaseReminderSchema = createInsertSchema(phaseReminder);
const dtzInternalValidationSchema = createInsertSchema(internalValidation);
const dtzExternalCollaborationSchema = createInsertSchema(
  externalCollaboration
);

const phaseTaskTypeSchema = dtzPhaseTaskSchema.extend({
  status: z.enum(["pending", "in_progress", "completed", "blocked"]),
  priority: z.enum(["low", "medium", "high"]),
  assignedTo: z.array(z.string()), // Ensure `assignedTo` is always an array
  dueDate: z.string().optional(), // Ensure `dueDate` is optional but a string
});

export type ApplicationPhaseSchema = z.infer<typeof dtzApplicationPhaseSchema>;
export type PhaseTaskSchema = z.infer<typeof dtzPhaseTaskSchema>;
export type InternalValidationSchema = z.infer<
  typeof dtzInternalValidationSchema
>;
export type ExternalCollaborationSchema = z.infer<
  typeof dtzExternalCollaborationSchema
>;

export const clientProjectDashboardRouter = router({
  get: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      const res = await db.query.ipApplication.findFirst({
        where: (ipApplication, { eq }) => eq(ipApplication.id, input.projectId),
        with: {
          archives: true,
          applicationPhases: {
            with: {
              phaseTasks: {
                with: {
                  phaseTaskAssignees: true,
                },
              },
              phaseReminders: true,
            },
          },
        },
      });
      console.log(res);
      return res;
    }),
  updatePhase: protectedProcedure
    .input(
      z.object({
        phaseId: z.string().uuid(),
        tasks: z.array(phaseTaskTypeSchema),
      })
    )
    .mutation(async ({ input }) => {
      // const {
      //   applicationPhaseInput,
      //   phaseTasksInput = [],
      //   internalValidationInput,
      //   externalCollaborationInput,
      // } = input;

      const { phaseId, tasks } = input;

      console.log(input);

      const res = await edge.transaction(async (tx) => {
        const existingTasks = await tx.query.phaseTask.findMany({
          where: eq(phaseTask.phaseId, phaseId),
        });
        const taskIdsToKeep = tasks.map((task) => task.taskId);
        const taskIdsToDelete = existingTasks
          .filter((task) => !taskIdsToKeep.includes(task.taskId))
          .map((task) => task.taskId);

        // console.log(existingTasks, "\n", taskIdsToKeep, "\n", taskIdsToDelete);

        if (taskIdsToDelete.length > 0) {
          await tx
            .delete(phaseTask)
            .where(sql`${phaseTask.taskId} IN (${taskIdsToDelete.join(",")})`);
        }

        if (tasks.length > 0) {
          // Ensure all tasks have the correct phaseId
          const tasksWithPhaseId = tasks.map((task) => ({
            ...task,
            phaseId,
            weight: 0,
            assigneeId: null,
          }));

          await tx
            .insert(phaseTask)
            .values(
              tasksWithPhaseId as unknown as (typeof phaseTask.$inferInsert)[]
            )
            .onConflictDoUpdate({
              target: phaseTask.taskId,
              set: {
                title: sql`EXCLUDED."title"`,
                description: sql`EXCLUDED."description"`,
                priority: sql`EXCLUDED."priority"`,
                status: sql`EXCLUDED."status"`,
                weight: sql`EXCLUDED."weight"`, // Make sure weight is updated too
              },
            });
        }
      });

      return res;
    }),

  addUpdatePhase: protectedProcedure
    .input(
      z.object({
        phaseId: z.string().uuid(),
        applicationId: z.string().uuid(),
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        status: z.enum(["pending", "active", "completed", "blocked"]),
        startDate: z.string().min(1, {
          message: "Start date is required",
        }),
        endDate: z.string().min(1, {
          message: "End date is required",
        }),
        reminderType: z.string().optional(),
        reminderDay: z.string().optional(),
        reminderTime: z
          .string()
          .regex(
            /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
            "Please enter a valid time in HH:mm format"
          )
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (!input.phaseId) {
        throw new Error("Phase ID is required.");
      }
      const formatInsert = {
        phaseId: input.phaseId,
        applicationId: input.applicationId,
        title: input.title,
        description: input.description,
        status: input.status,
        startDate: input.startDate,
        endDate: input.endDate,
        orderIndex: 0,
      };
      const res = await db
        .insert(applicationPhase)
        .values(formatInsert as typeof applicationPhase.$inferInsert)
        .onConflictDoUpdate({
          target: applicationPhase.phaseId,
          set: {
            title: sql`EXCLUDED.title`,
            applicationId: sql`EXCLUDED.application_id`,
            description: sql`EXCLUDED.description`,
            status: sql`EXCLUDED.status`,
            startDate: sql`EXCLUDED.start_date`,
            endDate: sql`EXCLUDED.end_date`,
          },
        });
      const formatInsertPhaseReminder = {
        phaseId: input.phaseId,
        reminderType: input.reminderType,
        reminderDay: input.reminderDay,
        reminderTime: input.reminderTime,
      };
      const phaseReminderRes = await db
        .insert(phaseReminder)
        .values(formatInsertPhaseReminder as typeof phaseReminder.$inferInsert)
        .onConflictDoUpdate({
          target: phaseReminder.phaseId,
          set: {
            reminderType: sql`EXCLUDED.reminder_type`,
            reminderDay: sql`EXCLUDED.reminder_day`,
            reminderTime: sql`EXCLUDED.reminder_time`,
          },
        })
        .returning();
      return res;
    }),

  addUpdateDeletePhaseTask: protectedProcedure
    .input(
      z.object({
        phaseId: z.string().uuid(),
        added: z.array(
          z.object({
            taskId: z.string().uuid(),
            title: z.string().min(1, { message: "Title is required" }),
            description: z.string().min(1, "Description is required"),
            priority: z.string().min(1, "Priority is required"),
            status: z.string().min(1, { message: "Status is required" }),
            dueDate: z.string().min(1, { message: "Due date is required" }),
            assignedToMe: z.boolean().optional(),
          })
        ),
        modified: z.array(
          z.object({
            taskId: z.string().uuid(),
            title: z.string().min(1, { message: "Title is required" }),
            description: z.string().min(1, "Description is required"),
            priority: z.string().min(1, "Priority is required"),
            status: z.string().min(1, { message: "Status is required" }),
            dueDate: z.string().min(1, { message: "Due date is required" }),
            assignedToMe: z.boolean().optional(),
          })
        ),
        deleted: z.array(z.string().uuid()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id as string;

      const res = await db.transaction(async (tx) => {
        // Handle deletions first
        if (input.deleted.length > 0) {
          await tx.delete(phaseTask).where(
            sql`${phaseTask.taskId} IN (${sql.join(
              input.deleted.map((id) => sql`${id}`),
              ","
            )})`
          );
        }

        // Handle added items
        const addedTasks = await Promise.all(
          input.added.map(async (item) => {
            const validation = await tx
              .insert(phaseTask)
              .values({
                taskId: item.taskId,
                title: item.title,
                description: item.description,
                priority: item.priority,
                status: item.status,
                dueDate: item.dueDate,
                phaseId: input.phaseId,
                weight: 0,
              } as typeof phaseTask.$inferInsert)
              .returning();

            if (item.assignedToMe) {
              await tx
                .insert(phaseTaskAssignee)
                .values({
                  taskId: item.taskId,
                  userId,
                })
                .onConflictDoNothing();
            } else {
              await tx
                .delete(phaseTaskAssignee)
                .where(
                  and(
                    eq(phaseTaskAssignee.taskId, item.taskId),
                    eq(phaseTaskAssignee.userId, userId)
                  )
                );
            }

            return validation[0];
          })
        );

        // Handle modified items
        const modifiedTasks = await Promise.all(
          input.modified.map(async (item) => {
            const validation = await tx
              .update(phaseTask)
              .set({
                taskId: item.taskId,
                title: item.title,
                description: item.description,
                priority: item.priority,
                status: item.status,
                dueDate: item.dueDate,
                phaseId: input.phaseId,
                weight: 0,
              })
              .where(eq(phaseTask.taskId, item.taskId))
              .returning();

            if (item.assignedToMe) {
              await tx
                .insert(phaseTaskAssignee)
                .values({
                  taskId: item.taskId,
                  userId,
                })
                .onConflictDoNothing();
            } else {
              await tx
                .delete(phaseTaskAssignee)
                .where(
                  and(
                    eq(phaseTaskAssignee.taskId, item.taskId),
                    eq(phaseTaskAssignee.userId, userId)
                  )
                );
            }

            return validation[0];
          })
        );

        return {
          added: addedTasks,
          modified: modifiedTasks,
        };
      });

      return res;
    }),

  getInternalValidations: protectedProcedure
    .input(z.string().uuid())
    .query(async ({ input }) => {
      const res = await db.query.internalValidation.findMany({
        where: (internalValidation, { eq }) =>
          eq(internalValidation.phaseId, input),
        columns: {
          validationId: true,
          validatorRole: true,
          title: true,
          status: true,
          dueDate: true,
          remarks: true,
          fileName: true,
          fileType: true,
          fileSize: true,
        },
        with: {
          internalValidationAssignees: {
            columns: {
              userId: true,
            },
          },
        },
      });
      return res;
    }),
  addUpdateDeleteInternalValidation: protectedProcedure
    .input(
      z.object({
        phaseId: z.string().uuid(),
        added: z.union([
          z.array(
            z.object({
              validationId: z.string().uuid(),
              validatorRole: z.string(),
              status: z.string(),
              title: z.string(),
              assignedToMe: z.boolean(),
              dueDate: z.string().optional(),
              remarks: z.string().optional(),
              fileName: z.string().optional(),
              fileType: z.string().optional(),
              fileSize: z.number().optional(),
            })
          ),
          z.tuple([]),
        ]),
        modified: z.union([
          z.array(
            z.object({
              validationId: z.string().uuid(),
              status: z.string(),
              title: z.string(),
              validatorRole: z.string(),
              assignedToMe: z.boolean(),
              dueDate: z.string().optional(),
              remarks: z.string().optional(),
              fileName: z.string().optional(),
              fileType: z.string().optional(),
              fileSize: z.number().optional(),
            })
          ),
          z.tuple([]),
        ]),
        deleted: z.union([z.array(z.string().uuid()), z.tuple([])]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const res = await db.transaction(async (tx) => {
        // Handle deletions first
        if (input.deleted.length > 0) {
          await tx.delete(internalValidation).where(
            sql`${internalValidation.validationId} IN (${sql.join(
              input.deleted.map((id) => sql`${id}`),
              ","
            )})`
          );
        }

        // Handle added items
        const addedValidations = await Promise.all(
          input.added.map(async (item) => {
            const validation = await tx
              .insert(internalValidation)
              .values({
                phaseId: input.phaseId,
                title: item.title,
                status: item.status,
                validatorRole: item.validatorRole,
                dueDate: item.dueDate,
                remarks: item.remarks,
                fileName: item.fileName,
                fileType: item.fileType,
                fileSize: item.fileSize,
              } as typeof internalValidation.$inferInsert)
              .returning();

            if (item.assignedToMe) {
              await tx.insert(internalValidationAssignee).values({
                internalValidationId: validation[0].validationId,
                userId,
              });
            }

            return validation[0];
          })
        );

        // Handle modified items
        const modifiedValidations = await Promise.all(
          input.modified.map(async (item) => {
            const validation = await tx
              .update(internalValidation)
              .set({
                phaseId: input.phaseId,
                title: item.title,
                status: item.status,
                validatorRole: item.validatorRole,
                dueDate: item.dueDate,
                remarks: item.remarks,
                fileName: item.fileName,
                fileType: item.fileType,
                fileSize: item.fileSize,
              })
              .where(eq(internalValidation.validationId, item.validationId))
              .returning();

            if (item.assignedToMe) {
              await tx
                .insert(internalValidationAssignee)
                .values({
                  internalValidationId: item.validationId,
                  userId,
                })
                .onConflictDoNothing();
            } else {
              await tx
                .delete(internalValidationAssignee)
                .where(
                  and(
                    eq(
                      internalValidationAssignee.internalValidationId,
                      item.validationId
                    ),
                    eq(internalValidationAssignee.userId, userId as string)
                  )
                );
            }

            return validation[0];
          })
        );

        return {
          added: addedValidations,
          modified: modifiedValidations,
        };
      });

      return res;
    }),
  getExternalCollaborations: protectedProcedure
    .input(z.string().uuid())
    .query(async ({ input }) => {
      const res = await db.query.externalCollaboration.findMany({
        where: (externalCollaboration, { eq }) =>
          eq(externalCollaboration.phaseId, input),
      });
      return res;
    }),
  addUpdateDeleteExternalCollaboration: protectedProcedure
    .input(
      z.object({
        phaseId: z.string().uuid(),
        added: z
          .array(
            z.object({
              collaborationId: z.string().uuid(),
              task: z.string(),
              officeName: z.string(),
              contactPerson: z.string(),
              status: z.string(),
              dueDate: z.string(),
              description: z.string().optional(),
              remarks: z.string().optional(),
              fileName: z.string().optional(),
              fileType: z.string().optional(),
              fileSize: z.number().optional(),
              responseRequired: z.boolean().optional(),
              reminderType: z.string().optional(),
              reminderDay: z.string().optional(),
              reminderTime: z.string().optional(),
            })
          )
          .default([]),
        modified: z
          .array(
            z.object({
              collaborationId: z.string().uuid(),
              task: z.string(),
              officeName: z.string(),
              contactPerson: z.string(),
              status: z.string(),
              dueDate: z.string(),
              description: z.string().optional(),
              remarks: z.string().optional(),
              fileName: z.string().optional(),
              fileType: z.string().optional(),
              fileSize: z.number().optional(),
              responseRequired: z.boolean().optional(),
              reminderType: z.string().optional(),
              reminderDay: z.string().optional(),
              reminderTime: z.string().optional(),
            })
          )
          .default([]),
        deleted: z.array(z.string().uuid()).default([]),
      })
    )
    .mutation(async ({ input }) => {
      const res = await db.transaction(async (tx) => {
        // Handle deletions
        if (input.deleted.length > 0) {
          await tx.delete(externalCollaboration).where(
            sql`${externalCollaboration.collaborationId} IN (${sql.join(
              input.deleted.map((id) => sql`${id}`),
              sql`, `
            )})`
          );
        }

        // Handle added items
        if (input.added.length > 0) {
          await tx.insert(externalCollaboration).values(
            input.added.map((item) => ({
              ...item,
              phaseId: input.phaseId,
            }))
          );
        }

        // Handle modified items
        if (input.modified.length > 0) {
          for (const item of input.modified) {
            await tx
              .update(externalCollaboration)
              .set({
                ...item,
                phaseId: input.phaseId,
              })
              .where(
                eq(externalCollaboration.collaborationId, item.collaborationId)
              );
          }
          return {
            success: true,
          };
        }
      });

      return res;
    }),
});
