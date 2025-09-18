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
    setActionState({ loading: true, error: null, success: false });
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock success response
      setActionState({ loading: false, error: null, success: true });
      return true;
    } catch (error) {
      setActionState({
        loading: false,
        error: "Failed to upload document",
        success: false,
      });
      return false;
    }
  };

  const validateDocument = async (
    documentId: string,
    status: "verified" | "rejected",
    remarks: string,
    validationFile?: File
  ) => {
    setActionState({ loading: true, error: null, success: false });
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In a real app, you would make an API call here
      // await api.validateDocument(documentId, status, remarks, validationFile);

      setActionState({ loading: false, error: null, success: true });
      return true;
    } catch (error) {
      setActionState({
        loading: false,
        error: "Failed to validate document",
        success: false,
      });
      return false;
    }
  };

  const cancelValidation = async (documentId: string) => {
    setActionState({ loading: true, error: null, success: false });
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In a real app, you would make an API call here
      // await api.cancelDocumentValidation(documentId);

      setActionState({ loading: false, error: null, success: true });
      return true;
    } catch (error) {
      setActionState({
        loading: false,
        error: "Failed to cancel validation",
        success: false,
      });
      return false;
    }
  };

  return {
    actionState,
    uploadDocument,
    validateDocument,
    cancelValidation,
  };
}
