import { RouterOutputs } from "@/trpc/client";

export type ProjectsGetResult = RouterOutputs["projects"]["get"][number];

export type DocumentsGetResult =
  RouterOutputs["projects"]["getDocuments"][number];

export type ExtendedDocumentsGetResult = DocumentsGetResult & {
  documentsValidations: DocumentsGetResult["documentsValidations"][number];
};
