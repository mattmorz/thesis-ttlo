import { useState, useCallback } from "react";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import type { SourceType } from "@/lib/services/form-submission-service";
import { useRouter } from "next/navigation";
import { TRPCClientError } from "@trpc/client";
import { useActiveApplication } from "./useActiveApplication";

interface FormSubmissionOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  redirectOnSuccess?: string;
  showToasts?: boolean;
}

/**
 * Hook for managing form submission integration
 */
export function useFormSubmission(options: FormSubmissionOptions = {}) {
  const { onSuccess, onError, redirectOnSuccess, showToasts = true } = options;

  const [isRegistering, setIsRegistering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registryId, setRegistryId] = useState<string | null>(null);
  const router = useRouter();

  // Get the active application
  const { activeApplicationId } = useActiveApplication();

  // TRPC utils
  const utils = trpc.useUtils();

  // Mutations
  const registerMutation = trpc.formIntegration.registerSubmission.useMutation({
    onSuccess: (data) => {
      setRegistryId(data.registryId);
      if (showToasts) {
        toast.success("Form registered successfully");
      }
      onSuccess?.(data);
    },
    onError: (error) => {
      if (showToasts) {
        toast.error(`Error registering form: ${error.message}`);
      }
      if (onError) {
        const standardError = new Error(error.message);
        onError(standardError);
      }
    },
  });

  const submitMutation = trpc.formIntegration.submitForProcessing.useMutation({
    onSuccess: (data) => {
      if (showToasts) {
        toast.success("Form submitted successfully");
      }

      // Invalidate queries to ensure data is fresh
      utils.formIntegration.getUserSubmissions.invalidate();

      // Handle redirect if provided
      if (redirectOnSuccess) {
        router.push(redirectOnSuccess);
      }

      onSuccess?.(data);
    },
    onError: (error) => {
      if (showToasts) {
        toast.error(`Error submitting form: ${error.message}`);
      }
      if (onError) {
        const standardError = new Error(error.message);
        onError(standardError);
      }
    },
  });

  /**
   * Submit a previously registered form for processing
   */
  const submitForm = useCallback(
    async (formRegistryId: string) => {
      setIsSubmitting(true);
      try {
        console.log("[FormSubmission] Submitting form:", formRegistryId);
        return await submitMutation.mutateAsync({
          registryId: formRegistryId,
        });
      } catch (error) {
        console.error("[FormSubmission] Submission error:", error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [submitMutation]
  );

  /**
   * Register a form submission and optionally submit it immediately
   */
  const registerForm = useCallback(
    async (
      userId: string,
      sourceType: SourceType,
      sourceId: string,
      data?: {
        title?: string;
        description?: string;
        inventorsCreators?: Array<{ name: string; role?: string }>;
        applicants?: Array<{ name: string; role?: string }>;
        applicationId?: string;
      },
      submitImmediately = false
    ) => {
      if (!activeApplicationId) {
        throw new Error(
          "No application selected. Please create or select an application first."
        );
      }

      setIsRegistering(true);
      try {
        console.log("[FormSubmission] Registering form:", {
          userId,
          sourceType,
          sourceId,
          applicationId: activeApplicationId,
        });

        const result = await registerMutation.mutateAsync({
          userId,
          sourceType,
          sourceId,
          applicationId: activeApplicationId,
          ...data,
        });

        if (submitImmediately && result.registryId) {
          await submitForm(result.registryId);
        }

        return result;
      } catch (error) {
        console.error("[FormSubmission] Registration error:", error);
        throw error;
      } finally {
        setIsRegistering(false);
      }
    },
    [activeApplicationId, registerMutation, submitForm]
  );

  /**
   * Simplified version of registerForm that doesn't require userId
   * This is useful for direct form registry calls
   */
  const registerFormDirect = useCallback(
    async (data: {
      sourceType: SourceType;
      sourceId: string;
      ipApplicationId: string;
      title?: string;
      description?: string;
      status?: string;
      inventorsCreators?: Array<{ name: string; role?: string }>;
      applicants?: Array<{ name: string; role?: string }>;
    }) => {
      try {
        console.log("[FormSubmission] Registering form directly:", data);

        // Call the form registry API directly
        const response = await fetch("/api/form-registry", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to register form");
        }

        const result = await response.json();
        console.log("[FormSubmission] Form registered successfully:", result);

        if (result.data?.registryId) {
          setRegistryId(result.data.registryId);
        }

        if (showToasts) {
          toast.success("Form registered successfully");
        }

        onSuccess?.(result.data);

        return result.data;
      } catch (error) {
        console.error("[FormSubmission] Error registering form:", error);

        if (showToasts) {
          toast.error(
            `Error registering form: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }

        if (onError && error instanceof Error) {
          onError(error);
        }

        throw error;
      }
    },
    [onSuccess, onError, showToasts]
  );

  /**
   * Check if a form has already been registered
   */
  const getFormBySource = useCallback(
    async (
      sourceType: SourceType,
      sourceId: string,
      applicationId?: string
    ) => {
      const queryParams = {
        sourceType,
        sourceId,
        ...(applicationId || activeApplicationId
          ? { applicationId: applicationId || activeApplicationId }
          : {}),
      };

      console.log("[FormSubmission] Checking form by source:", queryParams);
      return await utils.client.formIntegration.getBySource.query(queryParams);
    },
    [activeApplicationId, utils.client.formIntegration.getBySource]
  );

  /**
   * Register and submit in one step
   */
  const registerAndSubmitForm = useCallback(
    async (
      userId: string,
      sourceType: SourceType,
      sourceId: string,
      data?: {
        title?: string;
        description?: string;
        inventorsCreators?: Array<{ name: string; role?: string }>;
        applicants?: Array<{ name: string; role?: string }>;
        applicationId?: string;
      }
    ) => {
      return await registerForm(userId, sourceType, sourceId, data, true);
    },
    [registerForm]
  );

  // Add a method to check if a form registry entry exists
  const checkFormExists = async (
    sourceType: string,
    applicationId: string,
    sourceId?: string
  ) => {
    try {
      // Use URL without any variables that may not exist
      const url = new URL("/api/form-registry/check", window.location.origin);
      url.searchParams.append("sourceType", sourceType);
      url.searchParams.append("ipApplicationId", applicationId);
      if (sourceId) {
        url.searchParams.append("sourceId", sourceId);
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to check form registry");
      }

      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error("Error checking form registry:", error);
      throw error;
    }
  };

  return {
    registerForm,
    registerFormDirect,
    submitForm,
    registerAndSubmitForm,
    getFormBySource,
    checkFormExists,
    isRegistering,
    isSubmitting,
    registryId,
    isLoading: isRegistering || isSubmitting,
    activeApplicationId,
  };
}
