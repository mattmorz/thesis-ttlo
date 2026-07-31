"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ShieldAlert, LogIn, Home, UserCheck, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect, Suspense } from "react";

function ErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [userSession, setUserSession] = useState<{
    id?: string;
    email?: string;
    role?: string;
  } | null>(null);

  const handleGoBack = useCallback(() => {
    if (isRedirecting) return;

    setIsRedirecting(true);
    router.back();

    setTimeout(() => setIsRedirecting(false), 500);
  }, [router, isRedirecting]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/session", {
          signal,
          headers: { "Cache-Control": "no-cache" },
        });
        const data = await res.json();

        if (data?.user?.id) {
          setUserSession(data.user);
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Session check error:", err);
        }
      }
    };

    checkSession();

    return () => {
      controller.abort();
    };
  }, []);

  const isConfigError = errorCode === "Configuration";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-amber-50/40 p-4">
      <div className="w-full max-w-md p-8 space-y-8 text-center">
        <ShieldAlert className="mx-auto h-16 w-16 text-amber-600" />

        <h1 className="text-3xl font-bold text-gray-900">
          {isConfigError ? "Authentication Configuration" : "Access Denied"}
        </h1>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-amber-200 text-left">
          {userSession?.email ? (
            <div className="mb-4 p-3 bg-emerald-50 rounded-md border border-emerald-200 text-sm text-emerald-900">
              <div className="flex items-center gap-2 font-semibold">
                <UserCheck className="h-4 w-4 text-emerald-600" />
                Signed in as:
              </div>
              <p className="mt-1 font-mono text-xs text-gray-800">
                {userSession.email}
              </p>
              <p className="mt-1 text-xs text-gray-600">
                Role: <span className="font-semibold capitalize">{userSession.role || "client"}</span>
              </p>
            </div>
          ) : null}

          {isConfigError ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-800 font-medium">
                The server is verifying Google OAuth credentials and redirect settings.
              </p>
              <ul className="text-gray-600 space-y-2 text-xs">
                <li className="flex items-start">
                  <span className="text-amber-500 mr-2">•</span>
                  <span>Ensure <code>AUTH_GOOGLE_ID</code> and <code>AUTH_GOOGLE_SECRET</code> are active in server configuration.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-500 mr-2">•</span>
                  <span>Verify <code>NEXTAUTH_URL=https://ttlo.carsu.edu.ph</code> matches Google Cloud Console Authorized Redirect URIs (<code>/api/auth/callback/google</code>).</span>
                </li>
              </ul>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-700">
                {userSession?.email
                  ? "Your account is logged in, but you do not have permission to view the requested page."
                  : "Unable to complete authentication. Possible reasons:"}
              </p>

              <ul className="text-gray-600 space-y-2 text-sm">
                {userSession?.email ? (
                  <>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      <span>
                        Your account has <strong>{userSession.role || "client"}</strong> access. Admin routes require an account listed in <code>ADMIN_EMAILS</code> or <code>TTLO_STAFF_EMAILS</code>.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      <span>If you are a client user, please use the Client Portal dashboard instead.</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      <span>Your account credentials or email domain require authorization.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      <span>Your session may have expired. Please try signing in again.</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          )}
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

          {userSession?.email ? (
            <Button className="bg-[#1B5E20] hover:bg-[#2E7D32] text-white border-none gap-2" asChild>
              <Link href="/dashboard">
                <Home className="h-4 w-4 mr-2" />
                Client Dashboard
              </Link>
            </Button>
          ) : (
            <Button className="bg-[#1B5E20] hover:bg-[#2E7D32] text-white border-none gap-2" asChild>
              <a href="/api/auth/signin/google?callbackUrl=/dashboard">
                <RefreshCw className="h-4 w-4 mr-2" />
                Continue to Google Sign-In
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-amber-50/40 p-4">
          <div className="w-full max-w-md p-8 text-center text-gray-500">
            <ShieldAlert className="mx-auto h-16 w-16 text-amber-600 animate-pulse" />
            <p className="mt-4 text-sm text-gray-600">Loading auth error details...</p>
          </div>
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
