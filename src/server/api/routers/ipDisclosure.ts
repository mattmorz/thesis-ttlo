import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../trpc";
import { db } from "@/drizzle/db";
import {
  ipDisclosure,
  ipDisclosureApplicant,
  ipDisclosureInventor,
} from "@/drizzle/migrations/schema";
import { eq } from "drizzle-orm";

export const ipDisclosureRouter = {
  createIpDisclosure: protectedProcedure
    .input(
      z.object({
        clientId: z.string().optional(),
        applicationId: z.string().uuid().optional(),
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
        applicants: z
          .array(
            z.object({
              firstName: z.string().optional(),
              middleInitial: z.string().optional(),
              lastName: z.string().optional(),
            })
          )
          .optional(),
        inventors: z
          .array(
            z.object({
              firstName: z.string().optional(),
              middleInitial: z.string().optional(),
              lastName: z.string().optional(),
            })
          )
          .optional(),
        email: z.string().email().optional(),
        isRightfulOwner: z.boolean().optional(),
        authorizedRepresentative: z.string().optional(),
        otherIpType: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to create an IP disclosure",
        });
      }

      try {
        const clientId = input.clientId || ctx.session.user.id;

        const jsonData = {
          selectedIpTypes: input.selectedIpTypes || {
            copyright: false,
            patent: false,
            utilityModel: false,
            industrialDesign: false,
            trademark: false,
            tradeSecret: false,
            other: false,
            notSure: false,
          },
          applicantsInfo: {
            applicants: input.applicants || [
              {
                firstName: "",
                middleInitial: "",
                lastName: "",
              },
            ],
            inventors: input.inventors || [
              {
                firstName: "",
                middleInitial: "",
                lastName: "",
              },
            ],
            email: input.email || "",
            isRightfulOwner: input.isRightfulOwner || false,
            authorizedRepresentative: input.authorizedRepresentative || "",
            otherIpType: input.otherIpType || "",
            ipTypes: input.selectedIpTypes || {
              copyright: false,
              patent: false,
              utilityModel: false,
              industrialDesign: false,
              trademark: false,
              tradeSecret: false,
              other: false,
              notSure: false,
            },
          },
        };

        const disclosure = await db
          .insert(ipDisclosure)
          .values({
            clientId,
            applicationId: input.applicationId,
            selectedIpTypes: JSON.stringify(jsonData),
          })
          .returning();

        if (disclosure.length > 0) {
          const createdDisclosureId = disclosure[0].disclosureId;

          const applicantsToSave = (input.applicants || []).filter(
            (person) =>
              Boolean(person?.firstName?.trim()) ||
              Boolean(person?.middleInitial?.trim()) ||
              Boolean(person?.lastName?.trim())
          );
          const inventorsToSave = (input.inventors || []).filter(
            (person) =>
              Boolean(person?.firstName?.trim()) ||
              Boolean(person?.middleInitial?.trim()) ||
              Boolean(person?.lastName?.trim())
          );

          if (applicantsToSave.length > 0) {
            await db.insert(ipDisclosureApplicant).values(
              applicantsToSave.map((person) => ({
                disclosureId: createdDisclosureId,
                firstName: person.firstName || "",
                middleInitial: person.middleInitial || null,
                lastName: person.lastName || "",
              }))
            );
          }

          if (inventorsToSave.length > 0) {
            await db.insert(ipDisclosureInventor).values(
              inventorsToSave.map((person) => ({
                disclosureId: createdDisclosureId,
                firstName: person.firstName || "",
                middleInitial: person.middleInitial || null,
                lastName: person.lastName || "",
              }))
            );
          }

          return {
            success: true,
            disclosure_id: createdDisclosureId,
            applicationId: disclosure[0].applicationId,
          };
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create IP disclosure",
        });
      } catch (error) {
        console.error("Error creating IP disclosure:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create IP disclosure",
        });
      }
    }),

  updateIpDisclosure: protectedProcedure
    .input(
      z.object({
        disclosureId: z.string().uuid(),
        status: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to update an IP disclosure",
        });
      }

      try {
        const { disclosureId, status } = input;

        const updatedDisclosure = await db
          .update(ipDisclosure)
          .set({
            status,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(ipDisclosure.disclosureId, disclosureId))
          .returning();

        if (updatedDisclosure.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "IP disclosure not found",
          });
        }

        return {
          success: true,
          disclosure: updatedDisclosure[0],
        };
      } catch (error) {
        console.error("Error updating IP disclosure:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update IP disclosure",
        });
      }
    }),
};
