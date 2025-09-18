/**
 * Layout Diagnostics Utility
 *
 * This utility provides tools for diagnosing layout rendering issues,
 * particularly when components fail to render or when navigation causes layout problems.
 */

// Extend Window interface to add our diagnostics property
declare global {
  interface Window {
    __layoutDiagnostics?: {
      logLayoutStructure: () => void;
      checkLayoutHealth: () => boolean;
    };
  }
}

/**
 * Enables diagnostic mode which logs detailed information about layout changes
 */
export function enableLayoutDiagnostics() {
  if (typeof window === "undefined") return;

  console.log("Layout diagnostics enabled");

  // Store original console methods
  const originalConsoleError = console.error;

  // Override console.error to catch React rendering errors
  console.error = function (...args) {
    // Call original method
    originalConsoleError.apply(console, args);

    // Check if this is a React error
    const errorString = args.join(" ");
    if (
      errorString.includes("React") ||
      errorString.includes("rendering") ||
      errorString.includes("component") ||
      errorString.includes("Cannot update a component")
    ) {
      console.log(
        "%c[Layout Diagnostics] React error detected",
        "background: #ffcccc; color: #990000"
      );
      console.log("Current route:", window.location.pathname);
      console.trace("Component stack trace");

      // Log DOM state
      logLayoutStructure();
    }
  };

  // Monitor navigation events
  window.addEventListener("popstate", () => {
    console.log(
      "%c[Layout Diagnostics] Navigation detected",
      "background: #ccffcc; color: #006600"
    );
    console.log("New route:", window.location.pathname);

    // Check layout after navigation with a delay
    setTimeout(() => {
      logLayoutStructure();
    }, 1000);
  });

  // Store in window for debugging
  window.__layoutDiagnostics = {
    logLayoutStructure,
    checkLayoutHealth,
  };
}

/**
 * Logs the current layout structure for debugging
 */
export function logLayoutStructure() {
  if (typeof window === "undefined") return;

  console.group(
    "%c[Layout Diagnostics] DOM Structure",
    "background: #e0e0ff; color: #000066"
  );

  console.log("Header elements:", document.querySelectorAll("header").length);
  console.log(
    "Main content elements:",
    document.querySelectorAll("main").length
  );
  console.log(
    "Container elements:",
    document.querySelectorAll(".container").length
  );
  console.log("Navigation elements:", document.querySelectorAll("nav").length);

  // Check for common layout containers
  const bodyChildren = document.body.children;
  console.log("Body direct children:", bodyChildren.length);

  console.groupEnd();
}

/**
 * Checks if the current layout is healthy
 * @returns {boolean} True if layout appears healthy
 */
export function checkLayoutHealth(): boolean {
  if (typeof window === "undefined") return true;

  const hasHeader = document.querySelectorAll("header").length > 0;
  const hasMainContent =
    document.querySelectorAll("main").length > 0 ||
    document.querySelectorAll(".container > div:not(nav)").length > 1;

  const isHealthy = hasHeader && hasMainContent;

  console.log(
    `%c[Layout Diagnostics] Layout health: ${isHealthy ? "GOOD" : "BROKEN"}`,
    isHealthy
      ? "background: #ccffcc; color: #006600"
      : "background: #ffcccc; color: #990000"
  );

  return isHealthy;
}

/**
 * Automatically fixes layout if broken - to be used in development only
 */
export function autoFixLayout() {
  if (typeof window === "undefined") return;

  if (!checkLayoutHealth()) {
    console.log(
      "%c[Layout Diagnostics] Attempting to auto-fix layout",
      "background: #ffffcc; color: #999900"
    );
    window.location.reload();
  }
}
