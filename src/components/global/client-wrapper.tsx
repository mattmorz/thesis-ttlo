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
];

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Skip rendering breadcrumbs if not mounted yet
  if (!mounted) {
    return <>{children}</>;
  }

  // Don't show breadcrumbs on home page
  if (pathname === "/") {
    return <>{children}</>;
  }

  // Check if this path already has a breadcrumb from a nested layout
  const hasSpecificBreadcrumb = pathsWithBreadcrumbs.some((path) =>
    pathname.startsWith(path)
  );

  // Don't show breadcrumbs if there's already a more specific breadcrumb
  if (hasSpecificBreadcrumb) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="container mx-auto px-4">
        <BreadcrumbNavigation />
      </div>
      {children}
    </>
  );
}
