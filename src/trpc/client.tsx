import {
  createTRPCReact,
  inferReactQueryProcedureOptions,
} from "@trpc/react-query";
import type { AppRouter } from "@/trpc/router";
import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { TRPCClientError } from "@trpc/client";
import { httpBatchLink } from "@trpc/client";
import { loggerLink } from "@trpc/client/links/loggerLink";
import superjson from "superjson";
import { useState, useEffect, useMemo, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

export type ReactQueryOptions = inferReactQueryProcedureOptions<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

// Create the tRPC API
export const trpc = createTRPCReact<AppRouter>({
  overrides: {
    useMutation: {
      /**
       * This function is called whenever a `.useMutation` succeeds
       **/
      async onSuccess(opts) {
        /**
         * @note that order here matters:
         * The order here allows route changes in `onSuccess` without
         * having a flash of content change whilst redirecting.
         **/
        // Calls the `onSuccess` defined in the `useQuery()`-options:
        await opts.originalFn();
        // Invalidate all queries to ensure data freshness without artificial delays
        await opts.queryClient.invalidateQueries();
      },
    },
  },
});

export function TRPCProvider({
  children,
  headers,
}: {
  children: React.ReactNode;
  headers?: Record<string, string>;
}) {
  // Get session from NextAuth
  const { data: session, status } = useSession();
  const prevAuthStateRef = useRef(status);

  // Create a query client with optimized settings
  const [queryClient] = useState(() => {
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 1000, // 5 seconds
          gcTime: 60 * 1000, // 1 minute
          retry: 1,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
        },
        mutations: {},
      },
    });
  });

  // Create the TRPC client with session headers
  const trpcClient = useMemo(() => {
    // Only log when the client is actually recreated
    if (process.env.NODE_ENV === "development") {
      console.log("[TRPC] Creating new client with session status:", status);
    }

    return trpc.createClient({
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `/api/trpc`,
          transformer: superjson,
          headers() {
            const allHeaders = {
              ...headers,
              "x-trpc-source": "react",
              ...(session?.user && {
                "x-auth-user-id": session.user.id,
                "x-auth-user-role": session.user.role || "client",
              }),
            };
            return allHeaders;
          },
        }),
      ],
    });
  }, [headers, session?.user?.id, session?.user?.role]); // Removed status from dependencies

  // Clear query cache only when session status changes significantly
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("[TRPC] Session status changed:", status);
    }

    // Only clear cache when transitioning between authenticated and unauthenticated states
    // and only if the state has actually changed
    if (
      status !== prevAuthStateRef.current &&
      (status === "authenticated" || status === "unauthenticated")
    ) {
      console.log(
        `[TRPC] Auth state changed from ${prevAuthStateRef.current} to ${status}, clearing cache`
      );
      queryClient.clear();
      prevAuthStateRef.current = status;
    }
  }, [status, queryClient]);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}

// Helper function to handle TRPC errors
export function handleTRPCError(error: unknown): string {
  if (error instanceof TRPCClientError) {
    if (error.message.includes("transform")) {
      return "Server communication error. Please try again.";
    }

    if (
      error.message.includes("UNAUTHORIZED") ||
      error.message.includes("logged in") ||
      error.message.includes("not authenticated")
    ) {
      return "Authentication error. Please sign in again.";
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unknown error occurred";
}
