import { z } from "zod";

// Define the schema for retrieving None IP Types inventory records
export const noneIpTypesInventorySchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  status: z.string().default("draft"),
  ipDisclosureId: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
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
});

// Define the filter schema for None IP Types
export const noneIpTypesFilterSchema = z.object({
  status: z.string().default("all"),
  search: z.string().default(""),
});

// Define pagination and sorting schema
export const noneIpTypesPaginationSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(10),
  sortBy: z.string().default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

// Export types
export type NoneIpTypesInventoryType = z.infer<
  typeof noneIpTypesInventorySchema
>;
export type NoneIpTypesFilterType = z.infer<typeof noneIpTypesFilterSchema>;
export type NoneIpTypesPaginationType = z.infer<
  typeof noneIpTypesPaginationSchema
>;
