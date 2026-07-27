import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { v4 as uuid } from "uuid";
import { db } from "@/drizzle/db"; // Updated path to use the drizzle DB
// Import from the real schema in migrations
import {
  ipApplication,
  formSubmissionRegistry,
  applicationPhase,
} from "@/drizzle/migrations/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { type Session } from "next-auth";
import {
  type NormalizedIpTypes,
  deriveIpTypesFromApplicationIpType,
  getPrimaryApplicationIpType,
  normalizeIpTypes,
} from "@/lib/utils/ip-types";

// Updated Context type to match the actual context structure
interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
}

type Context = {
  session: Session | null | { user: User };
  req: Request;
  res?: Response;
};

// Revised Application interface to match the actual structure from the database
interface Application {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  ipType: string;
  otherIpType: string | null;
  selectedIpTypes: NormalizedIpTypes | null;
  createdAt: string | null;
  updatedAt: string | null;
  phases: {
    id: string;
    applicationId: string;
    phase: string;
    status: string;
    createdAt: string | null;
    updatedAt: string | null;
  }[];
}

// Revised Submission interface to match the actual structure from the database
interface Submission {
  id: string;
  registryId: string;
  formId: string;
  status: string;
  data: unknown;
  createdAt: string | null;
  updatedAt: string | null;
}

