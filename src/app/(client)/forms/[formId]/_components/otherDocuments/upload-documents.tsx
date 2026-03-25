"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, FileText, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import {
  FormItem,
  FormLabel,
  FormDescription,
  FormField,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { useParams } from "next/navigation";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { useActiveApplication } from "@/features/client/form-integration/hooks/useActiveApplication";

// Add interface at the top part of the file with other interfaces
interface FileWithMetadata extends Partial<File> {
  // Standard File properties that might be from a File object or created manually
  name: string;
  size?: number;
  type?: string;
  lastModified?: number;

  // Path-based file properties (from dropzone)
  path?: string;

  // Our custom metadata
  title?: string;
  description?: string;

  // Original file reference (may be a File object or object with path)
  _file?: File | { path: string };
}

function UploadDocuments() {
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<FileWithMetadata[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const params = useParams();
  const paramFormId = params.formId;
  const formId =
    typeof paramFormId === "string"
      ? paramFormId
      : Array.isArray(paramFormId)
      ? paramFormId[0]
      : null;

  // Get the active application ID for multi-IP application support
  const { activeApplicationId, activeApplication, isLoading } =
    useActiveApplication();

  // Debug logging
  useEffect(() => {
    console.log("[OtherDocuments] Form ID:", formId);
    console.log("[OtherDocuments] Active Application ID:", activeApplicationId);
    console.log("[OtherDocuments] Active Application:", activeApplication);
    console.log("[OtherDocuments] Loading state:", isLoading);
  }, [formId, activeApplicationId, activeApplication, isLoading]);

  const onDrop = useCallback(
    (
      acceptedFiles: Array<
        | File
        | {
            path: string;
            name?: string;
            size?: number;
            type?: string;
            lastModified?: number;
          }
      >
    ) => {
      console.log("[OtherDocuments] Files dropped:", acceptedFiles.length);
      console.log("[OtherDocuments] Raw dropped files:", acceptedFiles);

      // Process files and convert them to our FileWithMetadata format
      const filesWithMetadata = acceptedFiles
        .map((file) => {
          // Check if it's a standard File object
          const isStandardFile = file instanceof File;

          // Check if it's a path-based file object (from dropzone)
          const isPathBasedFile =
            !isStandardFile && typeof (file as any).path === "string";

          if (isStandardFile) {
            console.log(
              "[OtherDocuments] Processing standard File object:",
              file.name
            );
            // Create a new object with File properties plus our metadata
            return {
              name: file.name,
              size: file.size,
              type: file.type,
              lastModified: file.lastModified,
              // Store the ACTUAL File object (not just a reference to it)
              _file: file,
              title: "",
              description: "",
            } as FileWithMetadata;
          } else if (isPathBasedFile) {
            // Handle path-based file object
            const typedFile = file as {
              path: string;
              size?: number;
              type?: string;
            };
            const fileName =
              typedFile.path.split("/").pop() ||
              typedFile.path.split("\\").pop() ||
              typedFile.path;
            console.log(
              `[OtherDocuments] Processing path-based file: ${fileName}`
            );

            return {
              // Create FileWithMetadata object with path
              path: typedFile.path,
              name: fileName,
              size: typedFile.size || 0,
              type: typedFile.type || "application/octet-stream",
              // Store FULL path object
              _file: { path: typedFile.path },
              title: "",
              description: "",
            } as FileWithMetadata;
          } else {
            console.warn("[OtherDocuments] Unknown file object type:", file);
            // Return null for filtering out later
            return null;
          }
        })
        .filter(Boolean) as FileWithMetadata[]; // Filter out null values

      if (filesWithMetadata.length === 0) {
        console.warn("[OtherDocuments] No valid files after processing");
        return;
      }

      console.log(
        "[OtherDocuments] Adding files with metadata:",
        filesWithMetadata.length
      );
      setSelectedFiles((prev) => [...prev, ...filesWithMetadata]);
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
    maxSize: 5 * 1024 * 1024, // 5MB max file size
  });

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const updateFileMetadata = (
    index: number,
    field: "title" | "description",
    value: string
  ) => {
    const updatedFiles = [...selectedFiles];
    updatedFiles[index] = {
      ...updatedFiles[index],
      [field]: value,
    };
    setSelectedFiles(updatedFiles);
  };

  const simulateUploadProgress = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        setIsUploading(false);
        setSelectedFiles([]);

        toast({
          title: "Upload successful",
          description: "Your documents have been saved successfully.",
        });
      }
    }, 300);
  };

  const handleUpload = async () => {
    console.log("[OtherDocuments] Starting upload process...");
    console.log(
      "[OtherDocuments] Active App ID at upload time:",
      activeApplicationId
    );
    console.log("[OtherDocuments] Form ID at upload time:", formId);
    console.log(
      "[OtherDocuments] Selected files:",
      selectedFiles.map((f) => {
        // Add detailed logging for each file
        return {
          name: f.name,
          size: f.size,
          hasPath: !!f.path,
          hasFileObj: !!f._file,
          fileObjType: f._file
            ? f._file instanceof File
              ? "File"
              : "PathObj"
            : "None",
        };
      })
    );

    if (selectedFiles.length === 0) {
      console.warn("[OtherDocuments] No files selected for upload");
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload.",
        variant: "destructive",
      });
      return;
    }

    if (!activeApplicationId) {
      console.error("[OtherDocuments] No active application ID available");
      toast({
        title: "No active application",
        description:
          "Please select an IP application before uploading documents.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create a FormData object to send the files
      const formData = new FormData();

      // Only add formId if it exists
      if (formId) {
        formData.append("formId", formId);
      }

      formData.append("ipApplicationId", activeApplicationId);

      // Check if files are valid before appending
      let validFiles = 0;

      // Log what we're sending to the API
      console.log("[OtherDocuments] Form data prepared with:");
      console.log("- formId:", formData.get("formId") || "Not provided");
      console.log("- ipApplicationId:", formData.get("ipApplicationId"));
      console.log("- Total files:", selectedFiles.length);

      // Append files one by one with validation
      for (let index = 0; index < selectedFiles.length; index++) {
        const file = selectedFiles[index];

        console.log(
          `[OtherDocuments] Processing file at index ${index}:`,
          file
        );

        // Check if we have a path-based file (not a standard File object)
        // First check if file._file is a File object
        const hasProperFileObject = file._file instanceof File;

        // Check for path in _file or in file
        const filePathInFileObj =
          file._file &&
          "path" in file._file &&
          typeof file._file.path === "string";
        const filePathInMain = typeof file.path === "string";

        // Then check if it's a path-based object
        const isPathBasedFile = filePathInFileObj || filePathInMain;

        if (!file || (!file.name && !isPathBasedFile)) {
          console.warn(
            `[OtherDocuments] Invalid file at index ${index}:`,
            file
          );
          continue;
        }

        // Handle proper File object in _file
        if (hasProperFileObject) {
          const typedFile = file._file as File;
          console.log(
            `[OtherDocuments] Adding standard file from _file:`,
            typedFile.name,
            typedFile.size,
            "bytes"
          );

          try {
            formData.append("files", typedFile);
            validFiles++;

            // Add title and description as separate fields
            const fileWithMeta = file as unknown as FileWithMetadata;
            formData.append(`title-${index}`, fileWithMeta.title || "");
            formData.append(
              `description-${index}`,
              fileWithMeta.description || ""
            );
          } catch (e) {
            console.error(
              `[OtherDocuments] Error appending file to FormData:`,
              e
            );
          }
          continue;
        }

        // For path-based file (or file with only _file.path), create appropriate blob
        if (
          isPathBasedFile ||
          (file._file &&
            typeof file._file === "object" &&
            "path" in file._file &&
            !hasProperFileObject)
        ) {
          // Extract filename from path - use type assertion with narrowing check
          let pathStr: string;
          if (filePathInFileObj && file._file && "path" in file._file) {
            pathStr = file._file.path as string;
          } else if (filePathInMain) {
            pathStr = file.path as string;
          } else {
            console.warn(
              `[OtherDocuments] Could not determine file path for: ${file.name}`
            );
            continue;
          }

          // Create a proper File-like object from the path
          const fileName =
            file.name ||
            pathStr.split("/").pop() ||
            pathStr.split("\\").pop() ||
            `file-${index}`;

          console.log(
            `[OtherDocuments] Processing path-based file: ${fileName}`
          );
          console.log(`[OtherDocuments] Using path: ${pathStr}`);

          // Create a real blob with actual data if available, or empty blob as fallback
          let fileBlob: Blob;
          try {
            // Check if we have actual file data from the _file object
            if (file._file && file._file instanceof Blob) {
              fileBlob = file._file;
            } else {
              // Create an empty blob with the correct MIME type
              fileBlob = new Blob(["[File content placeholder]"], {
                type: file.type || "application/octet-stream",
              });
            }

            // Create a proper File object from the blob
            const fileObject = new File([fileBlob], fileName, {
              type: file.type || "application/octet-stream",
              lastModified: file.lastModified || Date.now(),
            });

            // Add the file to FormData
            formData.append("files", fileObject);

            // Add metadata fields
            formData.append(`title-${index}`, file.title || fileName);
            formData.append(`description-${index}`, file.description || "");

            // Add path information for server reference
            formData.append(`fileName-${index}`, fileName);
            formData.append(`filePath-${index}`, pathStr);

            validFiles++;
            console.log(
              `[OtherDocuments] Added file-like object for: ${fileName}`
            );
          } catch (e) {
            console.error(`[OtherDocuments] Error creating file object:`, e);
          }
          continue;
        }

        // Standard File object handling (as a fallback)
        if (file instanceof File) {
          console.log(
            `[OtherDocuments] Adding standard file as fallback:`,
            file.name,
            file.size,
            "bytes"
          );

          try {
            formData.append("files", file);
            validFiles++;

            // Add title and description as separate fields using the FileWithMetadata type
            const fileWithMeta = file as unknown as FileWithMetadata;
            formData.append(`title-${index}`, fileWithMeta.title || "");
            formData.append(
              `description-${index}`,
              fileWithMeta.description || ""
            );
          } catch (e) {
            console.error(
              `[OtherDocuments] Error appending file to FormData:`,
              e
            );
          }
          continue;
        }

        // If we reach here, try to create a Blob from file data as a last resort
        try {
          console.log(
            `[OtherDocuments] Attempting to create Blob from file data for: ${file.name}`
          );

          // Create a text representation of file metadata to include in blob
          const fileMetaString = JSON.stringify({
            name: file.name,
            type: file.type,
            size: file.size,
          });

          // Create a blob with the metadata string
          const fileBlob = new Blob([fileMetaString], {
            type: file.type || "application/octet-stream",
          });
          formData.append("files", fileBlob, file.name);
          formData.append(`title-${index}`, file.title || file.name);
          formData.append(`description-${index}`, file.description || "");
          validFiles++;
        } catch (e) {
          console.error(`[OtherDocuments] Failed to create Blob from file:`, e);
        }
      }

      // Check if we have valid files to upload
      if (validFiles === 0) {
        throw new Error("No valid files to upload");
      }

      console.log(
        `[OtherDocuments] Added ${validFiles} valid files to FormData`
      );
      console.log("[OtherDocuments] Sending upload request to API...");

      // Call the upload API
      const response = await fetch("/api/documents/other/upload", {
        method: "POST",
        body: formData,
      });

      console.log("[OtherDocuments] API response status:", response.status);

      // Get response text for debugging regardless of status
      const responseText = await response.text();
      console.log("[OtherDocuments] API response text:", responseText);

      // Parse the response text if possible
      let result;
      try {
        result = JSON.parse(responseText);
        console.log("[OtherDocuments] Parsed API response:", result);
      } catch (parseError) {
        console.error(
          "[OtherDocuments] Error parsing API response:",
          parseError
        );
        throw new Error("Invalid response format from server");
      }

      if (!response.ok) {
        console.error(
          "[OtherDocuments] Upload request failed with status:",
          response.status
        );
        throw new Error(
          result.error ||
            result.details ||
            `Upload failed with status ${response.status}`
        );
      }

      if (result.success) {
        console.log(
          "[OtherDocuments] Upload successful, simulating progress..."
        );

        // Check if any files were actually processed successfully
        if (result.files && result.files.length > 0) {
          // Show progress and reset state
          simulateUploadProgress();
        } else {
          console.warn(
            "[OtherDocuments] No files were processed by the server"
          );
          toast({
            title: "Upload completed, but no files were processed",
            description: "Please try again with different files",
            variant: "default",
          });
          setIsUploading(false);
        }
      } else {
        console.error(
          "[OtherDocuments] Upload failed with error:",
          result.error
        );
        throw new Error(result.error || result.details || "Upload failed");
      }
    } catch (error) {
      console.error("[OtherDocuments] Error during upload process:", error);
      setIsUploading(false);
      setUploadProgress(0);

      toast({
        title: "Upload failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
  <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
      <FormItem className="space-y-2">
        <FormLabel className="text-base font-medium">Document Upload</FormLabel>
        <FormDescription>
          Upload any additional documents required for your TTLO submission.
          Accepted file formats include PDF, DOC, DOCX, XLS, XLSX, and JPG.
        </FormDescription>
      </FormItem>

      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed border-green-200 rounded-md p-6 bg-green-50/50 transition-colors hover:bg-green-50 cursor-pointer",
          isDragActive && "border-green-400 bg-green-50"
        )}
      >
        <div className="flex flex-col items-center justify-center">
          <Upload className="h-10 w-10 text-green-600 mb-3" />
          <h3 className="text-lg font-medium mb-1">Drag & Drop Files</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center">
            Drop your files here or click to browse your computer
          </p>
          <Input {...getInputProps()} disabled={isUploading} />
          <Button
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700"
            onClick={(e) => {
              e.stopPropagation();
              document.getElementById("document-upload")?.click();
            }}
            disabled={isUploading}
          >
            Select Files
          </Button>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <FormLabel className="text-base font-medium">
            Selected Files
          </FormLabel>
          <Separator className="my-2" />
          <ScrollArea className="max-h-[420px] rounded-md border p-2">
            <div className="space-y-4">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="bg-white rounded-md border p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-green-50 p-2 rounded-md mr-3">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {file.name || `File ${index + 1}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {file.size
                            ? `${(file.size / 1024).toFixed(2)} KB`
                            : "Size unknown"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={isUploading}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Title field */}
                  <div className="space-y-1">
                    <FormLabel
                      className="text-sm"
                      htmlFor={`file-title-${index}`}
                    >
                      Title
                    </FormLabel>
                    <Input
                      id={`file-title-${index}`}
                      placeholder="Enter document title"
                      value={file.title || ""}
                      onChange={(e) =>
                        updateFileMetadata(index, "title", e.target.value)
                      }
                      disabled={isUploading}
                    />
                  </div>

                  {/* Description field */}
                  <div className="space-y-1">
                    <FormLabel
                      className="text-sm"
                      htmlFor={`file-description-${index}`}
                    >
                      Description
                    </FormLabel>
                    <Textarea
                      id={`file-description-${index}`}
                      placeholder="Enter document description (optional)"
                      value={file.description || ""}
                      onChange={(e) =>
                        updateFileMetadata(index, "description", e.target.value)
                      }
                      disabled={isUploading}
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {isUploading && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <FormLabel>Upload Progress</FormLabel>
            <span className="text-sm font-medium text-green-600">
              {uploadProgress}%
            </span>
          </div>
          <Progress
            value={uploadProgress}
            className="h-2"
            indicatorClassName="bg-green-600"
          />
        </div>
      )}

      {selectedFiles.length > 0 && !isUploading && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Ready to upload</AlertTitle>
          <AlertDescription className="text-amber-700">
            {selectedFiles.length} file(s) selected and ready to be uploaded.
            Click the upload button to proceed.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button
          className="bg-green-600 hover:bg-green-700 text-white min-w-[150px]"
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || isUploading}
        >
          {isUploading ? (
            <div className="flex items-center gap-2">
              <span className="animate-pulse">Uploading...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span>Upload Documents</span>
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}

// For backwards compatibility
export const UploadDocumentsTab = UploadDocuments;

// Default export for dynamic import
export default UploadDocuments;
