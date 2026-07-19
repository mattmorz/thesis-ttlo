import { toast } from "sonner";

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

export async function registerFormSubmission(data: FormSubmissionData) {
  throw new Error("registerFormSubmission mock service is disabled in production.");
}

export async function submitFormForProcessing(registryId: string) {
  throw new Error("submitFormForProcessing mock service is disabled in production.");
}

export async function addFormDataFields(
  registryId: string,
  fields: FormDataField[]
) {
  throw new Error("addFormDataFields mock service is disabled in production.");
}

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
  throw new Error("checkAndRegisterFormSubmission mock service is disabled in production.");
}
