"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ShieldAlert, LogIn, Home, UserCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";

export default function ErrorPage() {
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-red-50 p-4">
      <div className="w-full max-w-md p-8 space-y-8 text-center">
        <ShieldAlert className="mx-auto h-16 w-16 text-red-600" />

        <h1 className="text-3xl font-bold text-gray-900">Access Denied</h1>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-red-100 text-left">
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

          <p className="text-gray-700 mb-4">
            {userSession?.email
              ? "Your account is logged in, but you do not have permission to view the requested page."
              : "You don't have permission to access this page. This could be because:"}
          </p>

          <ul className="text-gray-600 mb-4 space-y-2 text-sm">
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
                  <span>You are using an unauthorized email domain.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span>Your account does not have the required permissions.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span>Your session has expired or you need to sign in again.</span>
                </li>
              </>
            )}
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

          {userSession?.email ? (
            <Button className="bg-[#1B5E20] hover:bg-[#2E7D32] text-white border-none gap-2" asChild>
              <Link href="/dashboard">
                <Home className="h-4 w-4 mr-2" />
                Client Dashboard
              </Link>
            </Button>
          ) : (
            <Button className="bg-[#1B5E20] hover:bg-[#2E7D32] text-white border-none gap-2" asChild>
              <Link href="/auth/signin">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
