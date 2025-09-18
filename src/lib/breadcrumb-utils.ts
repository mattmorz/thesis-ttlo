import { Route } from "next";

export type BreadcrumbSegment = {
  label: string;
  href: string;
  isCurrent?: boolean;
};

// Map of special route segments to friendly names
const routeLabels: Record<string, string> = {
  // Client routes
  forms: "Forms",
  test: "Application Forms",
  guidelines: "Guidelines",
  introduction: "Introduction",
  patent: "Patent",
  copyright: "Copyright",
  trademark: "Trademark",
  "trade-secrets": "Trade Secrets",
  "filing-procedures": "Filing Procedures",
  "maintenance-and-renewals": "Maintenance & Renewals",
  "legal-requirements": "Legal Requirements",
  projects: "Projects",
  dashboard: "Dashboard",
  contact: "Contact",
  "client-profile": "Client Profile",
  "ip-disclosure": "IP Disclosure",
  "substantial-use": "Substantial Use",
  "deed-assignment": "Deed of Assignment",

  // Admin routes
  admin: "Admin",
  calendar: "Calendar",
  archives: "Archives",
  users: "User Management",
  settings: "Settings",
};

// Generate breadcrumb segments from a URL path
export function generateBreadcrumbs(path: string): BreadcrumbSegment[] {
  // Always start with home
  const breadcrumbs: BreadcrumbSegment[] = [{ label: "Home", href: "/" }];

  // Skip empty paths
  if (!path || path === "/") {
    return breadcrumbs;
  }

  // Split path into segments
  const segments = path.split("/").filter(Boolean);

  // Build breadcrumbs by accumulating path segments
  let currentPath = "";

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;

    // Handle dynamic routes (anything with [] brackets)
    const isLast = index === segments.length - 1;
    const label =
      routeLabels[segment] ||
      segment.charAt(0).toUpperCase() + segment.slice(1);

    breadcrumbs.push({
      label,
      href: currentPath as Route,
      isCurrent: isLast,
    });
  });

  return breadcrumbs;
}
