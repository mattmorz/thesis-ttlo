import {
  FileText,
  FileArchive,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";

type DOCUMENT_CATEGORY = {
  [key: string]: { icon: LucideIcon; label: string };
};

export const DOCUMENT_CATEGORIES: DOCUMENT_CATEGORY = {
  forms: {
    icon: FileText,
    label: "Forms",
  },
  attachments: {
    icon: FileArchive,
    label: "Attachments",
  },
  requirements: {
    icon: ClipboardCheck,
    label: "Requirements",
  },
} as const;

export type DocumentCategory = keyof typeof DOCUMENT_CATEGORIES;
