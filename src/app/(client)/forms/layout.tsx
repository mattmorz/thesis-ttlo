"use client";

import { useEffect } from "react";

/**
 * A simple client-side component that ensures the forms page
 * renders properly after navigation from the dashboard.
 */
export function FormsPageGuard() {
  useEffect(() => {
    // If we came from dashboard (via marker in sessionStorage),
    // we want to ensure the page loads correctly
    if (sessionStorage.getItem("from_forms")) {
      // Add a class to the body to indicate we're on the forms page
      document.body.classList.add("forms-page");

      // Check if the page rendered properly after a brief delay
      setTimeout(() => {
        const hasContent =
          document.querySelectorAll("main").length > 0 ||
          document.querySelectorAll(".container > div").length > 2;

        // If the page didn't render properly, reload once
        if (!hasContent && !sessionStorage.getItem("forms_reloaded")) {
          console.log("Forms page did not render properly - reloading once");
          sessionStorage.setItem("forms_reloaded", "true");
          window.location.reload();
        } else {
          // Clear the reload flag after successful render or after one reload
          sessionStorage.removeItem("forms_reloaded");
        }
      }, 500);
    }

    return () => {
      // Clean up
      document.body.classList.remove("forms-page");
    };
  }, []);

  return null;
}

import { BreadcrumbNavigation } from "@/components/global/breadcrumb-navigation";

export default function FormsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <FormsPageGuard />
      <div className="container mx-auto px-4">
        <BreadcrumbNavigation />
      </div>
      {children}
    </>
  );
}
