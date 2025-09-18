import { FC } from "react";

interface FileUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  maxSize?: number;
  className?: string;
}

export declare const FileUpload: FC<FileUploadProps>;
