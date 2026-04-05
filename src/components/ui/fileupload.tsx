import React from "react";
import { useDropzone, DropzoneOptions } from "react-dropzone";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { X, FileText, Upload, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  value?: File[];
  onValueChange: (files: File[]) => void;
  dropzoneOptions?: DropzoneOptions;
  children: React.ReactNode;
  className?: string;
  multiple?: boolean;
  onRemove?: (index: number) => void;
}

interface FileProgressProps {
  progress: number;
  fileName: string;
  fileSize: string;
  onCancel?: () => void;
  status: "uploading" | "complete" | "error";
}

export function FileUploader({
  value = [],
  onValueChange,
  dropzoneOptions,
  children,
  className,
  multiple = true,
  onRemove,
}: FileUploaderProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    ...dropzoneOptions,
    multiple,
    onDrop: (acceptedFiles) => {
      if (multiple) {
        onValueChange([...value, ...acceptedFiles]);
      } else {
        onValueChange([acceptedFiles[0]]);
      }
    },
  });

  // Handle file removal
  const handleRemoveFile = (index: number) => {
    const newFiles = [...value];
    newFiles.splice(index, 1);
    onValueChange(newFiles);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-4 transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-muted",
          className
        )}
      >
        <input {...getInputProps()} />
        {children}
      </div>

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((file, index) => (
            <FileUploaderItem key={index} index={index}>
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 truncate">{file.name}</span>
              <span className="text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() =>
                  onRemove ? onRemove(index) : handleRemoveFile(index)
                }
              >
                <X className="h-4 w-4" />
              </Button>
            </FileUploaderItem>
          ))}
        </div>
      )}
    </div>
  );
}

export function FileProgress({
  progress,
  fileName,
  fileSize,
  onCancel,
  status,
}: FileProgressProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{fileName}</span>
          <span className="text-xs text-muted-foreground">({fileSize})</span>
        </div>
        <div className="flex items-center space-x-2">
          {status === "complete" && (
            <Check className="h-4 w-4 text-green-500" />
          )}
          {status === "uploading" && onCancel && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <Progress value={progress} className="h-1" />
    </div>
  );
}

export const FileInput = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={className}>{children}</div>;

export const FileUploaderContent = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center p-4 text-center">
    <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
    {children}
  </div>
);

export const FileUploaderItem = ({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}) => (
  <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
    {children}
  </div>
);

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
