import { toast } from "sonner";

/**
 * Types for form submission service
 */
export type SourceType =
  | "client_profile"
  | "ip_disclosure"
  | "substantial_use"
  | "deed_of_assignment"
  | "other_document";

export interface FormSubmissionData {
  userId: string;
  sourceType: SourceType;
  sourceId: string;
  title?: string;
  description?: string;
  inventorsCreators?: Array<{ name: string; role?: string }>;
  applicants?: Array<{ name: string; role?: string }>;
  ipApplicationId?: string;
}

export interface FormDataField {
  fieldKey: string;
  fieldValue?: string;
  fieldArrayValue?: any[];
}

/**
 * Local mock of form submission service for client-side use
 * This prevents errors when used in browser context
 */

/**
 * Register a new form submission to track in the system
 * This creates a draft entry that can be submitted later
 */
export async function registerFormSubmission(data: FormSubmissionData) {
  try {
    // In client-side, we'll simulate the response
    const mockResult = {
      registryId: `mock-${Date.now()}`,
      userId: data.userId,
      sourceType: data.sourceType,
      sourceId: data.sourceId,
      ipApplicationId: data.ipApplicationId,
      status: "draft",
    };

    return mockResult;
  } catch (error) {
    console.error("Error registering form submission:", error);
    toast.error("Error registering form submission");
    throw error;
  }
}

/**
 * Submit a form for processing
 * This marks a draft form as submitted
 */
export async function submitFormForProcessing(registryId: string) {
  try {
    // Simulate processing
    console.log(`[Mock] Submitting form ${registryId} for processing`);

    // Return mock result
    return {
      registryId,
      status: "submitted",
      submittedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error submitting form for processing:", error);
    toast.error("Error submitting form for processing");
    throw error;
  }
}

/**
 * Add form data fields to a form submission
 * This allows storing additional structured data related to the form
 */
export async function addFormDataFields(
  registryId: string,
  fields: FormDataField[]
) {
  try {
    console.log(
      `[Mock] Adding ${fields.length} fields to registry ${registryId}`
    );

    // Return mock result
    return fields.map((field, index) => ({
      mappingId: `mock-field-${index}-${Date.now()}`,
      registryId,
      fieldKey: field.fieldKey,
      fieldValue: field.fieldValue,
      fieldArrayValue: field.fieldArrayValue,
    }));
  } catch (error) {
    console.error("Error adding form data fields:", error);
    toast.error("Error adding form data fields");
    throw error;
  }
}

/**
 * Checks if a form submission registry already exists for a specific application and source type,
 * if not, creates a new one.
 */
export async function checkAndRegisterFormSubmission(input: {
  userId: string;
  sourceType: any;
  sourceId: string;
  ipApplicationId?: string;
  title?: string;
  description?: string;
  inventorsCreators?: any[];
  applicants?: any[];
}): Promise<{ registryId: string; status: string; existed: boolean }> {
  try {
    // Simulate checking for existence
    console.log("[Mock] Checking for existing registry:", input);

    // For client-side, we'll always create a new one
    const mockResult = await registerFormSubmission(
      input as FormSubmissionData
    );

    return {
      registryId: mockResult.registryId,
      status: "draft",
      existed: false,
    };
  } catch (error) {
    console.error("Error in checkAndRegisterFormSubmission:", error);
    toast.error("Error checking and registering form submission");
    throw error;
  }
}
