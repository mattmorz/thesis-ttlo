"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "@/components/ui/extension/file-uploader";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { DocumentsGetResult } from "@/features/admin/projects/types";
import { formatDate } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { CloudUpload, Eye, Paperclip } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const formSchema = z.object({
  remarks: z.string(),
  files: z.array(z.instanceof(File)).min(1, "At least one files is required"),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  fileType: z.string().optional(),
});

interface DocumentValidationDialogProps {
  applicationId: string;
  document: DocumentsGetResult;
}

export function DocumentValidationDialog({
  applicationId,
  document,
}: DocumentValidationDialogProps) {
  const trpcUtil = trpc.useUtils();
  const mutate = trpc.projects.validateDocument.useMutation({
    onSuccess: () => {
      trpcUtil.projects.getDocuments.invalidate();
    },
  });
  const mutateReject = trpc.projects.rejectValidationDocument.useMutation({
    onSuccess: () => {
      trpcUtil.projects.getDocuments.invalidate();
    },
  });
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [rerenderKey, setRerenderKey] = useState<number>(0);
  const [files, setFiles] = useState<File[]>([]);

  const dropZoneConfig = {
    maxFiles: 1,
    maxSize: 1024 * 1024 * 10, // kb * mb * n
    multiple: false,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const { remarks } = values;
    if (!files || files.length === 0) return;
    const body = new FormData();
    files.forEach((file) => {
      body.append("files", file);
    });
    body.append("projectId", applicationId);
    body.append("formName", "Document Validation");

    const uploadPromise = new Promise(async (resolve, reject) => {
      try {
        setIsUploading(true);
        // TODO MUST USE TRPC FORM DATA
        const response = await fetch("/api/files/upload", {
          method: "POST",
          body,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const formatObject = {
          id: document.documentsValidations[0].id,
          remarks,
          fileName: files[0]?.name,
          fileSize: files[0]?.size,
          fileType: files[0]?.type,
        };

        const mutationResult = await mutate.mutateAsync(formatObject);
        resolve(mutationResult);
        form.reset();
        setFiles([]);
        setIsDialogOpen(!isDialogOpen);
        setIsUploading(false);
        setRerenderKey((prev) => prev + 1);
      } catch (error) {
        reject(error);
        setIsUploading(false);
      }
    });

    toast.promise(uploadPromise, {
      loading: "Uploading document...",
      success: "Document uploaded successfully!",
      error: "Failed to upload document",
    });
  }

  async function onReject(id: string) {
    const promise = mutateReject.mutateAsync(id);
    toast.promise(promise, {
      loading: "Rejecting document...",
      success: "Document rejected successfully!",
      error: "Failed to reject document",
    });
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Eye />
          Validate
        </Button>
      </DialogTrigger>
      <DialogContent
        key={rerenderKey}
        className="flex flex-col gap-0 p-0 sm:max-h-[min(740px,80vh)] sm:max-w-4xl [&>button:last-child]:top-3.5"
      >
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Validate Document</DialogTitle>
          <DialogDescription>
            Review and validate the document. Add remarks and upload any
            necessary validation files.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium">Document Details</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Title: {document.title}</p>
                <p>Uploaded by: {document.userAccount.name}</p>
                <p>
                  Uploaded on:{" "}
                  {formatDate(document.createdAt, "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6 w-full"
              >
                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add your comments, requirements, or validation notes..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="files"
                  render={() => (
                    <FormItem>
                      <FormLabel>Select File</FormLabel>
                      <FormControl>
                        <FileUploader
                          value={files}
                          onValueChange={(newFiles) => {
                            const safeFiles = newFiles ?? [];
                            setFiles(safeFiles);
                            form.setValue("files", safeFiles, {
                              shouldValidate: true,
                            });
                          }}
                          dropzoneOptions={dropZoneConfig}
                          className="relative bg-background rounded-lg p-2"
                        >
                          <FileInput
                            id="fileInput"
                            className="outline-dashed outline-1 outline-slate-500"
                          >
                            <div className="flex items-center justify-center flex-col p-8 w-full ">
                              <CloudUpload className="text-gray-500 w-10 h-10" />
                              <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-semibold">
                                  Click to upload
                                </span>
                                &nbsp; or drag and drop
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                PDF, DOCX, or XLSX
                              </p>
                            </div>
                          </FileInput>
                          <FileUploaderContent>
                            {files &&
                              files.length > 0 &&
                              files.map((files, i) => (
                                <FileUploaderItem key={i} index={i}>
                                  <Paperclip className="h-4 w-4 stroke-current" />
                                  <span>{files.name}</span>
                                </FileUploaderItem>
                              ))}
                          </FileUploaderContent>
                        </FileUploader>
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={() => onReject(document.documentsValidations[0]?.id)}
            disabled={
              document.documentsValidations[0]?.validationStatus === "approved"
            }
          >
            Reject
          </Button>
          <Button
            onClick={() => form.handleSubmit(onSubmit)()}
            disabled={isUploading}
          >
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
