"use client";

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

export function BreadcrumbNavigation({
  className,
  separator = <ChevronRight className="h-4 w-4" />,
  showOnHome = false,
}: {
  className?: string;
  separator?: React.ReactNode;
  showOnHome?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Only show breadcrumbs if not on home page or if showOnHome is true
  if (pathname === "/" && !showOnHome) {
    return null;
  }

  const breadcrumbs = generateBreadcrumbs(pathname);

  // Add query params to current page URL if they exist
  if (searchParams?.toString() && breadcrumbs.length > 0) {
    const lastItem = breadcrumbs[breadcrumbs.length - 1];
    lastItem.href = `${lastItem.href}?${searchParams.toString()}`;
  }

  return (
    <Breadcrumb className={cn("py-2 mb-4 mt-6", className)}>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <BreadcrumbItem key={crumb.href}>
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

              {!isLast && (
                <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
