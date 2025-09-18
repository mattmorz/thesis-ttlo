import { z } from "zod";

export const otherIpTypesFilterSchema = z.object({
  status: z.string().optional().default("all"),
  search: z.string().optional().default(""),
});

export type OtherIpTypesFilterType = z.infer<typeof otherIpTypesFilterSchema>;

export const otherIpTypesInventorySchema = z.object({
  disclosureId: z.string().uuid(),
  clientId: z.string().uuid().optional(),
  email: z.string().email().optional(),
  isRightfulOwner: z.boolean().optional(),
  status: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  authorizedRepresentative: z.string().optional().nullable(),
  selectedIpTypes: z
    .object({
      industrialDesign: z.boolean().optional(),
      copyright: z.boolean().optional(),
      patent: z.boolean().optional(),
      trademark: z.boolean().optional(),
      tradeSecret: z.boolean().optional(),
      utilityModel: z.boolean().optional(),
      other: z.boolean().optional(),
      notSure: z.boolean().optional(),
    })
    .optional(),
  otherIpType: z.string().optional().nullable(),
  confirmation: z
    .object({
      confirmationId: z.string().optional(),
      writtenDisclosures: z
        .object({
          past: z.boolean().optional(),
          planned: z.boolean().optional(),
          notApplicable: z.boolean().optional(),
        })
        .optional(),
      oralDisclosures: z
        .object({
          past: z.boolean().optional(),
          planned: z.boolean().optional(),
          notApplicable: z.boolean().optional(),
        })
        .optional(),
      futureWork: z.string().optional(),
      confirmationDeclaration: z.boolean().optional(),
    })
    .optional(),
});

export type OtherIpTypesInventoryType = z.infer<
  typeof otherIpTypesInventorySchema
>;
