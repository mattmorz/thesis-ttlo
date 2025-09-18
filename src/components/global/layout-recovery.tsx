"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * LayoutRecovery Component
 *
 * This component monitors for layout rendering issues and automatically
 * recovers from them without affecting normal page functionality.
 *
 * It detects when only the navigation bar is showing (broken layout)
 * and automatically reloads the page to restore the correct layout.
 */
export function LayoutRecovery() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Function to detect broken layout state
    const detectBrokenLayout = () => {
      // Give the DOM time to render
      setTimeout(() => {
        // Check if we have main content sections
        // A broken layout typically only shows the navbar without content
        const mainContent = document.querySelectorAll("main").length;
        const contentSections = document.querySelectorAll(
          ".container > div:not(nav)"
        ).length;
        const navbar = document.querySelector("header");

        // If we have a navbar but no main content, we're likely in a broken layout state
        if (navbar && mainContent === 0 && contentSections <= 1) {
          console.log(
            "Layout recovery: Detected broken layout, reloading page"
          );
          // Reload the current page to restore the layout
          window.location.reload();
        }
      }, 800); // Allow time for components to mount
    };

    // Check immediately after navigation
    detectBrokenLayout();

    // Set up navigation change monitoring
    const handleRouteChange = () => {
      detectBrokenLayout();
    };

    // Add event listeners for navigation events
    window.addEventListener("popstate", handleRouteChange);

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, [pathname]);

  // This component doesn't render anything
  return null;
}

export default LayoutRecovery;
