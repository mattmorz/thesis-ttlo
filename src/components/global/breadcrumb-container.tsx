"use client";

import { usePathname } from "next/navigation";
import { BreadcrumbNavigation } from "./breadcrumb-navigation";
import { FormBreadcrumb } from "./form-breadcrumb";
import { useState, useEffect } from "react";

export function BreadcrumbContainer() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Only render components after client-side hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything during SSR or first client render to avoid hydration mismatch
  if (!mounted) {
    return <div className="container mx-auto px-4 py-2"></div>; // Empty placeholder with same height
  }

  // Determine if this is a form page
  const isFormPage = pathname.includes("/forms/");

  // Don't show any breadcrumbs on the homepage
  if (pathname === "/") {
    return null;
  }

  return (
    <div className="container mx-auto px-4">
      {isFormPage ? <FormBreadcrumb /> : <BreadcrumbNavigation />}
    </div>
  );
}
