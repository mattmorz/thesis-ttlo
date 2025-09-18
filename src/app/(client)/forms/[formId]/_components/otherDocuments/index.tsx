"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useForm, FormProvider } from "react-hook-form";

// Import components directly - will be available after the files are created
import { UploadDocumentsTab } from "./upload-documents";
import { ViewDocumentsTab } from "./view-documents";

interface OtherDocumentsSectionProps {
  applicationId?: string;
  onClose?: () => void;
}

export function OtherDocumentsSection({
  applicationId,
  onClose,
}: OtherDocumentsSectionProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "view">("upload");
  // Create form context to provide to child components
  const form = useForm();

  return (
    <div className="space-y-6">
      {onClose && (
        <div className="flex justify-end mb-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      )}

      <Card className="border-green-100">
        <CardContent className="p-0">
          {/* Navigation Tabs - Similar to forms styling */}
          <div className="flex border-b">
            <Button
              variant="ghost"
              className={cn(
                "flex-1 rounded-none px-6 py-3 text-sm font-medium h-12",
                activeTab === "upload" &&
                  "border-b-2 border-green-600 text-green-600"
              )}
              onClick={() => setActiveTab("upload")}
            >
              Upload Documents
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "flex-1 rounded-none px-6 py-3 text-sm font-medium h-12",
                activeTab === "view" &&
                  "border-b-2 border-green-600 text-green-600"
              )}
              onClick={() => setActiveTab("view")}
            >
              View Documents
            </Button>
          </div>

          {/* Tab Content - Wrapped in FormProvider */}
          <div className="p-6">
            <FormProvider {...form}>
              {activeTab === "upload" && <UploadDocumentsTab />}
              {activeTab === "view" && <ViewDocumentsTab />}
            </FormProvider>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
