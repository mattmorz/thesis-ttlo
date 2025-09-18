"use client";

import { usePathname } from "next/navigation";
import { BreadcrumbNavigation } from "./breadcrumb-navigation";
import { useState, useEffect } from "react";

// List of paths that already have breadcrumbs in their specific layouts
const pathsWithBreadcrumbs = [
  "/forms",
  "/guidelines",
  "/projects",
  "/dashboard",
  "/forms/test",
];

export function DefaultBreadcrumb() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Skip rendering if not mounted yet (prevents hydration errors)
  if (!mounted) {
    return null;
  }

  // Don't show on home page
  if (pathname === "/") {
    return null;
  }

  // Check if this path already has a breadcrumb from a nested layout
  const hasSpecificBreadcrumb = pathsWithBreadcrumbs.some((path) =>
    pathname.startsWith(path)
  );

  // Don't show if there's already a more specific breadcrumb
  if (hasSpecificBreadcrumb) {
    return null;
  }

  return (
    <div className="container mx-auto px-4">
      <BreadcrumbNavigation />
    </div>
  );
}
