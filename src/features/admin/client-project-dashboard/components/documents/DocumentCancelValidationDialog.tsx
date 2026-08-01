"use client";
import { Button } from "@/components/ui";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { AlertDialogTrigger } from "@radix-ui/react-alert-dialog";
import { XCircle } from "lucide-react";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { useState } from "react";

interface DocumentCancelValidationDialogProps {
  validationId: string;
}

export function DocumentCancelValidationDialog({ validationId }: DocumentCancelValidationDialogProps) {
  const trpcUtil = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const mutate = trpc.projects.cancelValidationDocument.useMutation({
    onSuccess: () => {
      trpcUtil.projects.getDocuments.invalidate();
      toast.success("Document verification cancelled successfully.");
      setOpen(false);
    },
    onError: () => {
      toast.error("Failed to cancel document verification.");
    }
  });

  const handleCancel = () => {
    mutate.mutate(validationId);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-muted-foreground hover:text-destructive"
        >
          <XCircle className="size-3" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Document Verification</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel the verification of this document?
            This will revert the document status to &quot;Not Verified&quot;.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutate.isPending}>No, keep it verified</AlertDialogCancel>
          <AlertDialogAction disabled={mutate.isPending} onClick={handleCancel}>
            {mutate.isPending ? "Cancelling..." : "Yes, cancel verification"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
