import { useState } from "react";
import { ProjectDocument } from "@/app/(admin)/admin/client-proj-dash/types";

interface DocumentAction {
  loading: boolean;
  error: string | null;
  success: boolean;
}

export function useDocumentActions() {
  const [actionState, setActionState] = useState<DocumentAction>({
    loading: false,
    error: null,
    success: false,
  });

  const uploadDocument = async (
    files: File[],
    metadata: Partial<ProjectDocument>
  ) => {
    setActionState({
      loading: false,
      error: "Not implemented in production environment.",
      success: false,
    });
    return false;
  };

  const validateDocument = async (
    documentId: string,
    status: "verified" | "rejected",
    remarks: string,
    validationFile?: File
  ) => {
    setActionState({
      loading: false,
      error: "Not implemented in production environment.",
      success: false,
    });
    return false;
  };

  const cancelValidation = async (documentId: string) => {
    setActionState({
      loading: false,
      error: "Not implemented in production environment.",
      success: false,
    });
    return false;
  };

  return {
    actionState,
    uploadDocument,
    validateDocument,
    cancelValidation,
  };
}
