"use client";
import { Label, Switch } from "@/components/ui";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { DialogTrigger } from "@radix-ui/react-dialog";
import {
  ClipboardCheck,
  CloudUpload,
  FileArchive,
  FileText,
  Paperclip,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const documentCategory = [
  {
    value: "forms",
    label: "Forms",
    description: "Application forms and official documents",
    Icon: FileText,
  },
  {
    value: "attachments",
    label: "Attachments",
    description: "Supporting documents and files",
    Icon: FileArchive,
  },
  {
    value: "requirements",
    label: "Requirements",
    description: "Required documentation and certifications",
    Icon: ClipboardCheck,
  },
];

const documentType = ["application", "contract", "report", "form"] as const;

const formSchema = z.object({
  title: z.string().min(1),
  type: z.enum(["application", "contract", "report", "form"], {
    message: "Please select a document type.",
  }),
  description: z.string().optional(),
  category: z.enum(["forms", "attachments", "requirements"], {
    message: "Please select a document category.",
  }),
  files: z.array(z.instanceof(File)).min(1, "At least one files is required"),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  fileType: z.string().optional(),
  requires_validation: z.boolean().default(false).optional(),
});

interface DocumentUploadDialogProps {
  applicationId: string;
}

export function DocumentUploadDialog({
  applicationId,
}: DocumentUploadDialogProps) {
  const trpcUtil = trpc.useUtils();
  const mutate = trpc.projects.uploadDocument.useMutation();
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
    const { title, type, description, category, requires_validation } = values;
    if (!files || files.length === 0) return;
    const body = new FormData();
    files.forEach((file) => {
      body.append("files", file);
    });
    body.append("projectId", applicationId);

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
          applicationId,
          title,
          type,
          description,
          category,
          requires_validation,
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
      success: () => {
        trpcUtil.projects.getDocuments.invalidate();
        return "Document uploaded successfully!";
      },
      error: "Failed to upload document",
    });
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent
        key={rerenderKey}
        className="flex flex-col gap-0 p-0 sm:max-h-[min(740px,80vh)] sm:max-w-4xl [&>button:last-child]:top-3.5"
      >
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Add a new document to the project. Required fields are marked with
            an asterisk (*).
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6 w-full"
              >
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter document title"
                              type=""
                              {...field}
                            />
                          </FormControl>

                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-6">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="capitalize">
                                <SelectValue placeholder="Select a document type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {documentType.map((type) => (
                                <SelectItem
                                  key={type}
                                  value={type}
                                  className="capitalize"
                                >
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add a brief description of the document..."
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
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <RadioGroup
                          className="grid grid-cols-3 gap-4"
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          {documentCategory.map((item) => (
                            <Label
                              key={item.value}
                              htmlFor={item.value}
                              className={`border-input ${
                                field.value === item.value
                                  ? "border-blue-500 bg-blue-50"
                                  : ""
                              } relative flex flex-col items-center gap-2 rounded-md border p-4 shadow-sm cursor-pointer transition-all peer-checked:border-blue-500`}
                            >
                              <RadioGroupItem
                                id={item.value}
                                value={item.value}
                                className="peer hidden"
                              />
                              <item.Icon
                                className={`text-gray-500 ${
                                  field.value === item.value
                                    ? "text-blue-500"
                                    : ""
                                }`}
                                size={24}
                              />
                              <span className="text-sm font-medium">
                                {item.label}
                              </span>
                              <p className="text-xs text-gray-500 text-center">
                                {item.description}
                              </p>
                            </Label>
                          ))}
                        </RadioGroup>
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

                <FormField
                  control={form.control}
                  name="requires_validation"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Requires Validation</FormLabel>
                        <FormDescription>
                          Enable if this document needs to be verified by an
                          admin
                        </FormDescription>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
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
