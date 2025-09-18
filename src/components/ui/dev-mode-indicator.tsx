"use client";

import { AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function DevModeIndicator() {
  const session = useSession();
  const [isVisible, setIsVisible] = useState(false);

  const isDevAdmin =
    process.env.NODE_ENV === "development" &&
    session?.data?.user?.role === "admin";

  useEffect(() => {
    // Only attach listeners if we're in dev mode with admin role
    if (!isDevAdmin) return;

    // Show indicator when Alt+D is pressed
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "d") {
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDevAdmin]);

  if (!isDevAdmin || !isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center gap-2 bg-amber-100 text-amber-900 px-3 py-2 rounded-lg shadow-lg border border-amber-200 backdrop-blur-sm bg-opacity-90 transition-all hover:bg-amber-50">
        <AlertCircle className="h-4 w-4" />
        <div className="flex flex-col">
          <span className="text-xs font-medium">Development Mode</span>
          <span className="text-[10px] opacity-75">
            Admin Permissions Active
          </span>
        </div>
      </div>
    </div>
  );
}
