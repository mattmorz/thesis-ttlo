import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  checkAndRegisterFormSubmission,
  addFormDataFields,
  submitFormForProcessing,
} from "../services/form-submission-service";

interface UseFormSubmissionProps {
  onSuccess?: () => void;
  redirectOnSuccess?: string;
}

export function useFormSubmission({
  onSuccess,
  redirectOnSuccess,
}: UseFormSubmissionProps = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registryId, setRegistryId] = useState<string | null>(null);
  const router = useRouter();

  // Submit an existing form registration
  const submitForm = async (registryId: string) => {
    try {
      const submissionToastId = "submitting-form";
      toast.loading("Submitting your form...", { id: submissionToastId });

      const result = await submitFormForProcessing(registryId);

      toast.success("Form submitted successfully", { id: submissionToastId });

      if (onSuccess) {
        onSuccess();
      }

      if (redirectOnSuccess) {
        router.push(redirectOnSuccess);
      }

      return result;
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to submit form", {
        description:
          "Please try again or contact support if the issue persists.",
      });
      throw error;
    }
  };

  // Register and optionally submit a form in one step
  const registerAndSubmitForm = async (params: {
    userId: string;
    sourceType: string;
    sourceId: string;
    ipApplicationId?: string;
    formData: Record<string, any>;
    formState?: string;
    title?: string;
    description?: string;
    inventorsCreators?: any[];
    applicants?: any[];
  }) => {
    setIsSubmitting(true);

    try {
      // Show registration toast
      const registrationToastId = "registering-form";
      toast.loading("Registering your form...", { id: registrationToastId });

      // First check if registry already exists and create if not
      const { registryId, existed } = await checkAndRegisterFormSubmission({
        userId: params.userId,
        sourceType: params.sourceType as any,
        sourceId: params.sourceId,
        ipApplicationId: params.ipApplicationId,
        title: params.title,
        description: params.description,
        inventorsCreators: params.inventorsCreators,
        applicants: params.applicants,
      });

      // Update toast based on whether we found an existing entry or created a new one
      if (existed) {
        toast.success("Found existing form registration", {
          id: registrationToastId,
        });
      } else {
        toast.success("Form registered successfully", {
          id: registrationToastId,
        });
      }

      // Then add the form data fields
      if (Object.keys(params.formData).length > 0) {
        const addFieldsToastId = "saving-form-data";
        toast.loading("Saving form data...", { id: addFieldsToastId });

        try {
          await addFormDataFields(
            registryId,
            Object.entries(params.formData).map(([key, value]) => ({
              fieldKey: key,
              fieldValue: typeof value === "string" ? value : undefined,
              fieldArrayValue: typeof value !== "string" ? value : undefined,
            }))
          );

          toast.success("Form data saved", { id: addFieldsToastId });
        } catch (error) {
          console.error("Error adding form data fields:", error);
          toast.error("Failed to save form data", { id: addFieldsToastId });
          throw error;
        }
      }

      // If there's a formState of 'submitted', process the form
      if (params.formState === "submitted") {
        await submitForm(registryId);
      }

      setRegistryId(registryId);
      setIsSubmitting(false);
      return registryId;
    } catch (error) {
      console.error("Form submission failed:", error);
      setIsSubmitting(false);
      toast.error("Form submission failed", {
        description:
          "Please try again or contact support if the issue persists.",
      });
      throw error;
    }
  };

  return {
    isSubmitting,
    registryId,
    submitForm,
    registerAndSubmitForm,
  };
}
