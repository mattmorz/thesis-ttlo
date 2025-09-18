import { z } from "zod";

// Schema that matches the database client_profile table structure
export const clientProfileSchema = z.object({
  clientId: z.string().uuid().optional(), // Will be auto-generated for new profiles
  userId: z.string().uuid().optional(),
  firstName: z.string().min(1, { message: "First name is required" }),
  middleName: z.string().optional(),
  lastName: z.string().min(1, { message: "Last name is required" }),
  contactNumber: z.string().optional(),
  email: z.string().email({ message: "Invalid email format" }),
  mailingAddress: z.string().optional(),
  companyName: z.string().optional(),
  companyEmail: z.string().email().optional(),
  occupation: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  age: z.number().int().positive().optional(),
  companyStreet: z.string().optional(),
  companyBarangay: z.string().optional(),
  companyCityMunicipality: z.string().optional(),
  companyProvince: z.string().optional(),
  degree: z.string().optional(),
  profession: z.string().optional(),
  publishedResearch: z
    .object({
      value: z.enum(["yes", "no"]).default("no"),
      details: z.string().optional(),
    })
    .optional()
    .default({ value: "no" }),
  developedMaterials: z
    .object({
      value: z.enum(["yes", "no", "ongoing"]).default("no"),
      details: z.string().optional(),
    })
    .optional()
    .default({ value: "no" }),
  ipExperience: z
    .object({
      hasExperience: z.enum(["yes", "no"]),
      types: z
        .object({
          patent: z.boolean().optional(),
          copyright: z.boolean().optional(),
          trademark: z.boolean().optional(),
          utilityModel: z.boolean().optional(),
          industrialDesign: z.boolean().optional(),
          other: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
  status: z
    .enum(["draft", "active", "inactive", "pending", "submitted"])
    .default("draft"),
  gender: z
    .object({
      value: z.enum(["male", "female", "prefer_not_to_say"]),
    })
    .optional(),
  citizenship: z
    .object({
      value: z.enum(["filipino", "other"]),
      otherValue: z.string().optional().nullable(),
    })
    .optional(),
  highestDegree: z
    .object({
      value: z.enum(["bachelor", "master", "doctorate", "other"]),
      otherValue: z.string().optional().nullable(),
    })
    .optional(),
  familiarWithIpRights: z
    .object({
      value: z.enum(["yes", "no"]),
    })
    .optional(),
  ipApplicationId: z.string().uuid().optional(),
});

export type ClientProfileType = z.infer<typeof clientProfileSchema>;

// Form submission schema
export const clientProfileFormSchema = clientProfileSchema.omit({
  clientId: true,
  createdAt: true,
  updatedAt: true,
});

export type ClientProfileFormType = z.infer<typeof clientProfileFormSchema>;

// Filter schema for client profiles
export const clientProfileFilterSchema = z.object({
  status: z
    .enum(["draft", "active", "inactive", "pending", "submitted", "all"])
    .optional()
    .default("all"),
  search: z.string().optional(),
  hasDegree: z.boolean().optional(),
  hasPublishedResearch: z.boolean().optional(),
  hasIpExperience: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type ClientProfileFilterType = z.infer<typeof clientProfileFilterSchema>;
