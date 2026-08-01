import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DocumentsGetResult } from "@/features/admin/projects/types";
import { cn, formatDate } from "@/lib/utils";
import {
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileText,
  MessageCircle,
  UserRoundCheck,
  XCircle,
} from "lucide-react";
import { DocumentCancelValidationDialog } from "./DocumentCancelValidationDialog";
import { Badge, Separator } from "@/components/ui";
import Link from "next/link";
import { DocumentValidationDialog } from "./DocumentValidationDialog";

const BADGE_CONFIG = {
  approved: {
    variant: "active",
    icon: <CheckCircle className="size-3" />,
    text: "Approved",
  },
  pending: {
    variant: "pending",
    icon: <Clock className="size-3" />,
    text: "Pending",
  },
  rejected: {
    variant: "blocked",
    icon: <XCircle className="size-3" />,
    text: "Rejected",
  },
} as const;

interface DocumentCardProps {
  document: DocumentsGetResult;
  applicationId: string;
  viewMode: "grid" | "list";
}

export function DocumentCard({
  document,
  applicationId,
  viewMode,
}: DocumentCardProps) {
  const documentValidation =
    document?.documentsValidations.length > 0
      ? document?.documentsValidations[0]
      : null;

  const badge =
    BADGE_CONFIG[
      documentValidation?.validationStatus as keyof typeof BADGE_CONFIG
    ] ?? null;

  return (
    <>
      <Card className="group hover:border-primary transition-all flex flex-col">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="font-medium line-clamp-1">
              {document.title}
            </CardTitle>
            <CardDescription className="capitalize inline-flex gap-1 items-center">
              <FileText className="size-3.5" />
              {document.type}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {badge && (
              <Badge variant={badge.variant} className="gap-1">
                {badge.icon}
                {badge.text}
              </Badge>
            )}
            {document.requiresValidation && documentValidation && <DocumentCancelValidationDialog validationId={documentValidation.id} />}
          </div>
        </CardHeader>
        <CardContent
          className={cn(
            "text-sm grid gap-4",
            viewMode === "list" && "grid-cols-1 md:grid-cols-2"
          )}
        >
          <div className="gap-2 flex flex-col">
            <p className="text-xs text-muted-foreground">
              Document Information
            </p>
            <div className="inline-flex items-center gap-2">
              <UserRoundCheck className="size-4 flex-shrink-0 opacity-70" />
              <p className="capitalize">
                {document.userAccount?.name?.toLowerCase() ?? "Admin"}
              </p>
            </div>
            <div className="inline-flex items-center gap-2">
              <Calendar className="size-4 flex-shrink-0 opacity-70" />
              <p>{formatDate(document.createdAt, "MMM d, yyyy 'at' h:mm a")}</p>
            </div>
          </div>
          {documentValidation?.validationStatus === "approved" && (
            <div className="gap-2 flex flex-col">
              <p className="text-xs text-muted-foreground">
                Validation Information
              </p>
              <div className="inline-flex items-center gap-2">
                <UserRoundCheck className="size-4 flex-shrink-0 opacity-70" />
                <p className="capitalize">
                  {documentValidation?.userAccount?.name?.toLowerCase() ??
                    "Admin"}
                </p>
              </div>
              <div className="inline-flex items-center gap-2">
                <Calendar className="size-4 flex-shrink-0 opacity-70" />
                <p>
                  {formatDate(
                    documentValidation?.validatedAt,
                    "MMM d, yyyy 'at' h:mm a"
                  )}
                </p>
              </div>
              <div className="inline-flex items-center gap-2">
                <MessageCircle className="size-4 flex-shrink-0 opacity-70" />
                <p className="line-clamp-3">
                  {documentValidation?.validationRemarks}
                </p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-end space-x-2 mt-auto">
          <Link
            href={`/api/files/download?projectId=${applicationId}&fileName=${encodeURIComponent(
              document.fileName
            )}`}
            prefetch={false}
            target="_blank"
          >
            <Button variant="outline" size="sm">
              <Download />
              Download
            </Button>
          </Link>
          {document.requiresValidation && (
            <DocumentValidationDialog
              applicationId={applicationId}
              document={document}
            />
          )}
        </CardFooter>
      </Card>
    </>
  );
}
