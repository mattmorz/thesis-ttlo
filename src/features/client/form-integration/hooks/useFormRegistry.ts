import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useActiveApplication } from "./useActiveApplication";

type FormType = "client_profile" | "substantial_use" | "deed_of_assignment";
type FormStatus = "draft" | "submitted" | "approved" | "rejected";

/**
 * Hook for registering forms in the central form registry
 * This is a standalone hook that can be used alongside existing form submission logic
 * without replacing or disrupting current functionality
 */
export function useFormRegistry() {
  const [isRegistering, setIsRegistering] = useState(false);
  const { activeApplicationId } = useActiveApplication();

  /**
   * Register a form in the form_submission_registry table
   * This creates or updates a registry entry without affecting the actual form data
   */
  const registerFormEntry = useCallback(
    async ({
      sourceType,
      sourceId,
      ipApplicationId,
      title,
      status = "draft",
      description,
      inventorsCreators,
      showToasts = false,
    }: {
      sourceType: FormType;
      sourceId: string;
      ipApplicationId?: string;
      title?: string;
      status?: FormStatus;
      description?: string;
      inventorsCreators?: Array<{
        firstName?: string;
        lastName?: string;
        middleInitial?: string;
        role?: string;
      }>;
      showToasts?: boolean;
    }) => {
      if (!ipApplicationId && !activeApplicationId) {
        console.error("No application ID found");
        return null;
      }

      setIsRegistering(true);

      try {
        // Format inventors/creators as needed by the registry
        const formattedInventors = inventorsCreators?.map((creator) => ({
          name: `${creator.firstName || ""} ${
            creator.middleInitial ? creator.middleInitial + "." : ""
          } ${creator.lastName || ""}`.trim(),
          role: creator.role || "Creator",
        }));

        // Prepare the registry entry data
        const registryData = {
          sourceType,
          sourceId,
          ipApplicationId: ipApplicationId || activeApplicationId,
          status,
          title: title || `${sourceType.replace(/_/g, " ")} form`,
          description:
            description || `${sourceType.replace(/_/g, " ")} form submission`,
          inventorsCreators: formattedInventors || [],
        };

        if (showToasts) {
          toast.loading("Registering form...");
        }

        // Call the API to register the form
        const response = await fetch("/api/form-registry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(registryData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to register form");
        }

        const result = await response.json();

        if (showToasts) {
          toast.success("Form registered successfully");
        }

        return result.data;
      } catch (error) {
        console.error("Error registering form:", error);
        if (showToasts) {
          toast.error(
            `Failed to register form: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
        return null;
      } finally {
        setIsRegistering(false);
      }
    },
    [activeApplicationId]
  );

  return {
    registerFormEntry,
    isRegistering,
  };
}
