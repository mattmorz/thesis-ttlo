"use client";

import { FormProvider } from "./[formId]/_components/ipdisclosure/context/form-context";
import { PageContent } from "./[formId]/_components/PageContent";
import { TRPCProvider } from "@/components/providers/trpc-provider";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import PageContent with SSR disabled
const DynamicPageContent = dynamic(
  () =>
    import("./[formId]/_components/PageContent").then((mod) => ({
      default: mod.PageContent,
    })),
  { ssr: false }
);

export default function FormsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // If not mounted yet, show a simple loading indicator with matching structure
  if (!mounted) {
    return (
      <div suppressHydrationWarning className="container mx-auto py-6 px-4">
        <div className="animate-pulse bg-gray-100 h-16 w-full rounded-lg mb-6"></div>
        <div className="space-y-4">
          <div className="animate-pulse bg-gray-100 h-64 w-full rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Use TRPCProvider and FormProvider for the client-side rendered component
  return (
    <TRPCProvider>
      <FormProvider>
        <PageContent />
      </FormProvider>
    </TRPCProvider>
  );
}
