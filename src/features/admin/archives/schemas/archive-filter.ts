import * as z from "zod";

export const archiveFiltersSchema = z.object({
  search: z.string().optional(),
  formType: z.string().min(1).optional(),
  ipType: z
    .union([
      z.literal("all"),
      z.literal("patent"),
      z.literal("copyright"),
      z.literal("trademark"),
      z.literal("utility_model"),
    ])
    .optional(),
  jurisdiction: z.string().min(1).optional(),
  commercializationStatus: z.string().optional(),
  dateRange: z
    .object({
      from: z.coerce.date(),
      to: z.coerce.date(),
    })
    .nullable()
    .optional(),
  inventorName: z.string().optional(),
  department: z.string().optional(),
});

export type ArchiveFilters = z.infer<typeof archiveFiltersSchema>;
