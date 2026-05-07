"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button, type ButtonProps } from "@/components/ui/button";

type DriveUploadConfig = {
  formId: string;
  ipApplicationId?: string | null;
  formName: string;
  category?: string;
  description?: string;
};

type DriveUploadResult = {
  success: boolean;
  result?: unknown;
  error?: string;
};

export async function uploadFilesToDrive(
  config: DriveUploadConfig & { files?: File[] }
): Promise<DriveUploadResult> {
  const { files, formId, ipApplicationId, formName, category, description } =
    config;

  if (!files || files.length === 0) {
    return { success: false, error: "Please attach at least one file to upload" };
  }

  if (!ipApplicationId) {
    return {
      success: false,
      error: "Please select an IP application before uploading",
    };
  }

  const formData = new FormData();
  formData.append("formId", formId || "");
  formData.append("ipApplicationId", ipApplicationId);
  formData.append("formName", formName);

  files.forEach((file, index) => {
    formData.append("files", file);
    formData.append(`title-${index}`, file.name || "Uploaded file");
    formData.append(
      `description-${index}`,
      description || "Uploaded file"
    );
    if (category) {
      formData.append(`category-${index}`, category);
    }
  });

  console.log("[DriveUpload] Sending upload request", {
    formId,
    ipApplicationId,
    formName,
    category,
    description,
    fileCount: files.length,
    fileNames: files.map((file) => file.name),
  });

  const response = await fetch("/api/documents/other/upload", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  console.log("[DriveUpload] Upload response status:", response.status);

  const responseText = await response.text();
  let result: any = null;
  try {
    result = JSON.parse(responseText);
  } catch {
    // Response may not be JSON; handled below.
  }

  if (!response.ok) {
    console.error(
      `[DriveUpload] Upload failed: status=${response.status}, error=${
        result?.error || "none"
      }, details=${result?.details || "none"}, raw=${responseText}`
    );
  } else {
    console.log(
      "[DriveUpload] Upload response payload:",
      JSON.stringify(result)
    );
  }

  if (!response.ok) {
    const errorMessage =
      result?.details ||
      result?.error ||
      `Upload failed with status ${response.status}`;
    return { success: false, error: errorMessage, result };
  }

  if (!result?.success) {
    return { success: false, error: result?.error || "Upload failed", result };
  }

  return { success: true, result };
}

type DriveUploadOptions = {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (result: unknown) => void;
  onError?: (error: Error) => void;
};

export function useDriveUpload(
  config: DriveUploadConfig,
  options?: DriveUploadOptions
) {
  const [isUploading, setIsUploading] = React.useState(false);

  const upload = React.useCallback(
    async (files?: File[]) => {
      if (isUploading) {
        return { success: false, error: "Upload already in progress" };
      }

      setIsUploading(true);
      try {
        const result = await uploadFilesToDrive({ ...config, files });

        if (!result.success) {
          toast.error(result.error || options?.errorMessage || "Upload failed");
          if (result.error) {
            options?.onError?.(new Error(result.error));
          }
          return result;
        }

        toast.success(options?.successMessage || "Files uploaded successfully");
        options?.onSuccess?.(result.result);
        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to upload files";
        toast.error(options?.errorMessage || message);
        options?.onError?.(error as Error);
        return { success: false, error: message };
      } finally {
        setIsUploading(false);
      }
    },
    [config, isUploading, options]
  );

  return { isUploading, upload };
}

type DriveUploadButtonProps = {
  files?: File[];
  uploader: ReturnType<typeof useDriveUpload>;
  buttonText?: string;
  uploadingText?: string;
  className?: string;
  disabled?: boolean;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
};

export function DriveUploadButton({
  files,
  uploader,
  buttonText = "Upload to Drive",
  uploadingText = "Uploading...",
  className,
  disabled,
  variant,
  size,
}: DriveUploadButtonProps) {
  const hasFiles = (files?.length ?? 0) > 0;

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={disabled || uploader.isUploading || !hasFiles}
      onClick={() => uploader.upload(files)}
    >
      {uploader.isUploading ? uploadingText : buttonText}
    </Button>
  );
}
