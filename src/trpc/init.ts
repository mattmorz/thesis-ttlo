import { TRPCError, initTRPC } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import { type Session } from "next-auth";
import superjson from "superjson";
import { auth } from "@/auth";
import { ZodError } from "zod";

type CreateContextOptions = {
  req: Request;
  res?: Response;
};

/**
 * Context configuration for tRPC
 */
export const createTRPCContext = async (opts: CreateContextOptions) => {
  // Get the session from next-auth
  const session = await auth();

  // Add more detailed logging for debugging
  console.log("Creating TRPC context with session:", {
    hasSession: !!session,
    userId: session?.user?.id,
    isAuthenticated: !!session?.user,
  });

  return {
    session,
    req: opts.req,
    res: opts.res,
  };
};

/**
 * tRPC initialization with better error handling
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    console.log("TRPC formatting error:", {
      message: error.message,
      code: error.code,
      hasZodError: error.cause instanceof ZodError,
    });

    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause : null,
      },
    };
  },
});

/**
 * Router creator
 */
export const router = t.router;
export const createTRPCRouter = t.router;

/**
 * Public procedure - Can be used without authentication
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure - Requires authentication
 * Now with more helpful error messages
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx?.session?.user?.id) {
    const errorCode = "UNAUTHORIZED";
    const errorMessage = !ctx.session
      ? "You must be logged in to perform this action"
      : "Session is invalid or expired";

    console.error(`Authentication error: ${errorMessage}`);

    throw new TRPCError({
      code: errorCode,
      message: errorMessage,
    });
  }

  return next({
    ctx: {
      ...ctx,
      // Provide a properly typed session
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});