export const formIntegrationRouter = createTRPCRouter({
  // Get all IP applications for a user
  getUserApplications: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async (opts) => {
      const { ctx, input } = opts;
      try {
        if (process.env.NODE_ENV === "development") {
          console.log("[server:getUserApplications] query start", {
            requestedUserId: input.userId,
            sessionUserId: ctx.session?.user?.id ?? null,
          });
        }
        const apps = await db.query.ipApplication.findMany({
          where: eq(ipApplication.userId, input.userId),
          orderBy: [desc(ipApplication.createdAt)],
        });

        if (process.env.NODE_ENV === "development") {
          console.log("[server:getUserApplications] query result", {
            requestedUserId: input.userId,
            count: apps.length,
            applicationIds: apps.map((app) => app.id),
          });
        }
        return apps.map((app) => {
          const selectedIpTypes = app.selectedIpTypes
            ? normalizeIpTypes(
                app.selectedIpTypes as Partial<NormalizedIpTypes>,
              )
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
            otherIpType: app.otherIpType || null,
            selectedIpTypes:
              selectedIpTypes ??
              deriveIpTypesFromApplicationIpType(app.ipType).ipTypes,
          };
        });
      } catch (error) {
        console.error("Error getting user applications:", error);
        throw new Error("Failed to get user applications");
      }
    }),

  // Create a new IP application
  createApplication: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        title: z.string(),
        description: z.string().optional(),
        otherIpType: z.string().optional(),
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
      }),
    )
    .mutation(async (opts) => {
      const { ctx, input } = opts;
      try {
        const authenticatedUserId = ctx.session?.user?.id;
        if (!authenticatedUserId) {
          throw new Error("User not authenticated");
        }

        const resolvedUserId = authenticatedUserId;

        const newAppId = uuid();

        const selectedIpTypes = input.selectedIpTypes
          ? normalizeIpTypes(input.selectedIpTypes)
          : deriveIpTypesFromApplicationIpType(input.ipType).ipTypes;
        const otherIpType =
          input.ipType === "other" ? input.otherIpType?.trim() || null : null;

        // Insert the new application
        await db.insert(ipApplication).values({
          id: newAppId,
          userId: resolvedUserId,
          title: input.title,
          description: input.description || null,
          status: "draft",
          progress: 0,
          ipType: getPrimaryApplicationIpType(selectedIpTypes),
          otherIpType,
          selectedIpTypes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Create initial application phase
        await db.insert(applicationPhase).values({
          phaseId: uuid(),
          applicationId: newAppId,
          title: "Initial Phase",
          description: "Initial phase for new application",
          status: "pending",
          startDate: new Date().toISOString().split("T")[0], // Format as YYYY-MM-DD
          endDate: new Date(new Date().setMonth(new Date().getMonth() + 3))
            .toISOString()
            .split("T")[0], // Format as YYYY-MM-DD
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Return the created application
        return {
          id: newAppId,
          title: input.title,
          description: input.description,
          status: "draft",
          progress: 0,
          ipType: getPrimaryApplicationIpType(selectedIpTypes),
          otherIpType,
          selectedIpTypes,
          createdAt: new Date().toISOString(),
        };
      } catch (error) {
        console.error("Error creating application:", error);
        throw new Error("Failed to create application");
      }
    }),

  // Set the active application for form submissions
  setActiveApplication: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
      }),
    )
    .mutation(async (opts) => {
      const { ctx, input } = opts;
      try {
        // First check if the application exists and belongs to the user
        const userId = ctx.session?.user?.id;
        if (!userId) {
          throw new Error("User not authenticated");
        }

        const app = await db.query.ipApplication.findFirst({
          where: and(
            eq(ipApplication.id, input.applicationId),
            eq(ipApplication.userId, userId),
          ),
        });

        if (!app) {
          throw new Error("Application not found or not authorized");
        }

        // Update the user's session with the active application ID
        // This can be used by frontend components to know which application is active
        // You can implement this using cookies or session storage

        return {
          success: true,
          applicationId: input.applicationId,
        };
      } catch (error) {
        console.error("Error setting active application:", error);
        throw new Error("Failed to set active application");
      }
    }),

  // Get all form submissions for a specific application
  getApplicationSubmissions: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
      }),
    )
    .query(async (opts) => {
      const { ctx, input } = opts;
      try {
        // Get all submissions related to this application through the registry
        const registry = await db.query.formSubmissionRegistry.findFirst({
          where: eq(
            formSubmissionRegistry.ipApplicationId,
            input.applicationId,
          ),
          // Since formSubmission doesn't exist in the schema, we need to handle this differently
          // We'll remove the with clause for now
        });

        if (!registry) {
          return [];
        }

        // Since we can't use submissions directly, return just the registry
        return [registry];
      } catch (error) {
        console.error("Error getting application submissions:", error);
        throw new Error("Failed to get application submissions");
      }
    }),

  // Update an application's status or details
  updateApplication: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        ipType: z
          .enum([
            "patent",
            "copyright",
            "trademark",
            "utility_model",
            "industrial_design",
            "trade_secret",
            "not_sure",
            "other",
          ])
          .optional(),
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
        otherIpType: z.string().optional(),
        status: z
          .enum(["draft", "pending", "in_progress", "approved", "rejected"])
          .optional(),
        progress: z.number().min(0).max(100).optional(),
      }),
    )
    .mutation(async (opts) => {
      const { ctx, input } = opts;
      try {
        // Verify ownership
        const userId = ctx.session?.user?.id;
        if (!userId) {
          throw new Error("User not authenticated");
        }

        const app = await db.query.ipApplication.findFirst({
          where: and(
            eq(ipApplication.id, input.applicationId),
            eq(ipApplication.userId, userId),
          ),
        });

        if (!app) {
          throw new Error("Application not found or not authorized");
        }

        // Update only provided fields
        const updateData: Partial<typeof ipApplication.$inferInsert> = {
          updatedAt: new Date().toISOString(),
        };

        if (input.title) updateData.title = input.title;
        if (input.description !== undefined)
          updateData.description = input.description;
        if (input.otherIpType !== undefined) {
          updateData.otherIpType = input.otherIpType.trim() || null;
        }
        if (input.selectedIpTypes) {
          const normalizedIpTypes = normalizeIpTypes(input.selectedIpTypes);
          updateData.selectedIpTypes = normalizedIpTypes;
          updateData.ipType = getPrimaryApplicationIpType(normalizedIpTypes);
        } else if (input.ipType) {
          updateData.ipType = input.ipType;
          updateData.selectedIpTypes = deriveIpTypesFromApplicationIpType(
            input.ipType,
          ).ipTypes;
        }
        if (input.status) updateData.status = input.status;
        if (input.progress !== undefined) updateData.progress = input.progress;

        await db
          .update(ipApplication)
          .set(updateData)
          .where(eq(ipApplication.id, input.applicationId));

        return {
          success: true,
          applicationId: input.applicationId,
        };
      } catch (error) {
        console.error("Error updating application:", error);
        throw new Error("Failed to update application");
      }
    }),

  // Delete an application and all related submissions
  deleteApplication: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
      }),
    )
    .mutation(async (opts) => {
      const { ctx, input } = opts;
      try {
        const userId = ctx.session?.user?.id;
        if (!userId) {
          throw new Error("User not authenticated");
        }

        const app = await db.query.ipApplication.findFirst({
          where: and(
            eq(ipApplication.id, input.applicationId),
            eq(ipApplication.userId, userId),
          ),
          columns: { id: true },
        });

        if (!app) {
          throw new Error("Application not found or not authorized");
        }

        await db.transaction(async (tx) => {          // Manually cascade delete related records in case the DB doesn't have ON DELETE CASCADE configured.
          // We use DO blocks so that if a table or column doesn't exist in the current schema state,
          // the error is caught and ignored, allowing the deletion to proceed.
          const cascadeQueries = [
            `DO $$ BEGIN DELETE FROM tracking_code WHERE ip_application_id = '${input.applicationId}'; EXCEPTION WHEN OTHERS THEN END $$;`,
            `DO $$ BEGIN DELETE FROM ip_application_notification WHERE ip_application_id = '${input.applicationId}'; EXCEPTION WHEN OTHERS THEN END $$;`,
            `DO $$ BEGIN DELETE FROM ip_application_enrollment WHERE application_id = '${input.applicationId}'; EXCEPTION WHEN OTHERS THEN END $$;`,
            `DO $$ BEGIN DELETE FROM documents WHERE application_id = '${input.applicationId}'; EXCEPTION WHEN OTHERS THEN END $$;`,
            `DO $$ BEGIN DELETE FROM other_documents WHERE ip_application_id = '${input.applicationId}'; EXCEPTION WHEN OTHERS THEN END $$;`,
            `DO $$ BEGIN DELETE FROM substantial_use WHERE application_id = '${input.applicationId}'; EXCEPTION WHEN OTHERS THEN END $$;`,
            `DO $$ BEGIN DELETE FROM archives WHERE application_id = '${input.applicationId}'; EXCEPTION WHEN OTHERS THEN END $$;`,
            `DO $$ BEGIN DELETE FROM activity_log WHERE application_id = '${input.applicationId}'; EXCEPTION WHEN OTHERS THEN END $$;`,
            `DO $$ BEGIN DELETE FROM deed_of_assignment WHERE application_id = '${input.applicationId}'; EXCEPTION WHEN OTHERS THEN END $$;`,
            `DO $$ BEGIN DELETE FROM document_management WHERE application_id = '${input.applicationId}'; EXCEPTION WHEN OTHERS THEN END $$;`,
            `DO $$ BEGIN DELETE FROM ip_contributors WHERE application_id = '${input.applicationId}'; EXCEPTION WHEN OTHERS THEN END $$;`,
            `DO $$ BEGIN DELETE FROM ip_details WHERE application_id = '${input.applicationId}'; EXCEPTION WHEN OTHERS THEN END $$;`,
            `DO $$ BEGIN DELETE FROM calendar_event WHERE application_id = '${input.applicationId}'; EXCEPTION WHEN OTHERS THEN END $$;`,
            `DO $$ BEGIN DELETE FROM calendar_event WHERE project_id = '${input.applicationId}'; EXCEPTION WHEN OTHERS THEN END $$;`,
            `DO $$ BEGIN DELETE FROM application_phase WHERE application_id = '${input.applicationId}'; EXCEPTION WHEN OTHERS THEN END $$;`,
            `DO $$ BEGIN DELETE FROM form_submission_registry WHERE ip_application_id = '${input.applicationId}'; EXCEPTION WHEN OTHERS THEN END $$;`,
          ];

          for (const query of cascadeQueries) {
            try {
              await tx.execute(sql.raw(query));
            } catch (err) {
              console.warn("Cascade delete error ignored:", err);
            }
          }

          const deleted = await tx
            .delete(ipApplication)
            .where(
              and(
                eq(ipApplication.id, input.applicationId),
                eq(ipApplication.userId, userId),
              ),
            )
            .returning({ id: ipApplication.id });

          if (deleted.length === 0) {
            throw new Error("Application not found or not authorized");
          }
        });

        return {
          success: true,
        };
      } catch (error) {
        console.error("Error deleting application:", error);
        const message =
          error instanceof Error
            ? error.message
            : "Failed to delete application";
        throw new Error(message);
      }
    }),
});
