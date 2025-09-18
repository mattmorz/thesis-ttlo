import { z } from "zod";
import {
  applicationStatus,
  applicationType,
} from "@/drizzle/migrations/schema";

// Updated schema to better align with database fields
export const baseInventorySchema = z
  .object({
    // Core identification
    id: z.string().uuid().optional(),
    applicationId: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),

    // Basic project information
    title: z.string().min(1, { message: "Title is required" }),
    description: z.string().optional(),

    // IP specific information
    ipType: z.enum([
      "patent",
      "copyright",
      "trademark",
      "utility_model",
    ] as const),
    status: z.enum([
      "draft",
      "pending",
      "in_progress",
      "approved",
      "rejected",
      "completed",
      "archived",
    ] as const),
    progress: z.number().min(0).max(100).default(0),

    // Contributors information
    inventors: z
      .array(
        z.object({
          name: z.string().min(1, { message: "Inventor name is required" }),
          id: z.string().uuid().optional(),
          role: z
            .enum([
              "Lead Inventor",
              "Co-Inventor",
              "Researcher",
              "Project Staff",
            ])
            .optional(),
        })
      )
      .min(1, { message: "At least one inventor is required" }),

    // Project classification
    field: z.enum(["Chemical", "Mechanical", "Software", "Other"]),
    researchField: z.string().optional(),
    technicalField: z.array(z.string()).optional(),
    keywords: z.array(z.string()).optional(),

    // Organizational information
    department: z.string().optional(),
    faculty: z.string().optional(),

    // Funding information
    fundingSource: z.enum([
      "DOST",
      "PCAARRD",
      "CSU-funded",
      "Thesis",
      "Private",
      "Other",
    ]),
    fundingType: z.string().optional(),
    grantNumber: z.string().optional(),

    // Dates
    startDate: z.string(),
    endDate: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),

    // Commercialization
    commercializationStatus: z
      .enum([
        "not_licensed",
        "licensed",
        "in_negotiation",
        "technology_transfer",
        "internal_use",
      ])
      .optional()
      .default("not_licensed"),

    // Enrollment status (for staff assignment)
    isAssigned: z.boolean().optional(),
    assignedStaffCount: z.number().optional().default(0),
    assignedTo: z
      .array(
        z.object({
          userId: z.string().uuid(),
          name: z.string(),
          role: z.string(),
          enrollmentId: z.string().uuid().optional(),
          joinedAt: z.string().optional(),
        })
      )
      .optional(),

    // Applicant information
    applicantName: z.string().optional(),
    applicantEmail: z.string().optional(),
    applicantRole: z.string().optional(),

    // Add affiliation information
    companyName: z.string().optional(),
    collegeName: z.string().optional(),
    departmentName: z.string().optional(),
  })
  .strict();

export type BaseInventoryType = z.infer<typeof baseInventorySchema>;

// Form submission schema
export const inventoryFormSchema = baseInventorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isAssigned: true,
  assignedTo: true,
  applicationId: true,
  userId: true,
});

export type InventoryFormType = z.infer<typeof inventoryFormSchema>;

// Filtering schema
export const inventoryFilterSchema = z.object({
  ipType: z
    .enum(["patent", "copyright", "trademark", "utility_model", "all"] as const)
    .optional(),
  status: z.string().optional(),
  field: z.string().optional(),
  fundingSource: z.string().optional(),
  department: z.string().optional(),
  assignmentStatus: z
    .enum(["assigned", "unassigned", "all"] as const)
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  companyName: z.string().optional(),
  collegeName: z.string().optional(),
  departmentName: z.string().optional(),
});

export type InventoryFilterType = z.infer<typeof inventoryFilterSchema>;
