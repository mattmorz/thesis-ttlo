import { useState } from "react";

export function useFormSubmission() {
  const [isSubmitting] = useState(false);
  const [registryId] = useState<string | null>(null);

  const submitForm = async (registryId: string) => {
    throw new Error("Mock useFormSubmission hook is disabled in production.");
  };

  const registerAndSubmitForm = async (params: any) => {
    throw new Error("Mock useFormSubmission hook is disabled in production.");
  };

  return {
    isSubmitting,
    registryId,
    submitForm,
    registerAndSubmitForm,
  };
}
