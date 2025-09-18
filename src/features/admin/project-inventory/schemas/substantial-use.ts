import { z } from "zod";

// Schema that matches the database substantial_use table structure
export const substantialUseSchema = z.object({
  substantialUseId: z.string().uuid().optional(), // Will be auto-generated for new entries
  userId: z.string().uuid().optional(),
  applicationId: z.string().uuid().optional(),
  researchTitle: z.string().min(1, { message: "Research title is required" }),
  applicants: z
    .array(
      z.object({
        date: z.string().optional(),
        firstName: z.string().min(1, { message: "First name is required" }),
        lastName: z.string().min(1, { message: "Last name is required" }),
        middleInitial: z.string().optional(),
      })
    )
    .default([]),
  laboratoryFacilities: z
    .object({
      experimentalApparatus: z.boolean().default(false),
      labInstruments: z.boolean().default(false),
      dataAnalysisTools: z.boolean().default(false),
      technicalSupport: z.boolean().default(false),
      farmMachineShop: z.boolean().default(false),
      specializedSoftware: z.object({
        checked: z.boolean().default(false),
        specification: z.string().default(""),
      }),
      other: z.object({
        checked: z.boolean().default(false),
        specification: z.string().default(""),
      }),
    })
    .or(z.string())
    .default({
      experimentalApparatus: false,
      labInstruments: false,
      dataAnalysisTools: false,
      technicalSupport: false,
      farmMachineShop: false,
      specializedSoftware: { checked: false, specification: "" },
      other: { checked: false, specification: "" },
    }),
  fundingResources: z
    .object({
      personalFunds: z.boolean().default(false),
      grantsAndWages: z.boolean().default(false),
      scholarships: z.boolean().default(false),
      industryPartnerships: z.boolean().default(false),
      collaboration: z.boolean().default(false),
      other: z.object({
        checked: z.boolean().default(false),
        specification: z.string().default(""),
      }),
    })
    .or(z.string())
    .default({
      personalFunds: false,
      grantsAndWages: false,
      scholarships: false,
      industryPartnerships: false,
      collaboration: false,
      other: { checked: false, specification: "" },
    }),
  remarks: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  status: z
    .enum(["draft", "submitted", "approved", "rejected"])
    .default("draft"),
});

export type SubstantialUseType = z.infer<typeof substantialUseSchema>;

// Form submission schema
export const substantialUseFormSchema = substantialUseSchema.omit({
  substantialUseId: true,
  createdAt: true,
  updatedAt: true,
});

export type SubstantialUseFormType = z.infer<typeof substantialUseFormSchema>;

// Filter schema for substantial use
export const substantialUseFilterSchema = z.object({
  status: z
    .enum(["draft", "submitted", "approved", "rejected", "all"])
    .optional()
    .default("all"),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  userId: z.string().uuid().optional(),
  applicationId: z.string().uuid().optional(),
});

export type SubstantialUseFilterType = z.infer<
  typeof substantialUseFilterSchema
>;
