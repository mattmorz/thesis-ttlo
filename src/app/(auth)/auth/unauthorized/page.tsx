"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ShieldAlert, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, useEffect } from "react";

// Export a special metadata function for this page
export default function UnauthorizedPage() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Debounce navigation to prevent duplicate session checks
  const handleGoBack = useCallback(() => {
    if (isRedirecting) return;

    setIsRedirecting(true);
    router.back();

    // Reset after navigation
    setTimeout(() => setIsRedirecting(false), 500);
  }, [router, isRedirecting]);

  // Use a single navigation guard to prevent duplicate session checks
  useEffect(() => {
    // Create a controller for the session check
    const controller = new AbortController();
    const signal = controller.signal;

    // Check session only once on mount
    const checkSession = async () => {
      try {
        // Simple fetch to check if already signed in
        const res = await fetch("/api/auth/session", {
          signal,
          headers: { "Cache-Control": "no-cache" },
        });
        const data = await res.json();

        // If we have a session but got redirected to unauthorized page,
        // it might be a permission issue rather than auth issue
        if (data?.user?.id) {
          // We're authenticated but unauthorized - handle appropriately
          console.log("User is authenticated but unauthorized");
        }
      } catch (err) {
        // Ignore fetch errors (like aborts)
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Session check error:", err);
        }
      }
    };

    checkSession();

    // Cleanup on unmount
    return () => {
      controller.abort();
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-red-50 p-4">
      <div className="w-full max-w-md p-8 space-y-8 text-center">
        <ShieldAlert className="mx-auto h-16 w-16 text-red-600" />

        <h1 className="text-3xl font-bold text-gray-900">Access Denied</h1>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-red-100">
          <p className="text-gray-700 mb-4">
            You don't have permission to access this page. This could be
            because:
          </p>

          <ul className="text-left text-gray-600 mb-4 space-y-2">
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>You need to sign in first</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>Your account doesn't have the required permissions</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>You've been signed out due to inactivity</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
          <Button
            variant="outline"
            onClick={handleGoBack}
            className="gap-2"
            disabled={isRedirecting}
          >
            <ChevronLeft className="h-4 w-4" />
            Go Back
          </Button>

          <Button className="bg-[#1B5E20] hover:bg-[#2E7D32] text-white border-none gap-2">
            <Link href="/auth/signin" className="flex items-center">
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
