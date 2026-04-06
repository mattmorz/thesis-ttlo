"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SignOutPage() {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const router = useRouter();

  useEffect(() => {
    // Track mounted state to prevent state updates after unmount
    let isMounted = true;

    // Only run sign out once
    if (isSigningOut) return;

    setIsSigningOut(true);

    const performSignOut = async () => {
      try {
        // We'll use a more direct approach to reduce duplicate session checks
          // First, clear any cached session data from localStorage (v4 + v5)
        localStorage.removeItem("next-auth.session-token");
        localStorage.removeItem("next-auth.callback-url");
        localStorage.removeItem("next-auth.csrf-token");
        localStorage.removeItem("authjs.session-token");
        localStorage.removeItem("authjs.callback-url");
        localStorage.removeItem("authjs.csrf-token");

        // Clear cookies without triggering a session check first
        document.cookie.split(";").forEach((cookie) => {
          const [name] = cookie.trim().split("=");
          if (name.includes("next-auth") || name.includes("authjs")) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
          }
        });

        // Now perform the actual sign out - force redirect true
        await signOut({
          callbackUrl: "/",
          redirect: true,
        });

        // Fallback redirect in case the above doesn't trigger
        if (isMounted) {
          // Start countdown for UX feedback
          const countdownInterval = setInterval(() => {
            if (isMounted) {
              setCountdown((prev) => {
                if (prev <= 1) {
                  clearInterval(countdownInterval);
                  window.location.href = "/";
                  return 0;
                }
                return prev - 1;
              });
            } else {
              clearInterval(countdownInterval);
            }
          }, 1000);

          // Final fallback - force redirect after timeout
          setTimeout(() => {
            if (isMounted) {
              window.location.href = "/";
            }
          }, 3500);
        }
      } catch (error) {
        console.error("Error signing out:", error);
        // Immediate fallback redirect if signOut fails
        if (isMounted) {
          window.location.href = "/";
        }
      }
    };

    // Start sign-out process immediately
    performSignOut();

    return () => {
      isMounted = false;
    };
  }, [isSigningOut, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-green-50">
      <div className="w-full max-w-md p-8 space-y-4 text-center">
        <LogOut className="mx-auto h-12 w-12 text-green-700 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">Signing Out</h1>
        <p className="text-gray-600 mb-6">
          Thank you for using the TTLO Portal. Please wait while we securely
          sign you out.
        </p>
        <div className="flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <p className="text-sm text-green-600 mt-2">
            Redirecting to homepage in {countdown} seconds...
          </p>
        </div>
      </div>
    </div>
  );
}
