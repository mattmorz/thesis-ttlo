"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import React, { ReactNode, useState, useEffect, useMemo } from "react";
import { trpc } from "@/trpc/client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useSession } from "next-auth/react";
import superjson from "superjson";

function getBaseUrl() {
  if (typeof window !== "undefined")
    // browser should use relative path
    return "";
  if (process.env.VERCEL_URL)
    // reference for vercel.com
    return `https://${process.env.VERCEL_URL}`;
  if (process.env.RENDER_INTERNAL_HOSTNAME)
    // reference for render.com
    return `http://${process.env.RENDER_INTERNAL_HOSTNAME}:${process.env.PORT}`;
  // assume localhost
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function TRPCProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 60 * 24,
            gcTime: 1000 * 60 * 60 * 24,
            refetchOnWindowFocus: true,
            refetchOnMount: false,
            refetchOnReconnect: false,
            retry: (failureCount, error: unknown) => {
              // Don't retry on 401/403 errors
              if (
                typeof error === "object" &&
                error !== null &&
                "message" in error &&
                (String(error.message).includes("UNAUTHORIZED") ||
                  String(error.message).includes("logged in") ||
                  String(error.message).includes("not authenticated"))
              ) {
                return false;
              }

              // Don't retry transform errors
              if (
                typeof error === "object" &&
                error !== null &&
                "message" in error &&
                String(error.message).includes("transform")
              ) {
                console.error("Transform error in query:", error);
                return false;
              }

              // Otherwise retry up to 2 times (3 total attempts)
              return failureCount < 2;
            },
          },
        },
      })
  );

  // Create a new trpcClient only when the session user ID changes
  const trpcClient = useMemo(() => {
    return trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
          async headers() {
            const headers: Record<string, string> = {};

            // Add session token to headers if available
            if (session?.user) {
              headers.authorization = `Bearer ${session.user.id}`;
            }

            return headers;
          },
        }),
      ],
    });
  }, [session?.user?.id]); // Only recreate when user ID changes

  // Reset the query client only when the session status changes from authenticated to unauthenticated or vice versa
  useEffect(() => {
    const prevStatus = queryClient.getQueryData(["session-status"]);
    if (prevStatus !== status) {
      queryClient.setQueryData(["session-status"], status);
      if (prevStatus === "authenticated" || status === "authenticated") {
        queryClient.clear();
      }
    }
  }, [status, queryClient]);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
