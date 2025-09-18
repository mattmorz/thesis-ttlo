import { db } from "@/drizzle/db";
import { protectedProcedure, router } from "@/trpc/init";
import { sql, eq } from "drizzle-orm";
import { calendarEvent } from "@/drizzle/migrations/schema";
import { z } from "zod";

export const calendarRouter = router({
  getEvents: protectedProcedure.query(async () => {
    const res = await db.query.calendarEvent.findMany();
    return res;
  }),
  createUpdateEvent: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string(),
        description: z.string().optional(),
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
        isAllDay: z.boolean().optional(),
        eventType: z.enum(["meeting", "phase", "task", "other"] as const),
        status: z.enum([
          "scheduled",
          "in-progress",
          "completed",
          "cancelled",
        ] as const),
        projectId: z
          .union([z.string().uuid(), z.literal("undefined")])
          .default("undefined")
          .optional(),
        otherEventType: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log(input);
      const userId = ctx.session.user.id;
      const formatInsert = {
        id: input.id,
        title: input.title,
        description: input.description,
        startDate: input.startDate.toString(),
        endDate: input.endDate.toString(),
        isAllDay: input.isAllDay,
        eventType: input.eventType,
        status: input.status,
        projectId: input.projectId === "undefined" ? null : input.projectId,
        otherEventType:
          input.otherEventType === undefined ? null : input.otherEventType,
        createdBy: userId,
      };
      const res = await db
        .insert(calendarEvent)
        .values(formatInsert as typeof calendarEvent.$inferInsert)
        .onConflictDoUpdate({
          target: calendarEvent.id,
          set: {
            title: sql`EXCLUDED.title`,
            description: sql`EXCLUDED.description`,
            startDate: sql`EXCLUDED.start_date`,
            endDate: sql`EXCLUDED.end_date`,
            isAllDay: sql`EXCLUDED.is_all_day`,
            eventType: sql`EXCLUDED.event_type`,
            status: sql`EXCLUDED.status`,
            createdBy: sql`EXCLUDED.created_by`,
            createdAt: sql`EXCLUDED.created_at`,
            updatedAt: sql`EXCLUDED.updated_at`,
            projectId: sql`EXCLUDED.project_id`,
            otherEventType: sql`EXCLUDED.other_event_type`,
          },
        })
        .returning({ id: calendarEvent.id });
      return res;
    }),
  deleteEvent: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ input }) => {
      if (!input) throw new Error("Event ID is required for deletion.");
      const res = await db
        .delete(calendarEvent)
        .where(eq(calendarEvent.id, input))
        .returning({ id: calendarEvent.id });
      return res;
    }),
});
