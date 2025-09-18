"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface FallbackLayoutProps {
  children: React.ReactNode;
}

/**
 * FallbackLayout Component
 *
 * This component serves as a safety net for layout rendering issues.
 * It monitors the rendering process and provides a fallback if needed.
 *
 * It works by:
 * 1. Setting a timeout to check if main content appears
 * 2. If not, it attempts to recover by reloading or re-rendering
 * 3. It preserves all original content and functionality
 */
export function FallbackLayout({ children }: FallbackLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [fallbackActive, setFallbackActive] = useState(false);

  useEffect(() => {
    // Reset fallback state on route change
    setFallbackActive(false);

    // Detect if layout rendering is incomplete
    const detectLayoutIssue = () => {
      // Check after sufficient time for normal rendering
      const timer = setTimeout(() => {
        const mainContent = document.querySelectorAll("main").length;
        const contentSections = document.querySelectorAll(
          ".container > div:not(nav)"
        ).length;

        // If we're missing main content sections, activate fallback
        if (mainContent === 0 && contentSections <= 1) {
          console.log("Fallback layout: Detected layout issue");
          setFallbackActive(true);

          // Attempt recovery by forcing router refresh
          // This is gentler than a full page reload
          router.refresh();

          // If still problematic after a delay, do a hard reload
          setTimeout(() => {
            const stillNoContent =
              document.querySelectorAll("main").length === 0;
            if (stillNoContent && fallbackActive) {
              console.log("Fallback layout: Forcing page reload");
              window.location.reload();
            }
          }, 2000);
        }
      }, 1500);

      return () => clearTimeout(timer);
    };

    // Setup the detection
    const cleanup = detectLayoutIssue();

    // Also monitor navigation events
    window.addEventListener("popstate", detectLayoutIssue);

    return () => {
      cleanup();
      window.removeEventListener("popstate", detectLayoutIssue);
    };
  }, [pathname, router, fallbackActive]);

  // Always render the original children - this component is non-intrusive
  return <>{children}</>;
}

export default FallbackLayout;
