"use client";

import React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { generateBreadcrumbs } from "@/lib/breadcrumb-utils";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Form tab mapping for breadcrumbs
const formTabLabels: Record<string, string> = {
  "client-profile": "Client Profile",
  "ip-disclosure": "IP Disclosure",
  "substantial-use": "Substantial Use",
  "deed-assignment": "Deed of Assignment",
};

// SubTab mapping for deed of assignment
const subTabLabels: Record<string, string> = {
  deed: "Deed",
  transfer: "Transfer Agreement",
  terms: "Terms & Conditions",
};

export function FormBreadcrumb({
  className,
  separator = <ChevronRight className="h-4 w-4" />,
}: {
  className?: string;
  separator?: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const breadcrumbs = generateBreadcrumbs(pathname);

  // Handle form tabs and sub-tabs
  const tab = searchParams?.get("tab");
  const subTab = searchParams?.get("subTab");

  if (tab && formTabLabels[tab]) {
    breadcrumbs.push({
      label: formTabLabels[tab],
      href: `${pathname}?tab=${tab}`,
      isCurrent: !subTab,
    });

    if (tab === "deed-assignment" && subTab && subTabLabels[subTab]) {
      breadcrumbs.push({
        label: subTabLabels[subTab],
        href: `${pathname}?tab=${tab}&subTab=${subTab}`,
        isCurrent: true,
      });
    }
  }

  // Add query params to the breadcrumbs for "Application Forms" to preserve tabs
  for (let i = 0; i < breadcrumbs.length; i++) {
    const crumb = breadcrumbs[i];
    // If this is the "Forms" or "Application Forms" breadcrumb, add the tab parameter
    if (crumb.label === "Forms" || crumb.label === "Application Forms") {
      // Only add the tab parameter if one exists
      if (tab && formTabLabels[tab]) {
        crumb.href = `${crumb.href}${
          crumb.href.includes("?") ? "&" : "?"
        }tab=${tab}`;
      }
    }
  }

  return (
    <Breadcrumb className={cn("py-2 mb-4 mt-6", className)}>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <React.Fragment key={`${crumb.href}-${index}`}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="text-sm font-medium text-[#1B5E20]">
                    {crumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      href={crumb.href}
                      className={cn(
                        "text-sm text-muted-foreground hover:text-[#4CAF50]",
                        index === 0 && "flex items-center gap-1"
                      )}
                    >
                      {index === 0 && <Home className="h-3.5 w-3.5" />}
                      {crumb.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>

              {!isLast && (
                <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>
              )}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
