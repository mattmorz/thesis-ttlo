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
import { eq, and, desc } from "drizzle-orm";
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
      })
    )
    .query(async (opts) => {
      const { ctx, input } = opts;
      try {
        const apps = await db.query.ipApplication.findMany({
          where: eq(ipApplication.userId, input.userId),
          orderBy: [desc(ipApplication.createdAt)],
        });

        return apps.map((app) => {
          const selectedIpTypes = app.selectedIpTypes
            ? normalizeIpTypes(
                app.selectedIpTypes as Partial<NormalizedIpTypes>
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
    .mutation(async (opts) => {
      const { ctx, input } = opts;
      try {
        const newAppId = uuid();

        const selectedIpTypes = input.selectedIpTypes
          ? normalizeIpTypes(input.selectedIpTypes)
          : deriveIpTypesFromApplicationIpType(input.ipType).ipTypes;

        // Insert the new application
        await db.insert(ipApplication).values({
          id: newAppId,
          userId: input.userId,
          title: input.title,
          description: input.description || null,
          status: "draft",
          progress: 0,
          ipType: getPrimaryApplicationIpType(selectedIpTypes),
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
      })
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
            eq(ipApplication.userId, userId)
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
      })
    )
    .query(async (opts) => {
      const { ctx, input } = opts;
      try {
        // Get all submissions related to this application through the registry
        const registry = await db.query.formSubmissionRegistry.findFirst({
          where: eq(
            formSubmissionRegistry.ipApplicationId,
            input.applicationId
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
        status: z
          .enum(["draft", "pending", "in_progress", "approved", "rejected"])
          .optional(),
        progress: z.number().min(0).max(100).optional(),
      })
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
            eq(ipApplication.userId, userId)
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
        if (input.selectedIpTypes) {
          const normalizedIpTypes = normalizeIpTypes(input.selectedIpTypes);
          updateData.selectedIpTypes = normalizedIpTypes;
          updateData.ipType = getPrimaryApplicationIpType(normalizedIpTypes);
        } else if (input.ipType) {
          updateData.ipType = input.ipType;
          updateData.selectedIpTypes =
            deriveIpTypesFromApplicationIpType(input.ipType).ipTypes;
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
      })
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
            eq(ipApplication.userId, userId)
          ),
          columns: { id: true },
        });

        if (!app) {
          throw new Error("Application not found or not authorized");
        }

        await db.transaction(async (tx) => {
          await tx
            .delete(formSubmissionRegistry)
            .where(
              eq(formSubmissionRegistry.ipApplicationId, input.applicationId)
            );

          const deleted = await tx
            .delete(ipApplication)
            .where(
              and(
                eq(ipApplication.id, input.applicationId),
                eq(ipApplication.userId, userId)
              )
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
          error instanceof Error ? error.message : "Failed to delete application";
        throw new Error(message);
      }
    }),
});
