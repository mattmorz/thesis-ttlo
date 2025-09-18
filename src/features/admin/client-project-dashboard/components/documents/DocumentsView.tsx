import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { FileText } from "lucide-react";
import { DocumentCard } from "./DocumentCard";
import { DocumentUploadDialog } from "./DocumentUploadDialog";
import { EmptyData } from "@/components/global/empty-data";
import { LoadingSpinner } from "@/components/global/loading-spinner";
import { ApplicationFormsTab } from "./application-forms/ApplicationFormsTab";

interface DocumentsViewProps {
  applicationId: string;
  viewMode: "grid" | "list";
  isArchived?: boolean;
}

export function DocumentsView({
  applicationId,
  viewMode,
  isArchived,
}: DocumentsViewProps) {
  const { data, isPending } =
    trpc.projects.getDocuments.useQuery(applicationId);
  if (isPending || !data)
    return (
      <div className="w-full min-h-[calc(100dvh-400px)] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );

  const categoryForm = data.filter((doc) => doc.category === "forms");
  const categoryAttachments = data.filter(
    (doc) => doc.category === "attachments"
  );
  const categoryRequirements = data.filter(
    (doc) => doc.category === "requirements"
  );
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Project Documents
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track all project-related documents
          </p>
        </div>
        {!isArchived && <DocumentUploadDialog applicationId={applicationId} />}
      </div>

      <Tabs defaultValue="application-forms" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-4">
          <TabsTrigger
            value="application-forms"
            className="h-[38px] data-[state=active]:after:bg-primary relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <FileText className="size-4" />
            <span className="mx-2">Application Forms</span>
          </TabsTrigger>
          <TabsTrigger
            value="forms"
            className="data-[state=active]:after:bg-primary relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <FileText className="size-4" />
            <span className="mx-2">Uploaded Forms</span>
            <Badge variant="secondary" className="text-xs">
              {categoryForm.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="attachments"
            className="data-[state=active]:after:bg-primary relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <FileText className="size-4" />
            <span className="mx-2">Attachments</span>
            <Badge variant="secondary" className="text-xs">
              {categoryAttachments.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="requirements"
            className="data-[state=active]:after:bg-primary relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <FileText className="size-4" />
            <span className="mx-2">Requirements</span>
            <Badge variant="secondary" className="text-xs">
              {categoryRequirements.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <ApplicationFormsTab
          applicationId={applicationId}
          viewMode={viewMode}
        />

        <TabsContent value="forms">
          <div
            className={cn(
              "grid gap-4",
              viewMode === "grid" && categoryForm.length > 0
                ? "grid-cols-1 md:grid-cols-2"
                : "grid-cols-1"
            )}
          >
            {categoryForm.length === 0 && <EmptyData />}
            {categoryForm.map((document, index) => (
              <DocumentCard
                applicationId={applicationId}
                document={document}
                viewMode={viewMode}
                key={index}
              />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="attachments">
          <div
            className={cn(
              "grid gap-4",
              viewMode === "grid" && categoryAttachments.length > 0
                ? "grid-cols-1 md:grid-cols-2"
                : "grid-cols-1"
            )}
          >
            {categoryAttachments.length === 0 && <EmptyData />}
            {categoryAttachments.map((document, index) => (
              <DocumentCard
                applicationId={applicationId}
                document={document}
                viewMode={viewMode}
                key={index}
              />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="requirements">
          <div
            className={cn(
              "grid gap-4",
              viewMode === "grid" && categoryRequirements.length > 0
                ? "grid-cols-1 md:grid-cols-2"
                : "grid-cols-1"
            )}
          >
            {categoryRequirements.length === 0 && <EmptyData />}
            {categoryRequirements.map((document, index) => (
              <DocumentCard
                applicationId={applicationId}
                document={document}
                viewMode={viewMode}
                key={index}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
