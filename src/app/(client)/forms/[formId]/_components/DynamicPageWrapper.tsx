"use client";

import { useState, useEffect } from "react";
import { PageContent } from "./PageContent";
import { FileText } from "lucide-react";

/**
 * Client-side only wrapper for PageContent
 * This component ensures that PageContent only renders after client hydration is complete
 */
export function DynamicPageWrapper() {
  const [mounted, setMounted] = useState(false);

  // Only show the component after client-side hydration is complete
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Server-side or during hydration, render a simple placeholder
    // The DOM structure should match the initial structure of PageContent as closely as possible
    return (
      <div className="container mx-auto pb-6 px-4" suppressHydrationWarning>
        <div className="mb-6 border-b pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-md bg-[#f1f5f1] flex items-center justify-center">
                <FileText className="h-5 w-5 text-[#1B5E20]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  IP Application Manager
                </h2>
                <p className="text-sm text-muted-foreground">
                  Create, view and manage your intellectual property
                  applications in one place
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Placeholder for application selector */}
              <div className="h-9 w-52 animate-pulse bg-gray-100 rounded"></div>
              {/* Placeholder for new application button */}
              <div className="h-9 w-36 animate-pulse bg-gray-100 rounded"></div>
            </div>
          </div>

          {/* Loading indicator - matched to the new application card layout */}
          <div className="rounded-lg border bg-white shadow-sm mt-4">
            <div className="flex flex-col md:flex-row">
              <div className="flex-1 p-5">
                <div className="flex items-start gap-4">
                  <div className="size-12 rounded-md bg-gray-100 animate-pulse"></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-40 bg-gray-100 animate-pulse rounded"></div>
                      <div className="h-5 w-16 bg-gray-100 animate-pulse rounded"></div>
                    </div>
                    <div className="h-4 w-full max-w-md bg-gray-100 animate-pulse rounded mb-3"></div>
                    <div className="h-4 w-2/3 bg-gray-100 animate-pulse rounded mb-3"></div>
                    <div className="flex items-center gap-4">
                      <div className="h-8 w-32 bg-gray-100 animate-pulse rounded"></div>
                      <div className="h-5 w-28 bg-gray-100 animate-pulse rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-48 bg-gray-50 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="size-3 rounded-full bg-gray-200 animate-pulse"></div>
                    <div className="h-5 w-24 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-4 w-14 bg-gray-200 animate-pulse rounded"></div>
                    <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                </div>
                <div className="h-8 w-full bg-gray-200 animate-pulse rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <PageContent />;
}
