/**
 * This file contains the tRPC API definitions
 */
import { TRPCError, initTRPC } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import { type Session } from "next-auth";
import { ZodError } from "zod";
import superjson from "superjson";
import { auth } from "@/auth";

type CreateContextOptions = {
  req: Request;
  res?: Response;
};

/**
 * Context configuration for tRPC
 */
export const createTRPCContext = async (opts: CreateContextOptions) => {
  const session = await auth();

  // If no session found but there's an authorization header (for token-based auth)
  // This is a fallback for API routes where session might not be available
  const authHeader = opts.req.headers.get("authorization");

  if (!session && authHeader) {
    // Simple token-based authentication fallback
    // In a real app, you would validate the token properly
    return {
      session: {
        user: {
          id: "user1", // This is a fallback ID - in production you'd decode the token
        },
      },
      req: opts.req,
      res: opts.res,
    };
  }

  return {
    session,
    req: opts.req,
    res: opts.res,
  };
};

/**
 * tRPC initialization
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof Error ? error.cause : null,
      },
    };
  },
});

/**
 * Public procedure - Can be used without authentication
 */
export const publicProcedure = t.procedure;

/**
 * Router creator
 */
export const createTRPCRouter = t.router;

/**
 * Protected procedure - Requires authentication
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

/**
 * Helper router constructor
 */
export const router = t.router;
