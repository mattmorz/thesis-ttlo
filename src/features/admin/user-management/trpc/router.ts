import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and, or, like, asc, desc, sql } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { userAccount } from "@/drizzle/migrations/schema";
import { router, protectedProcedure } from "@/trpc/init";

// Define role schema
const RoleEnum = z.enum(["admin", "ttlo_staff", "client"]);

// Define input schemas
const updateRoleSchema = z.object({
  userId: z.string().uuid(),
  role: RoleEnum,
});

const getUsersInputSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(["name", "email", "role", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  searchQuery: z.string().optional(),
  roleFilter: z.enum(["all", "admin", "ttlo_staff", "client"]).default("all"),
  isActive: z.boolean().optional(),
});

// Middleware to ensure the user is an admin
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  // Check if the user is authenticated and has admin role
  if (!ctx.session?.user || ctx.session.user.role !== "admin") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Only administrators can perform this action",
    });
  }
  return next();
});

// Middleware to ensure the user is admin or ttlo_staff
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

export const userManagementRouter = router({
  // Get all users with pagination and filtering - Allow both admin and ttlo_staff
  getUsers: staffProcedure
    .input(getUsersInputSchema)
    .query(async ({ ctx, input }) => {
      try {
        // Base query
        const query = db.select().from(userAccount);

        // Build where conditions
        const conditions = [];

        if (input.searchQuery) {
          const searchTerm = `%${input.searchQuery}%`;
          conditions.push(
            or(
              like(userAccount.name, searchTerm),
              like(userAccount.email, searchTerm)
            )
          );
        }

        if (input.roleFilter !== "all") {
          conditions.push(eq(userAccount.role, input.roleFilter));
        }

        if (input.isActive !== undefined) {
          conditions.push(eq(userAccount.isActive, input.isActive));
        }

        // Apply where conditions if any
        let finalQuery = query;
        if (conditions.length > 0) {
          finalQuery = query.where(and(...conditions));
        }

        // Get total count (without pagination)
        const countQuery = db
          .select({ count: sql<number>`count(*)` })
          .from(userAccount);
        if (conditions.length > 0) {
          countQuery.where(and(...conditions));
        }
        const totalCount = await countQuery;
        const total = Number(totalCount[0]?.count || 0);

        // Apply sorting
        if (input.sortBy === "name") {
          finalQuery =
            input.sortOrder === "asc"
              ? finalQuery.orderBy(asc(userAccount.name))
              : finalQuery.orderBy(desc(userAccount.name));
        } else if (input.sortBy === "email") {
          finalQuery =
            input.sortOrder === "asc"
              ? finalQuery.orderBy(asc(userAccount.email))
              : finalQuery.orderBy(desc(userAccount.email));
        } else if (input.sortBy === "role") {
          finalQuery =
            input.sortOrder === "asc"
              ? finalQuery.orderBy(asc(userAccount.role))
              : finalQuery.orderBy(desc(userAccount.role));
        } else if (input.sortBy === "createdAt") {
          finalQuery =
            input.sortOrder === "asc"
              ? finalQuery.orderBy(asc(userAccount.createdAt))
              : finalQuery.orderBy(desc(userAccount.createdAt));
        }

        // Apply pagination
        const offset = (input.page - 1) * input.limit;
        finalQuery = finalQuery.limit(input.limit).offset(offset);

        // Execute query
        const users = await finalQuery;

        return {
          users,
          pagination: {
            total,
            page: input.page,
            limit: input.limit,
            totalPages: Math.ceil(total / input.limit),
          },
        };
      } catch (error) {
        console.error("Error fetching users:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch users",
        });
      }
    }),

  // Update user role - Admin only
  updateUserRole: adminProcedure
    .input(updateRoleSchema)
    .mutation(async ({ ctx, input }) => {
      // Prevent admins from removing their own admin role
      if (
        ctx.session.user.id === input.userId &&
        ctx.session.user.role === "admin" &&
        input.role !== "admin"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot remove your own admin role",
        });
      }

      try {
        await db
          .update(userAccount)
          .set({
            role: input.role,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(userAccount.id, input.userId));

        return { success: true };
      } catch (error) {
        console.error("Error updating user role:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update user role",
        });
      }
    }),

  // Update user active status - Admin only
  updateUserStatus: adminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Prevent admins from deactivating themselves
      if (ctx.session.user.id === input.userId && input.isActive === false) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot deactivate your own account",
        });
      }

      try {
        await db
          .update(userAccount)
          .set({
            isActive: input.isActive,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(userAccount.id, input.userId));

        return { success: true };
      } catch (error) {
        console.error("Error updating user status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update user status",
        });
      }
    }),

  // User statistics - Allow both admin and ttlo_staff
  getUserStats: staffProcedure.query(async () => {
    const users = await db.query.userAccount.findMany();

    return {
      totalUsers: users.length,
      activeUsers: users.filter((user) => user.isActive).length,
      inactiveUsers: users.filter((user) => !user.isActive).length,
      adminUsers: users.filter((user) => user.role === "admin").length,
      staffUsers: users.filter((user) => user.role === "ttlo_staff").length,
      clientUsers: users.filter((user) => user.role === "client").length,
    };
  }),
});
