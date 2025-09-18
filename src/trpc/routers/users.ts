import { router, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "@/drizzle/db";
import { userAccount } from "@/drizzle/migrations/schema";
import { eq, desc, or } from "drizzle-orm";

// Define middleware for admin or staff operations
const staffProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  // Check if the user is authenticated and has admin or ttlo_staff role
  if (
    !ctx.session?.user ||
    (ctx.session.user.role !== "admin" &&
      ctx.session.user.role !== "ttlo_staff")
  ) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Only staff members can access this information",
    });
  }
  return next();
});

export const usersRouter = router({
  // Get all users - admin and staff can see this
  getAll: staffProcedure.query(async ({ ctx }) => {
    try {
      const users = await db
        .select()
        .from(userAccount)
        .orderBy(desc(userAccount.createdAt));
      return users;
    } catch (error) {
      console.error("Error fetching all users:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch users",
      });
    }
  }),

  // Get a single user by ID
  getById: protectedProcedure
    .input(z.string().uuid())
    .query(async ({ input }) => {
      try {
        const user = await db
          .select()
          .from(userAccount)
          .where(eq(userAccount.id, input))
          .limit(1);

        if (user.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        return user[0];
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error fetching user by ID:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user",
        });
      }
    }),

  // Get all staff users (admin and ttlo_staff)
  getStaff: staffProcedure.query(async () => {
    try {
      const staffUsers = await db
        .select()
        .from(userAccount)
        .where(
          or(eq(userAccount.role, "admin"), eq(userAccount.role, "ttlo_staff"))
        )
        .orderBy(desc(userAccount.createdAt));

      return staffUsers;
    } catch (error) {
      console.error("Error fetching staff users:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch staff users",
      });
    }
  }),
});
