"use client";

import { useEffect } from "react";

/**
 * FormsLayoutRecovery Component
 *
 * A specialized recovery component that only monitors and fixes layout issues
 * when navigating to/from forms pages, which is the specific problem area.
 *
 * This is much more targeted than the general layout recovery and has less chance
 * of causing unintended side effects.
 */
export function FormsLayoutRecovery() {
  useEffect(() => {
    // Don't run on the server
    if (typeof window === "undefined") return;

    // Track if we're in the process of navigation to/from forms
    let isFormsNavigation = false;

    // Function to detect when we're navigating to/from forms
    const detectFormsNavigation = () => {
      const currentPath = window.location.pathname;
      const isFormsPage = currentPath.startsWith("/forms");
      const hasDashboardReferrer = document.referrer.includes("/dashboard");

      // We care specifically about the dashboard → forms navigation that's problematic
      if (
        (isFormsPage && hasDashboardReferrer) ||
        (currentPath.includes("/dashboard") &&
          sessionStorage.getItem("from_forms"))
      ) {
        isFormsNavigation = true;

        // When navigating to forms, set a session flag to track where we came from
        if (isFormsPage) {
          sessionStorage.setItem("from_forms", "true");
        } else {
          sessionStorage.removeItem("from_forms");
        }

        // Check for layout issues after the navigation should be complete
        setTimeout(checkFormsLayoutHealth, 600);
      }
    };

    // Function to check if the layout is healthy after forms navigation
    const checkFormsLayoutHealth = () => {
      if (!isFormsNavigation) return;

      // The most reliable indicator of the broken layout is when we only have
      // the navbar and no content
      const hasNavbar = document.querySelectorAll("header").length > 0;
      const hasContent =
        document.querySelectorAll("main").length > 0 ||
        document.querySelectorAll(".container > div").length > 2;

      // If we have just the navbar but no content, the layout is likely broken
      if (hasNavbar && !hasContent) {
        console.log("Forms navigation layout issue detected - reloading page");
        // Reload the page to fix the layout
        window.location.reload();
      }

      // Reset the navigation flag
      isFormsNavigation = false;
    };

    // Listen for navigation events
    const handleNavigation = () => {
      detectFormsNavigation();
    };

    // Run once on initial load
    detectFormsNavigation();

    // Add listeners
    window.addEventListener("popstate", handleNavigation);

    return () => {
      window.removeEventListener("popstate", handleNavigation);
    };
  }, []);

  // This component doesn't render anything
  return null;
}

export default FormsLayoutRecovery;
