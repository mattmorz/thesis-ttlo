import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db } from "@/drizzle/db";
import {
  phaseTask,
  applicationPhase,
  ipApplication,
} from "@/drizzle/migrations/schema";
import { ipApplicationEnrollment } from "@/drizzle/schema";
import { and, eq, inArray } from "drizzle-orm";

export const tasksRouter = createTRPCRouter({
  // Get tasks assigned to the current user
  getAssignedTasks: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        // Get all tasks where the user is assigned
        const tasks = await db.query.phaseTask.findMany({
          where: eq(phaseTask.assigneeId, input.userId),
          with: {
            applicationPhase: {
              with: {
                ipApplication: true,
              },
            },
          },
          orderBy: (tasks, { desc }) => [desc(tasks.dueDate)],
        });

        return tasks.map((task) => ({
          taskId: task.taskId,
          title: task.title,
          description: task.description,
          priority: task.priority,
          weight: task.weight,
          dueDate: task.dueDate,
          status: task.status,
          phase: {
            phaseId: task.applicationPhase.phaseId,
            title: task.applicationPhase.title,
            applicationId: task.applicationPhase.applicationId,
            application: {
              title: task.applicationPhase.ipApplication.title,
              ipType: task.applicationPhase.ipApplication.ipType,
            },
          },
        }));
      } catch (error) {
        console.error("Error getting assigned tasks:", error);
        throw new Error("Failed to get assigned tasks");
      }
    }),

  // Get all tasks from applications where the user is enrolled
  getAllEnrolledTasks: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        // First get all applications where the user is enrolled
        const enrollments = await db.query.ipApplicationEnrollment.findMany({
          where: eq(ipApplicationEnrollment.userId, input.userId),
          columns: {
            applicationId: true,
          },
        });

        const applicationIds = enrollments.map((e) => e.applicationId);

        if (applicationIds.length === 0) {
          return [];
        }

        // Get all phases for these applications
        const phases = await db.query.applicationPhase.findMany({
          where: inArray(applicationPhase.applicationId, applicationIds),
          columns: {
            phaseId: true,
          },
        });

        const phaseIds = phases.map((p) => p.phaseId);

        if (phaseIds.length === 0) {
          return [];
        }

        // Get all tasks for these phases
        const tasks = await db.query.phaseTask.findMany({
          where: inArray(phaseTask.phaseId, phaseIds),
          with: {
            applicationPhase: {
              with: {
                ipApplication: true,
              },
            },
          },
          orderBy: (tasks, { desc }) => [desc(tasks.dueDate)],
        });

        return tasks.map((task) => ({
          taskId: task.taskId,
          title: task.title,
          description: task.description,
          priority: task.priority,
          weight: task.weight,
          dueDate: task.dueDate,
          status: task.status,
          phase: {
            phaseId: task.applicationPhase.phaseId,
            title: task.applicationPhase.title,
            applicationId: task.applicationPhase.applicationId,
            application: {
              title: task.applicationPhase.ipApplication.title,
              ipType: task.applicationPhase.ipApplication.ipType,
            },
          },
        }));
      } catch (error) {
        console.error("Error getting enrolled tasks:", error);
        throw new Error("Failed to get enrolled tasks");
      }
    }),
});
