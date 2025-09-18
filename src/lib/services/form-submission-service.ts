import { db, DB } from "@/drizzle/db";
import {
  formSubmissionRegistry,
  formDataMapping,
} from "@/drizzle/migrations/schema";
import { eq, and, sql } from "drizzle-orm";
import { DrizzleError } from "drizzle-orm";

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
  applicationId?: string;
}

export interface FormDataField {
  fieldKey: string;
  fieldValue?: string;
  fieldArrayValue?: any[];
}

// Type guard to check for DrizzleError
function isDrizzleError(error: unknown): error is DrizzleError {
  return error instanceof Error && "code" in error;
}

/**
 * Register a new form submission to track in the system
 * This creates a draft entry that can be submitted later
 */
export async function registerFormSubmission(data: FormSubmissionData) {
  try {
    const result = await db
      .insert(formSubmissionRegistry)
      .values({
        userId: data.userId,
        sourceType: data.sourceType as any,
        sourceId: data.sourceId,
        ipApplicationId: data.applicationId,
        title: data.title,
        description: data.description,
        inventorsCreators: data.inventorsCreators
          ? JSON.stringify(data.inventorsCreators)
          : undefined,
        applicants: data.applicants
          ? JSON.stringify(data.applicants)
          : undefined,
        status: "draft",
        createdAt: sql`CURRENT_TIMESTAMP`,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error registering form submission:", error);
    throw error;
  }
}

/**
 * Submit a form for processing
 * This marks a draft form as submitted, which will trigger the database trigger
 * to create an IP application
 */
export async function submitFormForProcessing(registryId: string) {
  try {
    const result = await db
      .update(formSubmissionRegistry)
      .set({
        status: "submitted",
        submittedAt: sql`CURRENT_TIMESTAMP`,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(formSubmissionRegistry.registryId, registryId))
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error submitting form for processing:", error);
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
    const values = fields.map((field) => ({
      registryId,
      fieldKey: field.fieldKey,
      fieldValue: field.fieldValue,
      fieldArrayValue: field.fieldArrayValue
        ? JSON.stringify(field.fieldArrayValue)
        : undefined,
    }));

    return await db.insert(formDataMapping).values(values).returning();
  } catch (error) {
    console.error("Error adding form data fields:", error);
    throw error;
  }
}

/**
 * Get form submission by source
 * Useful to check if a form has already been registered
 */
export async function getFormSubmissionBySource(
  sourceType: SourceType,
  sourceId: string,
  applicationId?: string
) {
  try {
    let query = and(
      eq(formSubmissionRegistry.sourceType, sourceType as any),
      eq(formSubmissionRegistry.sourceId, sourceId)
    );

    if (applicationId) {
      query = and(
        query,
        eq(formSubmissionRegistry.ipApplicationId, applicationId)
      );
    }

    const submissions = await db
      .select()
      .from(formSubmissionRegistry)
      .where(query);

    return submissions[0];
  } catch (error) {
    console.error("Error getting form submission by source:", error);
    throw error;
  }
}

/**
 * Get form submission by ID
 */
export async function getFormSubmissionById(registryId: string) {
  try {
    const submissions = await db
      .select()
      .from(formSubmissionRegistry)
      .where(eq(formSubmissionRegistry.registryId, registryId));

    return submissions[0];
  } catch (error) {
    console.error("Error getting form submission by ID:", error);
    throw error;
  }
}

/**
 * Get all form submissions for a user
 */
export async function getUserFormSubmissions(userId: string) {
  try {
    return await db
      .select()
      .from(formSubmissionRegistry)
      .where(eq(formSubmissionRegistry.userId, userId))
      .orderBy(formSubmissionRegistry.createdAt);
  } catch (error) {
    console.error("Error getting user form submissions:", error);
    throw error;
  }
}

/**
 * Get form data fields for a submission
 */
export async function getFormDataFields(registryId: string) {
  try {
    return await db
      .select()
      .from(formDataMapping)
      .where(eq(formDataMapping.registryId, registryId));
  } catch (error) {
    console.error("Error getting form data fields:", error);
    throw error;
  }
}

/**
 * Retry processing a failed form submission
 */
export async function retryFailedSubmission(registryId: string) {
  try {
    const result = await db
      .update(formSubmissionRegistry)
      .set({
        status: "submitted",
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(
        and(
          eq(formSubmissionRegistry.registryId, registryId),
          eq(formSubmissionRegistry.status, "failed")
        )
      )
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error retrying failed submission:", error);
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
    console.log("Checking for existing registry:", {
      userId: input.userId,
      sourceType: input.sourceType,
      ipApplicationId: input.ipApplicationId,
    });

    // First check if registry already exists
    const existingRegistry = await db.query.formSubmissionRegistry.findFirst({
      where: and(
        eq(formSubmissionRegistry.userId, input.userId),
        eq(formSubmissionRegistry.sourceType, input.sourceType),
        ...(input.ipApplicationId
          ? [eq(formSubmissionRegistry.ipApplicationId, input.ipApplicationId)]
          : [])
      ),
    });

    if (existingRegistry) {
      console.log("Found existing registry:", existingRegistry.registryId);
      return {
        registryId: existingRegistry.registryId,
        status: existingRegistry.status ?? "draft",
        existed: true,
      };
    }

    // If no existing registry found, create a new one
    console.log("No existing registry found, creating new one");
    const result = await registerFormSubmission(input);
    return {
      ...result,
      existed: false,
    };
  } catch (error) {
    console.error("Error in checkAndRegisterFormSubmission:", error);
    throw error;
  }
}
