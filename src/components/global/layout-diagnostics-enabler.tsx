"use client";

import { useEffect } from "react";
import { enableLayoutDiagnostics } from "@/lib/layout-diagnostics";

/**
 * LayoutDiagnosticsEnabler Component
 *
 * This component enables layout diagnostics features only in development mode.
 * It doesn't render any visible UI elements, just hooks into the page lifecycle
 * to provide debugging utilities.
 */
export function LayoutDiagnosticsEnabler() {
  useEffect(() => {
    // Only enable in development mode
    if (process.env.NODE_ENV === "development") {
      console.log(
        "%c[Layout Diagnostics] Development mode detected, enabling diagnostics",
        "color: #0066cc"
      );
      enableLayoutDiagnostics();

      // Add a keyboard shortcut for manual layout check (Ctrl+Shift+L)
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.shiftKey && e.key === "L") {
          console.log(
            "%c[Layout Diagnostics] Manual check triggered",
            "color: #0066cc"
          );

          // Import and run diagnostics on demand
          import("@/lib/layout-diagnostics").then(
            ({ logLayoutStructure, checkLayoutHealth }) => {
              logLayoutStructure();
              checkLayoutHealth();
            }
          );
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, []);

  // This component doesn't render anything
  return null;
}

export default LayoutDiagnosticsEnabler;
