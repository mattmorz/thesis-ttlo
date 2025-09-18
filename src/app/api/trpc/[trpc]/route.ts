import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/trpc/router";
import { createTRPCContext } from "@/trpc/init";
import { ZodError } from "zod";
import superjson from "superjson";

export const dynamic = "force-dynamic";

// Helper to determine appropriate cache control headers
const getCacheControl = (path: string) => {
  // Check if this is a session-related endpoint
  if (path.includes("session")) {
    // Cache auth session for a short time (5 seconds)
    return "public, max-age=5, stale-while-revalidate=30";
  }

  // For other endpoints, use a modest cache
  return "public, max-age=10, stale-while-revalidate=60";
};

const handler = async (req: Request) => {
  const isDev = process.env.NODE_ENV === "development";

  // Only log in development mode
  if (isDev) {
    console.log("TRPC API route hit:", req.url);
  }

  try {
    // Parse URL for use in multiple places
    const url = new URL(req.url);
    const path = url.pathname;
    const isGet = req.method === "GET";

    // Only log detailed request info in development
    if (isDev) {
      const inputData = isGet
        ? Object.fromEntries(url.searchParams.entries())
        : await req
            .clone()
            .text()
            .catch(() => "{}");

      console.log(`TRPC ${req.method} request:`, {
        path: url.pathname,
        params: url.searchParams.toString(),
        input: inputData,
      });
    }

    const result = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req,
      router: appRouter,
      createContext: async () => await createTRPCContext({ req }),
      onError: ({ error, path, input }) => {
        console.error(`TRPC error in ${path}:`, {
          name: error.name,
          message: error.message,
          code: error.code,
          input: isDev ? input : "hidden in production", // Only log input in development
        });

        if (error.cause instanceof ZodError) {
          console.error("Validation errors:", error.cause.errors);
        }

        // Log extra information for debugging transformation errors
        if (error.message.includes("transform")) {
          console.error("Transformation error details:", {
            path,
            input: isDev ? input : "hidden in production",
            errorName: error.name,
            errorCause: error.cause,
          });
        }
      },
    });

    // Only log in development
    if (isDev) {
      console.log(`TRPC response for ${req.url}: ${result.status}`);
    }

    // Add cache control headers for successful responses
    if (result.status === 200) {
      const cacheControl = getCacheControl(path);
      result.headers.set("Cache-Control", cacheControl);
    }

    return result;
  } catch (error) {
    console.error("TRPC handler error:", {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : "Unknown Error",
      stack:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.stack
            : undefined
          : undefined,
    });

    // Return more detailed error information for debugging
    return new Response(
      JSON.stringify({
        message: "Server error processing TRPC request",
        error: error instanceof Error ? error.message : String(error),
        path: new URL(req.url).pathname,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "x-trpc-error": "true",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
};

export { handler as GET, handler as POST };
