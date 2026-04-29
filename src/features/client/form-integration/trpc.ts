import { publicProcedure, router } from "@/trpc/init";
import { z } from "zod";
import * as formSubmissionService from "@/lib/services/form-submission-service";
// Import the server router to access methods like getUserApplications
import { formIntegrationRouter as serverRouter } from "@/server/api/routers/form-integration";
import { v4 as uuid } from "uuid";
import { db } from "@/drizzle/db";
// Import from the real schema
import {
  ipApplication,
  applicationPhase,
  ipDisclosure,
} from "@/drizzle/migrations/schema";
import { eq, desc, inArray } from "drizzle-orm";
import {
  type NormalizedIpTypes,
  deriveIpTypesFromApplicationIpType,
  getPrimaryApplicationIpType,
  hasSelectedIpTypes,
  normalizeIpTypes,
} from "@/lib/utils/ip-types";

const normalizeSelectedIpTypes = (value: unknown): NormalizedIpTypes | null => {
  const parseValue = (input: unknown): Record<string, unknown> | null => {
    if (!input) return null;
    if (typeof input === "string") {
      try {
        return JSON.parse(input) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
    if (typeof input === "object") {
      return input as Record<string, unknown>;
    }
    return null;
  };

  const parsed = parseValue(value);
  const nestedApplicantsInfo = parseValue(parsed?.applicantsInfo);
  const rawTypes =
    parseValue(nestedApplicantsInfo?.ipTypes) ??
    parseValue(parsed?.selectedIpTypes) ??
    parsed;

  const normalized = normalizeIpTypes(rawTypes as Partial<NormalizedIpTypes> | null);
  return hasSelectedIpTypes(normalized) ? normalized : null;
};

export const formIntegrationRouter = router({
  /**
   * Get all IP applications for a user
   * Now with improved error handling and input validation
   */
  getUserApplications: publicProcedure
    .input(
      z.object({
        userId: z.string().optional().default(""),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Ensure we have a userId to work with
        if (!input.userId && ctx.session?.user?.id) {
          input.userId = ctx.session.user.id;
        }

        // If we still don't have a valid userId, return empty array
        if (!input.userId) {
          console.log("getUserApplications: No userId provided");
          return [];
        }

        try {
          // Call the server router getUserApplications endpoint
          const userId = input.userId || "";
          const apps = await db.query.ipApplication.findMany({
            where: (ipApp: any) => eq(ipApp.userId, userId),
            orderBy: (ipApp: any) => [desc(ipApp.createdAt)],
            // Remove the phases relation temporarily to avoid the error
          });

          const appIds = apps.map((app: any) => app.id);
          const disclosures =
            appIds.length > 0
              ? await db
                  .select({
                    applicationId: ipDisclosure.applicationId,
                    selectedIpTypes: ipDisclosure.selectedIpTypes,
                  })
                  .from(ipDisclosure)
                  .where(inArray(ipDisclosure.applicationId, appIds))
                  .orderBy(desc(ipDisclosure.updatedAt))
              : [];

          const selectedIpTypesByApplication = new Map<string, ReturnType<typeof normalizeSelectedIpTypes>>();
          for (const disclosure of disclosures) {
            if (
              disclosure.applicationId &&
              !selectedIpTypesByApplication.has(disclosure.applicationId)
            ) {
              selectedIpTypesByApplication.set(
                disclosure.applicationId,
                normalizeSelectedIpTypes(disclosure.selectedIpTypes)
              );
            }
          }

          return apps.map((app: any) => {
            const normalizedApplicationIpTypes = app.selectedIpTypes
              ? normalizeSelectedIpTypes(app.selectedIpTypes)
              : null;

            return {
              id: app.id,
              title: app.title,
              description: app.description,
              status: app.status,
              progress: app.progress,
              createdAt: app.createdAt
                ? new Date(app.createdAt).toISOString()
                : null,
              ipType: app.ipType,
              selectedIpTypes:
                normalizedApplicationIpTypes ??
                selectedIpTypesByApplication.get(app.id) ??
                deriveIpTypesFromApplicationIpType(app.ipType).ipTypes,
            };
          });
        } catch (error) {
          console.error("Error getting applications from DB:", error);
          return [];
        }
      } catch (error) {
        console.error("Error in getUserApplications:", error);
        // Return empty array instead of throwing to avoid breaking the UI
        return [];
      }
    }),

  /**
   * Create a new IP application
   * Now with improved error handling and state management to prevent looping
   */
  createApplication: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        ipType: z.enum([
          "patent",
          "copyright",
          "trademark",
          "utility_model",
          "industrial_design",
          "trade_secret",
          "not_sure",
          "other",
        ]),
        selectedIpTypes: z
          .object({
            copyright: z.boolean().default(false),
            patent: z.boolean().default(false),
            utilityModel: z.boolean().default(false),
            industrialDesign: z.boolean().default(false),
            trademark: z.boolean().default(false),
            tradeSecret: z.boolean().default(false),
            other: z.boolean().default(false),
            notSure: z.boolean().default(false),
          })
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Ensure we have a valid session
        if (!ctx.session?.user) {
          console.error("createApplication: No authenticated session found");
          throw new Error("You must be logged in to create an application");
        }

        // Log operation start with a unique identifier for tracing
        const operationId = Math.random().toString(36).substring(2, 10);
        console.log(
          `[${operationId}] Creating new application for user ${input.userId}`
        );

        // Verify the userId matches the authenticated user
        if (input.userId !== ctx.session?.user?.id) {
          console.warn(
            `[${operationId}] User ID mismatch, using authenticated user ID instead`
          );
          if (ctx.session?.user?.id) {
            input.userId = ctx.session.user.id;
          }
        }

        const selectedIpTypes = input.selectedIpTypes
          ? normalizeIpTypes(input.selectedIpTypes)
          : deriveIpTypesFromApplicationIpType(input.ipType).ipTypes;

        // Create the application directly with the database
        const newAppId = uuid();
        console.log(
          `[${operationId}] Generated new application ID: ${newAppId}`
        );

        try {
          // Insert the new application
          await db.insert(ipApplication).values({
            id: newAppId,
            userId: input.userId,
            title: input.title,
            description: input.description || null,
            status: "draft" as const,
            progress: 0,
            ipType: getPrimaryApplicationIpType(selectedIpTypes),
            selectedIpTypes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          console.log(
            `[${operationId}] Successfully inserted application record`
          );

          // Create initial application phase
          await db.insert(applicationPhase).values({
            phaseId: uuid(),
            applicationId: newAppId,
            title: "Initial Phase",
            description: "Initial phase for new application",
            status: "pending",
            startDate: new Date().toISOString().split("T")[0],
            endDate: new Date(new Date().setMonth(new Date().getMonth() + 3))
              .toISOString()
              .split("T")[0],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          console.log(`[${operationId}] Successfully created initial phase`);

          // Return the created application
          const result = {
            id: newAppId,
            title: input.title,
            description: input.description || null,
            status: "draft" as const,
            progress: 0,
            ipType: getPrimaryApplicationIpType(selectedIpTypes),
            selectedIpTypes,
            createdAt: new Date().toISOString(),
          };

          console.log(
            `[${operationId}] Application creation completed successfully`
          );
          return result;
        } catch (dbError) {
          console.error(`[${operationId}] Database error:`, dbError);
          // Fix for TypeScript error: dbError is of type 'unknown'
          const errorMessage =
            dbError instanceof Error
              ? dbError.message
              : "Unknown database error";

          throw new Error(
            `Failed to create application in database: ${errorMessage}`
          );
        }
      } catch (error) {
        console.error("Error in createApplication:", error);
        throw error; // Preserve the error for client-side handling
      }
    }),

  /**
   * Set active application
   * Re-exports the endpoint from the server API router
   */
  setActiveApplication: serverRouter.setActiveApplication,

  /**
   * Get application submissions
   * Re-exports the endpoint from the server API router
   */
  getApplicationSubmissions: serverRouter.getApplicationSubmissions,

  /**
   * Update application
   * Re-exports the endpoint from the server API router
   */
  updateApplication: serverRouter.updateApplication,

  /**
   * Delete application
   * Re-exports the endpoint from the server API router
   */
  deleteApplication: serverRouter.deleteApplication,

  /**
   * Register a form submission for tracking
   */
  registerSubmission: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        sourceType: z.enum([
          "client_profile",
          "ip_disclosure",
          "substantial_use",
          "deed_of_assignment",
          "other_document",
        ]),
        sourceId: z.string().uuid(),
        title: z.string().optional(),
        description: z.string().optional(),
        inventorsCreators: z
          .array(
            z.object({
              name: z.string(),
              role: z.string().optional(),
            })
          )
          .optional(),
        applicants: z
          .array(
            z.object({
              name: z.string(),
              role: z.string().optional(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await formSubmissionService.registerFormSubmission(input);
    }),

  /**
   * Submit a form for processing to create an IP application
   */
  submitForProcessing: publicProcedure
    .input(z.object({ registryId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return await formSubmissionService.submitFormForProcessing(
        input.registryId
      );
    }),

  /**
   * Add data mappings to a form submission
   */
  addFormDataFields: publicProcedure
    .input(
      z.object({
        registryId: z.string().uuid(),
        fields: z.array(
          z.object({
            fieldKey: z.string(),
            fieldValue: z.string().optional(),
            fieldArrayValue: z.any().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      return await formSubmissionService.addFormDataFields(
        input.registryId,
        input.fields
      );
    }),

  /**
   * Get form submission by source
   */
  getBySource: publicProcedure
    .input(
      z.object({
        sourceType: z.enum([
          "client_profile",
          "ip_disclosure",
          "substantial_use",
          "deed_of_assignment",
          "other_document",
        ]),
        sourceId: z.string().uuid(),
      })
    )
    .query(async ({ input }) => {
      return await formSubmissionService.getFormSubmissionBySource(
        input.sourceType,
        input.sourceId
      );
    }),

  /**
   * Get form submission by ID
   */
  getById: publicProcedure
    .input(z.object({ registryId: z.string().uuid() }))
    .query(async ({ input }) => {
      return await formSubmissionService.getFormSubmissionById(
        input.registryId
      );
    }),

  /**
   * Get all form submissions for a user
   */
  getUserSubmissions: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ input }) => {
      return await formSubmissionService.getUserFormSubmissions(input.userId);
    }),

  /**
   * Retry a failed form submission
   */
  retryFailedSubmission: publicProcedure
    .input(z.object({ registryId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return await formSubmissionService.retryFailedSubmission(
        input.registryId
      );
    }),
});
