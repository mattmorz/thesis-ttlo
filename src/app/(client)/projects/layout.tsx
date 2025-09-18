"use client";

import { BreadcrumbNavigation } from "@/components/global/breadcrumb-navigation";
import { useState, useEffect } from "react";

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {mounted && (
        <div className="container mx-auto px-4">
          <BreadcrumbNavigation />
        </div>
      )}
      {children}
    </>
  );
}
