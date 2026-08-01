import { db } from "@/drizzle/db";
import { protectedProcedure, router } from "@/trpc/init";
import { sql, eq } from "drizzle-orm";
import { calendarEvent } from "@/drizzle/migrations/schema";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

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
      const userId = ctx.session.user.id;
      
      // Ensure the user has permission to update an existing event
      const existingEvent = await db
        .select({ createdBy: calendarEvent.createdBy })
        .from(calendarEvent)
        .where(eq(calendarEvent.eventId, input.id))
        .limit(1);

      if (existingEvent.length > 0) {
        const isStaff = ctx.session.user.role === "admin" || ctx.session.user.role === "ttlo_staff";
        if (existingEvent[0].createdBy !== userId && !isStaff) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only update events you created.",
          });
        }
      }

      const formatInsert = {
        eventId: input.id,
        title: input.title,
        description: input.description,
        startDate: input.startDate.toString(),
        endDate: input.endDate.toString(),
        eventType: input.eventType,
        status: input.status,
        applicationId: input.projectId === "undefined" ? null : input.projectId,
        otherEventType:
          input.otherEventType === undefined ? null : input.otherEventType,
        createdBy: userId, // On conflict update, we update the original creator or leave it?
      };
      const res = await db
        .insert(calendarEvent)
        .values(formatInsert as typeof calendarEvent.$inferInsert)
        .onConflictDoUpdate({
            target: calendarEvent.eventId,
            set: {
              title: sql`EXCLUDED.title`,
              description: sql`EXCLUDED.description`,
              startDate: sql`EXCLUDED.start_date`,
              endDate: sql`EXCLUDED.end_date`,
              eventType: sql`EXCLUDED.event_type`,
            status: sql`EXCLUDED.status`,
            updatedAt: sql`NOW()`,
            applicationId: sql`EXCLUDED.application_id`,
            otherEventType: sql`EXCLUDED.other_event_type`,
            // Omitted createdBy and createdAt from update so they don't get overwritten
          },
        })
        .returning({ id: calendarEvent.eventId });
      return res;
    }),
  deleteEvent: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ input, ctx }) => {
      if (!input) throw new Error("Event ID is required for deletion.");
      
      const userId = ctx.session.user.id;
      const isStaff = ctx.session.user.role === "admin" || ctx.session.user.role === "ttlo_staff";
      
      if (!isStaff) {
        const event = await db
          .select({ createdBy: calendarEvent.createdBy })
          .from(calendarEvent)
          .where(eq(calendarEvent.eventId, input))
          .limit(1);
          
        if (event.length > 0 && event[0].createdBy !== userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only delete events you created.",
          });
        }
      }

      const res = await db
        .delete(calendarEvent)
        .where(eq(calendarEvent.eventId, input))
        .returning({ id: calendarEvent.eventId });
      return res;
    }),
});
